// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";
import "./LotteryCore.sol";
import "../options/OptionVault.sol";

/**
 * @title PnLRouter
 * @notice Central dispatcher for "Programmable PnL".
 * Atomically routes 100% initial margin back to the trader, and splits realized profit
 * between Take-Home wallet, LotteryCore (Sheriff of the Hour), and OptionVault (0DTE Rocket).
 */
contract PnLRouter {
    IERC20 public immutable usdc;
    LotteryCore public immutable lottery;
    OptionVault public immutable optionVault;
    address public admin;
    address public clearingGateway; // Authorized backend relayer / session execution engine

    struct PnLAllocationRule {
        uint16 toWalletBps;    // e.g. 6000 (60%)
        uint16 toLotteryBps;   // e.g. 2000 (20%)
        uint16 toOptionBps;    // e.g. 2000 (20%)
        OptionVault.OptionType preferredOptType;
        OptionVault.ExpiryType preferredExpType;
        bytes32 preferredFeedId;
        bool isConfigured;
    }

    // Trader address => configured rule
    mapping(address => PnLAllocationRule) public userRules;

    event RulesUpdated(address indexed trader, uint16 toWallet, uint16 toLottery, uint16 toOption);
    event PnLDispatched(address indexed trader, uint256 marginReturned, uint256 toWallet, uint256 toLottery, uint256 toOption);
    event AutoFallbackTriggered(address indexed trader, uint256 refundedAmount, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "PnLRouter: Not admin");
        _;
    }

    modifier onlyGateway() {
        require(msg.sender == clearingGateway || msg.sender == admin, "PnLRouter: Not gateway");
        _;
    }

    constructor(
        address _usdc,
        address _lottery,
        address _optionVault,
        address _admin,
        address _clearingGateway
    ) {
        require(_usdc != address(0) && _admin != address(0), "PnLRouter: Zero address");
        usdc = IERC20(_usdc);
        lottery = LotteryCore(_lottery);
        optionVault = OptionVault(_optionVault);
        admin = _admin;
        clearingGateway = _clearingGateway;
    }

    uint256 public constant ADMIN_TIMELOCK = 48 hours;
    uint256 public constant PARAM_TIMELOCK = 48 hours;
    address public pendingAdmin;
    uint256 public pendingAdminEta;

    address public pendingClearingGateway;
    uint256 public pendingClearingGatewayEta;

    event AdminTransferInitiated(address indexed currentAdmin, address indexed newAdmin, uint256 effectiveEta);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferCancelled();

    event ClearingGatewayUpdateInitiated(address indexed newGateway, uint256 eta);
    event ClearingGatewayUpdated(address indexed newGateway);
    event ClearingGatewayUpdateCancelled();

    uint16 public constant MIN_LOTTERY_BPS = 1000; // 10% minimum PnL allocation (1,000 basis points)

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "PnLRouter: Zero address");
        pendingAdmin = _newAdmin;
        pendingAdminEta = block.timestamp + ADMIN_TIMELOCK;
        emit AdminTransferInitiated(admin, _newAdmin, pendingAdminEta);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "PnLRouter: Not pending admin");
        require(block.timestamp >= pendingAdminEta, "PnLRouter: 48h Timelock active");
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

    function initiateSetClearingGateway(address _gateway) external onlyAdmin {
        require(_gateway != address(0), "PnLRouter: Zero address");
        pendingClearingGateway = _gateway;
        pendingClearingGatewayEta = block.timestamp + PARAM_TIMELOCK;
        emit ClearingGatewayUpdateInitiated(_gateway, pendingClearingGatewayEta);
    }

    function applyClearingGateway() external onlyAdmin {
        require(pendingClearingGateway != address(0), "PnLRouter: No pending gateway");
        require(block.timestamp >= pendingClearingGatewayEta, "PnLRouter: Timelock active");
        clearingGateway = pendingClearingGateway;
        pendingClearingGateway = address(0);
        pendingClearingGatewayEta = 0;
        emit ClearingGatewayUpdated(clearingGateway);
    }

    function cancelSetClearingGateway() external onlyAdmin {
        pendingClearingGateway = address(0);
        pendingClearingGatewayEta = 0;
        emit ClearingGatewayUpdateCancelled();
    }

    function setClearingGateway(address _gateway) external onlyAdmin {
        require(_gateway != address(0), "PnLRouter: Zero address");
        if (clearingGateway == address(0)) {
            clearingGateway = _gateway;
            emit ClearingGatewayUpdated(_gateway);
        } else {
            revert("PnLRouter: Use initiateSetClearingGateway (48h timelock)");
        }
    }

    /// @notice Allows traders to configure their personal PnL Sliders preset
    function configureRules(
        uint16 toWalletBps,
        uint16 toLotteryBps,
        uint16 toOptionBps,
        OptionVault.OptionType optType,
        OptionVault.ExpiryType expType,
        bytes32 feedId
    ) external {
        require(toWalletBps + toLotteryBps + toOptionBps == 10000, "PnLRouter: Sum must equal 100%");
        require(toLotteryBps == 0 || toLotteryBps >= MIN_LOTTERY_BPS, "PnLRouter: Min 10% PnL allocation required for lottery");

        userRules[msg.sender] = PnLAllocationRule({
            toWalletBps: toWalletBps,
            toLotteryBps: toLotteryBps,
            toOptionBps: toOptionBps,
            preferredOptType: optType,
            preferredExpType: expType,
            preferredFeedId: feedId,
            isConfigured: true
        });

        emit RulesUpdated(msg.sender, toWalletBps, toLotteryBps, toOptionBps);
    }

    /// @notice Core routing function called upon profitable order fill
    function routeProfit(
        address trader,
        uint256 pairId,
        uint256 positionMargin,
        uint256 realizedProfit,
        uint256 leverage
    ) external onlyGateway returns (bool) {
        require(realizedProfit > 0, "PnLRouter: No profit to route");

        // Fetch user rules or apply default (70% Wallet / 15% Lottery / 15% Option)
        PnLAllocationRule memory rule = userRules[trader];
        if (!rule.isConfigured) {
            rule = PnLAllocationRule({
                toWalletBps: 7000,
                toLotteryBps: 1500,
                toOptionBps: 1500,
                preferredOptType: OptionVault.OptionType.CALL,
                preferredExpType: OptionVault.ExpiryType.ONE_HOUR,
                preferredFeedId: bytes32(0),
                isConfigured: true
            });
        }

        uint256 walletAmount = (realizedProfit * rule.toWalletBps) / 10000;
        uint256 lotteryAmount = (realizedProfit * rule.toLotteryBps) / 10000;
        uint256 optionAmount = realizedProfit - walletAmount - lotteryAmount;

        // Pull total realized profit from clearing engine
        require(usdc.transferFrom(msg.sender, address(this), realizedProfit), "PnLRouter: Transfer failed");

        // 1. Process Lottery allocation
        if (lotteryAmount > 0) {
            require(rule.toLotteryBps >= MIN_LOTTERY_BPS, "PnLRouter: Min 10% PnL allocation required for lottery");
            usdc.approve(address(lottery), lotteryAmount);
            bool entered = lottery.enterLottery(trader, pairId, positionMargin, realizedProfit, leverage, lotteryAmount);
            if (!entered) {
                // Auto-Fallback: if trader is in cooldown or ineligible, return 100% of this share to trader
                walletAmount += lotteryAmount;
                emit AutoFallbackTriggered(trader, lotteryAmount, "Lottery cooldown or qualification fallback");
            }
        }

        // 2. Process Option allocation
        if (optionAmount > 0 && rule.preferredFeedId != bytes32(0)) {
            usdc.approve(address(optionVault), optionAmount);
            try optionVault.purchaseOption(
                trader,
                rule.preferredFeedId,
                rule.preferredOptType,
                rule.preferredExpType,
                optionAmount
            ) {} catch {
                // Auto-Fallback: return option share if purchase fails
                walletAmount += optionAmount;
                emit AutoFallbackTriggered(trader, optionAmount, "Option purchase failed or OI cap reached");
            }
        } else if (optionAmount > 0) {
            walletAmount += optionAmount;
        }

        // 3. Dispatch final take-home profit directly to trader's wallet
        if (walletAmount > 0) {
            require(usdc.transfer(trader, walletAmount), "PnLRouter: Wallet transfer failed");
        }

        emit PnLDispatched(trader, positionMargin, walletAmount, lotteryAmount, optionAmount);
        return true;
    }
}
