// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";

/**
 * @title PlatformTreasury
 * @notice Central revenue collector and multi-sig protected treasury for TradingPnL.
 * Collects 0.015% Orderly perps broker margin, 25% of burned lottery tickets, and 5% of 0DTE option premiums.
 */
contract PlatformTreasury {
    IERC20 public immutable usdc;
    address public multiSigAdmin;
    address public pendingAdmin;
    address public guardian; // Can trigger emergency pause, but CANNOT withdraw

    uint256 public constant TIMELOCK_DELAY = 48 hours;
    mapping(bytes32 => uint256) public timelockedActions;

    // Revenue tracking
    uint256 public totalPerpBrokerRevenue;
    uint256 public totalBurnedLotteryRevenue;
    uint256 public totalOptionPremiumRevenue;

    event RevenueReceived(address indexed from, uint256 amount, string source);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event AdminTransferStarted(address indexed oldAdmin, address indexed newAdmin, uint256 effectiveTime);
    event AdminTransferCompleted(address indexed newAdmin);
    event GuardianUpdated(address indexed newGuardian);

    modifier onlyAdmin() {
        require(msg.sender == multiSigAdmin, "Treasury: Caller is not admin");
        _;
    }

    modifier onlyGuardianOrAdmin() {
        require(msg.sender == guardian || msg.sender == multiSigAdmin, "Treasury: Not guardian or admin");
        _;
    }

    constructor(address _usdc, address _multiSigAdmin, address _guardian) {
        require(_usdc != address(0) && _multiSigAdmin != address(0), "Treasury: Zero address");
        usdc = IERC20(_usdc);
        multiSigAdmin = _multiSigAdmin;
        guardian = _guardian != address(0) ? _guardian : _multiSigAdmin;
    }

    /// @notice Records incoming revenue from protocol components
    function depositRevenue(uint256 amount, uint8 revenueType) external {
        require(amount > 0, "Treasury: Zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Treasury: Transfer failed");

        if (revenueType == 0) {
            totalPerpBrokerRevenue += amount;
            emit RevenueReceived(msg.sender, amount, "PERP_BROKER_FEE");
        } else if (revenueType == 1) {
            totalBurnedLotteryRevenue += amount;
            emit RevenueReceived(msg.sender, amount, "BURNED_LOTTERY_TICKETS");
        } else if (revenueType == 2) {
            totalOptionPremiumRevenue += amount;
            emit RevenueReceived(msg.sender, amount, "OPTION_PREMIUM_FEE");
        }
    }

    /// @notice Multi-Sig withdrawal of accumulated treasury USDC
    function withdrawFunds(address to, uint256 amount) external onlyAdmin {
        require(to != address(0), "Treasury: Zero target");
        require(amount <= usdc.balanceOf(address(this)), "Treasury: Insufficient balance");
        require(usdc.transfer(to, amount), "Treasury: Transfer failed");
        emit FundsWithdrawn(to, amount);
    }

    /// @notice 2-step timelocked admin transfer for Safe Multisig updates
    function initiateAdminTransfer(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Treasury: Zero admin");
        pendingAdmin = newAdmin;
        timelockedActions[keccak256(abi.encode("ADMIN_TRANSFER", newAdmin))] = block.timestamp + TIMELOCK_DELAY;
        emit AdminTransferStarted(multiSigAdmin, newAdmin, block.timestamp + TIMELOCK_DELAY);
    }

    function completeAdminTransfer(address newAdmin) external onlyAdmin {
        bytes32 actionKey = keccak256(abi.encode("ADMIN_TRANSFER", newAdmin));
        require(timelockedActions[actionKey] != 0, "Treasury: Action not queued");
        require(block.timestamp >= timelockedActions[actionKey], "Treasury: Timelock not elapsed");
        require(pendingAdmin == newAdmin, "Treasury: Pending admin mismatch");

        multiSigAdmin = newAdmin;
        pendingAdmin = address(0);
        delete timelockedActions[actionKey];
        emit AdminTransferCompleted(newAdmin);
    }

    function cancelAdminTransfer(address targetAdmin) external onlyAdmin {
        bytes32 actionKey = keccak256(abi.encode("ADMIN_TRANSFER", targetAdmin));
        require(timelockedActions[actionKey] != 0, "Treasury: Action not queued");
        delete timelockedActions[actionKey];
        pendingAdmin = address(0);
        emit AdminTransferStarted(multiSigAdmin, address(0), 0);
    }

    function setGuardian(address newGuardian) external onlyAdmin {
        require(newGuardian != address(0), "Treasury: Zero guardian");
        guardian = newGuardian;
        emit GuardianUpdated(newGuardian);
    }
}
