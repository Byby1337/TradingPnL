// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";
import "../interfaces/IPyth.sol";
import "../security/AegisSentinel.sol";
import "./OptionLiquidityPool.sol";
import "../governance/PlatformTreasury.sol";

/**
 * @title OptionVault
 * @notice US-Style American 0DTE & 1-Hour Cash-Settled crypto options.
 * Features early profit taking (Instant Cash-Out), zero liquidations,
 * Pyth Network low-latency pricing, 20x max upside cap, and Aegis Sentinel defenses.
 */
contract OptionVault is AegisSentinel {
    IERC20 public immutable usdc;
    IPyth public immutable pyth;
    OptionLiquidityPool public immutable lpPool;
    PlatformTreasury public immutable treasury;

    address public pnlRouter;
    address public admin;

    uint256 public constant MAX_UPSIDE_MULTIPLIER = 20; // 20x max payout cap
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5.0% platform fee to Treasury
    uint256 public optionCount;

    enum OptionType { CALL, PUT }
    enum ExpiryType { ONE_HOUR, ZERO_DTE }

    struct OptionPosition {
        address owner;
        bytes32 pythFeedId;
        OptionType optType;
        ExpiryType expType;
        uint256 premium;
        uint256 strikePrice; // 8 decimals (matches Pyth or 1e8)
        uint256 maxPayoutCommitment;
        uint256 expiryTimestamp;
        bool isSettled;
    }

    mapping(uint256 => OptionPosition) public options;

    event OptionPurchased(uint256 indexed optionId, address indexed owner, OptionType optType, uint256 premium, uint256 strike);
    event EarlyCashOutExecuted(uint256 indexed optionId, address indexed owner, uint256 payout, int64 exitPrice);
    event OptionSettledAtExpiry(uint256 indexed optionId, uint256 payout, int64 settlementPrice);

    modifier onlyRouter() {
        require(msg.sender == pnlRouter, "OptionVault: Only PnLRouter");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "OptionVault: Not admin");
        _;
    }

    constructor(
        address _usdc,
        address _pyth,
        address _lpPool,
        address _treasury,
        address _admin
    ) {
        require(_usdc != address(0) && _admin != address(0), "OptionVault: Zero address");
        usdc = IERC20(_usdc);
        pyth = IPyth(_pyth);
        lpPool = OptionLiquidityPool(_lpPool);
        treasury = PlatformTreasury(_treasury);
        admin = _admin;
    }

    address public pendingAdmin;
    uint256 public pendingAdminEta;
    uint256 public constant ADMIN_TIMELOCK = 48 hours;
    uint256 public constant PARAM_TIMELOCK = 48 hours;

    address public pendingPnLRouter;
    uint256 public pendingPnLRouterEta;

    event AdminTransferInitiated(address indexed currentAdmin, address indexed newAdmin, uint256 effectiveEta);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferCancelled();

    event PnLRouterUpdateInitiated(address indexed newRouter, uint256 eta);
    event PnLRouterUpdated(address indexed newRouter);
    event PnLRouterUpdateCancelled();

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "OptionVault: Zero address");
        pendingAdmin = _newAdmin;
        pendingAdminEta = block.timestamp + ADMIN_TIMELOCK;
        emit AdminTransferInitiated(admin, _newAdmin, pendingAdminEta);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "OptionVault: Not pending admin");
        require(block.timestamp >= pendingAdminEta, "OptionVault: 48h Timelock active");
        address prev = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        pendingAdminEta = 0;
        emit AdminTransferred(prev, admin);
    }

    function cancelAdminTransfer() external onlyAdmin {
        pendingAdmin = address(0);
        pendingAdminEta = 0;
        emit AdminTransferCancelled();
    }

    // --- Two-Step Timelocked Setters ---

    function initiateSetPnLRouter(address _router) external onlyAdmin {
        require(_router != address(0), "OptionVault: Zero address");
        pendingPnLRouter = _router;
        pendingPnLRouterEta = block.timestamp + PARAM_TIMELOCK;
        emit PnLRouterUpdateInitiated(_router, pendingPnLRouterEta);
    }

    function applyPnLRouter() external onlyAdmin {
        require(pendingPnLRouter != address(0), "OptionVault: No pending router");
        require(block.timestamp >= pendingPnLRouterEta, "OptionVault: Timelock active");
        pnlRouter = pendingPnLRouter;
        pendingPnLRouter = address(0);
        pendingPnLRouterEta = 0;
        emit PnLRouterUpdated(pnlRouter);
    }

    function cancelSetPnLRouter() external onlyAdmin {
        pendingPnLRouter = address(0);
        pendingPnLRouterEta = 0;
        emit PnLRouterUpdateCancelled();
    }

    function setPnLRouter(address _router) external onlyAdmin {
        require(_router != address(0), "OptionVault: Zero address");
        if (pnlRouter == address(0)) {
            pnlRouter = _router;
            emit PnLRouterUpdated(_router);
        } else {
            revert("OptionVault: Use initiateSetPnLRouter (48h timelock)");
        }
    }

    function _canPause(address who) internal view override returns (bool) {
        return who == admin;
    }

    function _canUnpause(address who) internal view override returns (bool) {
        return who == admin;
    }

    /// @notice Buy a 1-Hour or 0DTE option using realized PnL from closed perpetuals
    function purchaseOption(
        address trader,
        bytes32 pythFeedId,
        OptionType optType,
        ExpiryType expType,
        uint256 premium
    ) external onlyRouter whenNotPaused returns (uint256 optionId) {
        require(premium >= 5 * 1e6, "OptionVault: Min $5 premium"); // $5 min premium

        // Check recent spot price from Pyth
        IPyth.Price memory currentPyth = pyth.getPriceNoOlderThan(pythFeedId, MAX_ORACLE_DELAY_SECONDS);
        require(currentPyth.price > 0, "OptionVault: Negative price");

        uint256 spotPrice = uint256(uint64(currentPyth.price));
        uint256 strike;

        // Strike offset: 1-Hour (+/- 1.0%), 0DTE (+/- 2.5%)
        uint256 offsetBps = (expType == ExpiryType.ONE_HOUR) ? 100 : 250;
        if (optType == OptionType.CALL) {
            strike = spotPrice + (spotPrice * offsetBps) / 10000;
        } else {
            strike = spotPrice - (spotPrice * offsetBps) / 10000;
        }

        uint256 duration = (expType == ExpiryType.ONE_HOUR) ? 3600 : 86400;
        uint256 maxCommitment = premium * MAX_UPSIDE_MULTIPLIER;

        // Reserve payout capacity in LP underwriting pool (15% OI Cap check)
        lpPool.commitPayout(maxCommitment);

        // Split premium: 5% to Treasury, 95% retained by LP pool
        uint256 fee = (premium * PLATFORM_FEE_BPS) / 10000;
        uint256 lpAmount = premium - fee;

        require(usdc.transferFrom(msg.sender, address(treasury), fee), "OptionVault: Fee transfer failed");
        require(usdc.transferFrom(msg.sender, address(lpPool), lpAmount), "OptionVault: LP transfer failed");

        optionId = ++optionCount;
        options[optionId] = OptionPosition({
            owner: trader,
            pythFeedId: pythFeedId,
            optType: optType,
            expType: expType,
            premium: premium,
            strikePrice: strike,
            maxPayoutCommitment: maxCommitment,
            expiryTimestamp: block.timestamp + duration,
            isSettled: false
        });

        // Record Aegis Sentinel anti-flashloan T+1 block and 60s hold
        _recordPositionOpen(optionId);

        emit OptionPurchased(optionId, trader, optType, premium, strike);
    }

    /// @notice US-STYLE AMERICAN EARLY EXERCISE: Instant Cash-Out at any time before expiry!
    function earlyCashOut(uint256 optionId) external whenNotPaused {
        OptionPosition storage opt = options[optionId];
        require(!opt.isSettled, "OptionVault: Already settled");
        require(opt.owner != address(0), "OptionVault: Zero owner");
        require(block.timestamp < opt.expiryTimestamp, "OptionVault: Expired");
        require(
            msg.sender == opt.owner || (isAuthorizedSessionKey[msg.sender] && sessionKeyToTrader[msg.sender] == opt.owner),
            "OptionVault: Unauthorized"
        );

        // Validate via Aegis Sentinel (T+1 Block, 60s Hold, Pyth Confidence & Staleness)
        int64 exitPrice = _validateOptionExercise(optionId, pyth, opt.pythFeedId);

        uint256 payout = _calculatePayout(opt, exitPrice);
        require(payout > 0, "OptionVault: Option is out-of-the-money");

        opt.isSettled = true;

        // Settle from LP underwriting pool
        lpPool.settleOption(opt.owner, payout, opt.maxPayoutCommitment);

        emit EarlyCashOutExecuted(optionId, opt.owner, payout, exitPrice);
    }

    // Price recorded at exact expiry timestamp (optionId => expiryPrice)
    mapping(uint256 => int64) public recordedExpiryPrices;

    event ExpiryPriceRecorded(uint256 indexed optionId, int64 price, uint256 publishTime);

    /// @notice Keeper records price at exact expiry moment to prevent traders waiting for favorable drift
    function recordExpiryPrice(uint256 optionId) external {
        OptionPosition storage opt = options[optionId];
        require(!opt.isSettled, "OptionVault: Already settled");
        require(recordedExpiryPrices[optionId] == 0, "OptionVault: Price already recorded");
        require(block.timestamp >= opt.expiryTimestamp, "OptionVault: Not yet expired");
        require(block.timestamp <= opt.expiryTimestamp + 300, "OptionVault: Recording window passed");

        IPyth.Price memory p = pyth.getPriceNoOlderThan(opt.pythFeedId, 60);
        require(p.price > 0, "OptionVault: Invalid price");
        require(uint256(p.conf) * MAX_CONFIDENCE_RATIO < uint256(uint64(p.price)), "OptionVault: Confidence too wide");

        recordedExpiryPrices[optionId] = p.price;
        emit ExpiryPriceRecorded(optionId, p.price, p.publishTime);
    }

    /// @notice Automatic settlement strictly anchored to price around expiry timestamp
    function settleAtExpiry(uint256 optionId) external whenNotPaused {
        OptionPosition storage opt = options[optionId];
        require(!opt.isSettled, "OptionVault: Already settled");
        require(block.timestamp >= opt.expiryTimestamp, "OptionVault: Expiry time not reached");
        require(block.timestamp <= opt.expiryTimestamp + 3600, "OptionVault: Settlement window passed");

        int64 settlementPrice;
        if (recordedExpiryPrices[optionId] > 0) {
            settlementPrice = recordedExpiryPrices[optionId];
        } else {
            // If keeper hasn't recorded, require on-chain Pyth price published strictly within +/- 60s of expiry
            IPyth.Price memory currentPyth = pyth.getPrice(opt.pythFeedId);
            require(currentPyth.price > 0, "OptionVault: Invalid oracle price");
            require(uint256(currentPyth.conf) * MAX_CONFIDENCE_RATIO < uint256(uint64(currentPyth.price)), "OptionVault: Confidence too wide");
            
            // Critical H-R2 protection: Price MUST be anchored near expiry, preventing post-expiry drift exploitation
            require(
                currentPyth.publishTime >= opt.expiryTimestamp - 60 && currentPyth.publishTime <= opt.expiryTimestamp + 120,
                "OptionVault: Oracle price not anchored to expiry timestamp"
            );
            settlementPrice = currentPyth.price;
        }

        uint256 payout = _calculatePayout(opt, settlementPrice);
        opt.isSettled = true;

        lpPool.settleOption(opt.owner, payout, opt.maxPayoutCommitment);

        emit OptionSettledAtExpiry(optionId, payout, settlementPrice);
    }

    /// @notice Calculates option payout based on price distance from strike
    function _calculatePayout(OptionPosition memory opt, int64 priceInt) internal pure returns (uint256 payout) {
        if (priceInt <= 0) return 0;
        uint256 price = uint256(uint64(priceInt));

        if (opt.optType == OptionType.CALL) {
            if (price <= opt.strikePrice) return 0;
            uint256 diff = price - opt.strikePrice;
            // Payout scales with percentage break of strike price up to 20x
            uint256 upsideMultiplier = (diff * 1000) / opt.strikePrice; // in 0.1% increments
            payout = opt.premium + (opt.premium * upsideMultiplier * 2) / 10;
        } else {
            if (price >= opt.strikePrice) return 0;
            uint256 diff = opt.strikePrice - price;
            uint256 upsideMultiplier = (diff * 1000) / opt.strikePrice;
            payout = opt.premium + (opt.premium * upsideMultiplier * 2) / 10;
        }

        if (payout > opt.maxPayoutCommitment) {
            payout = opt.maxPayoutCommitment;
        }
    }
}
