// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";

/**
 * @title OptionLiquidityPool
 * @notice Underwriting vault for 0DTE / 1-Hour Cash-Settled options.
 * Generates 25-45% APR for USDC LPs via house edge (75-85% OTM option expiration retention).
 * Enforces Hyperliquid-style 15% Open Interest Cap.
 */
contract OptionLiquidityPool {
    IERC20 public immutable usdc;
    address public admin;
    address public optionVault;

    uint256 public totalCommittedPayouts; // Currently reserved for active options
    uint256 public constant MAX_OI_CAP_BPS = 1500; // Max 15% committed payout share
    uint256 private constant VIRTUAL_SHARES = 1e6;
    uint256 private constant VIRTUAL_ASSETS = 1;
    uint256 public constant VAULT_CHANGE_DELAY = 48 hours;
    address public pendingOptionVault;
    uint256 public pendingOptionVaultEta;
    uint256 private _entered;

    // LP Share accounting
    uint256 public totalLpShares;
    mapping(address => uint256) public lpShares;

    event LpDeposited(address indexed lp, uint256 usdcAmount, uint256 sharesIssued);
    event LpWithdrawn(address indexed lp, uint256 usdcAmount, uint256 sharesBurned);
    event PayoutSettled(address indexed recipient, uint256 amount);
    event PremiumRetained(uint256 amount);

    modifier onlyOptionVault() {
        require(msg.sender == optionVault, "LPPool: Only OptionVault");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "LPPool: Not admin");
        _;
    }

    modifier nonReentrant() {
        require(_entered == 0, "LPPool: reentrant");
        _entered = 1;
        _;
        _entered = 0;
    }

    constructor(address _usdc, address _admin) {
        require(_usdc != address(0) && _admin != address(0), "LPPool: Zero address");
        usdc = IERC20(_usdc);
        admin = _admin;
    }

    uint256 public constant ADMIN_TIMELOCK = 48 hours;
    address public pendingAdmin;
    uint256 public pendingAdminEta;

    event AdminTransferInitiated(address indexed currentAdmin, address indexed newAdmin, uint256 effectiveEta);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferCancelled();

    event OptionVaultUpdateInitiated(address indexed newVault, uint256 eta);
    event OptionVaultUpdated(address indexed newVault);
    event OptionVaultUpdateCancelled();

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "LPPool: Zero address");
        pendingAdmin = _newAdmin;
        pendingAdminEta = block.timestamp + ADMIN_TIMELOCK;
        emit AdminTransferInitiated(admin, _newAdmin, pendingAdminEta);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "LPPool: Not pending admin");
        require(block.timestamp >= pendingAdminEta, "LPPool: 48h Timelock active");
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

    function setOptionVault(address _vault) external onlyAdmin {
        require(_vault != address(0), "LPPool: Zero address");
        if (optionVault == address(0)) {
            optionVault = _vault;
            emit OptionVaultUpdated(_vault);
        } else {
            pendingOptionVault = _vault;
            pendingOptionVaultEta = block.timestamp + VAULT_CHANGE_DELAY;
            emit OptionVaultUpdateInitiated(_vault, pendingOptionVaultEta);
        }
    }

    function applyOptionVault() external onlyAdmin {
        require(pendingOptionVault != address(0), "LPPool: No pending vault");
        require(block.timestamp >= pendingOptionVaultEta, "LPPool: Timelock active");
        optionVault = pendingOptionVault;
        pendingOptionVault = address(0);
        pendingOptionVaultEta = 0;
        emit OptionVaultUpdated(optionVault);
    }

    function cancelOptionVault() external onlyAdmin {
        pendingOptionVault = address(0);
        pendingOptionVaultEta = 0;
        emit OptionVaultUpdateCancelled();
    }

    /// @notice Total usable USDC assets in the pool
    function totalAssets() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /// @notice Uncommitted liquid balance available for new options
    function availableLiquidity() public view returns (uint256) {
        uint256 assets = totalAssets();
        if (assets <= totalCommittedPayouts) return 0;
        return assets - totalCommittedPayouts;
    }

    /// @notice Check if new option payout commitment fits within the 15% Open Interest Cap
    function canCommitPayout(uint256 maxPayout) external view returns (bool) {
        uint256 assets = totalAssets();
        uint256 newTotal = totalCommittedPayouts + maxPayout;
        return (newTotal * 10000) <= (assets * MAX_OI_CAP_BPS);
    }

    /// @notice Called by OptionVault when a new option is purchased to reserve payout capacity
    function commitPayout(uint256 maxPayout) external onlyOptionVault {
        require(this.canCommitPayout(maxPayout), "LPPool: Open Interest Cap exceeded (15%)");
        totalCommittedPayouts += maxPayout;
    }

    /// @notice Releases commitment and settles cash payout to winner
    function settleOption(address recipient, uint256 actualPayout, uint256 maxPayoutCommitment) external onlyOptionVault nonReentrant {
        require(recipient != address(0), "LPPool: zero recipient");
        require(maxPayoutCommitment > 0, "LPPool: zero commitment");
        require(totalCommittedPayouts >= maxPayoutCommitment, "LPPool: Invalid commitment release");
        require(actualPayout <= maxPayoutCommitment, "LPPool: payout exceeds commitment");
        totalCommittedPayouts -= maxPayoutCommitment;

        if (actualPayout > 0) {
            require(usdc.transfer(recipient, actualPayout), "LPPool: Payout transfer failed");
            emit PayoutSettled(recipient, actualPayout);
        }
    }

    /// @notice Deposit USDC to earn underwriting yield (25-45% APR)
    function depositLP(uint256 amount, uint256 minShares) external nonReentrant returns (uint256 shares) {
        require(amount > 0, "LPPool: Zero amount");
        uint256 assetsBefore = totalAssets();
        shares = (amount * (totalLpShares + VIRTUAL_SHARES)) / (assetsBefore + VIRTUAL_ASSETS);
        require(shares > 0 && shares >= minShares, "LPPool: slippage / zero shares");
        require(usdc.transferFrom(msg.sender, address(this), amount), "LPPool: Transfer failed");
        totalLpShares += shares;
        lpShares[msg.sender] += shares;
        emit LpDeposited(msg.sender, amount, shares);
    }

    /// @notice Withdraw USDC by burning LP shares (subject to available uncommitted liquidity)
    function withdrawLP(uint256 shares) external nonReentrant returns (uint256 usdcAmount) {
        require(shares > 0 && lpShares[msg.sender] >= shares, "LPPool: Invalid shares");
        usdcAmount = (shares * (totalAssets() + VIRTUAL_ASSETS)) / (totalLpShares + VIRTUAL_SHARES);
        require(usdcAmount <= availableLiquidity(), "LPPool: Liquidity committed to active options");
        lpShares[msg.sender] -= shares;
        totalLpShares -= shares;
        require(usdc.transfer(msg.sender, usdcAmount), "LPPool: Transfer failed");
        emit LpWithdrawn(msg.sender, usdcAmount, shares);
    }
}
