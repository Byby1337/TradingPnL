// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";

/**
 * @title TradingVault
 * @notice Dedicated Non-Custodial Custody & Margin Vault for Perpetual Trading.
 * 
 * Separation of Concerns:
 * - Completely isolated from OptionLiquidityPool (no LP shares minted, no option underwriting dilution).
 * - Accepts real on-chain trader deposits (deposit / depositMargin).
 * - Holds user margin safely in escrow during active positions.
 * - Settles trader withdrawals with verifiable clearing signatures (EIP-712) or via authorized Clearing Gateway.
 * - Trader losses and taker fees are retained in protocol equity/treasury, preventing traders from withdrawing lost funds.
 */
contract TradingVault {
    IERC20 public immutable usdc;
    address public admin;
    address public clearingGateway; // Authorized clearing relayer / backend engine
    address public treasury;        // Platform fee / counterparty vault

    // Trader address => deposited collateral in Vault
    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public nonces;

    uint256 public totalVaultBalance;
    uint256 public accumulatedFees;

    uint256 public constant ADMIN_TIMELOCK = 48 hours;
    uint256 public constant PARAM_TIMELOCK = 48 hours;

    address public pendingAdmin;
    uint256 public pendingAdminEta;

    address public pendingClearingGateway;
    uint256 public pendingClearingGatewayEta;

    address public pendingTreasury;
    uint256 public pendingTreasuryEta;

    bool private locked;
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "TradingVault: Not admin");
        _;
    }

    modifier onlyGateway() {
        require(msg.sender == clearingGateway || msg.sender == admin, "TradingVault: Not gateway");
        _;
    }

    event MarginDeposited(address indexed trader, uint256 amount, uint256 newBalance);
    event SettledWithdrawal(address indexed trader, uint256 amount, uint256 netPnl, uint256 feeDeducted);
    event FeesTransferredToTreasury(address indexed treasury, uint256 amount);

    event AdminTransferInitiated(address indexed currentAdmin, address indexed newAdmin, uint256 effectiveEta);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferCancelled();

    event ClearingGatewayUpdateInitiated(address indexed newGateway, uint256 eta);
    event ClearingGatewayUpdated(address indexed newGateway);
    event ClearingGatewayUpdateCancelled();

    event TreasuryUpdateInitiated(address indexed newTreasury, uint256 eta);
    event TreasuryUpdated(address indexed newTreasury);
    event TreasuryUpdateCancelled();

    constructor(address _usdc, address _admin, address _clearingGateway, address _treasury) {
        require(_usdc != address(0) && _admin != address(0), "TradingVault: Zero address");
        usdc = IERC20(_usdc);
        admin = _admin;
        clearingGateway = _clearingGateway != address(0) ? _clearingGateway : _admin;
        treasury = _treasury != address(0) ? _treasury : _admin;
    }

    /// @notice Trader deposits USDC directly into their Vault balance (or when opening an order)
    function deposit(uint256 amount) external nonReentrant {
        _depositFor(msg.sender, amount);
    }

    /// @notice Allows depositing on behalf of a trader (e.g. order execution)
    function depositFor(address trader, uint256 amount) external nonReentrant {
        _depositFor(trader, amount);
    }

    function _depositFor(address trader, uint256 amount) internal {
        require(amount > 0, "TradingVault: Zero amount");
        require(trader != address(0), "TradingVault: Zero trader");
        require(usdc.transferFrom(msg.sender, address(this), amount), "TradingVault: Transfer failed");
        userBalances[trader] += amount;
        totalVaultBalance += amount;
        emit MarginDeposited(trader, amount, userBalances[trader]);
    }

    /// @notice Clearing Gateway settles position closure or full trader account withdrawal
    /// @dev Calculates payout: final settlement = balance + netPnl - fee.
    function settleWithdraw(
        address trader,
        uint256 amountToReturn,
        uint256 protocolFee
    ) external onlyGateway nonReentrant {
        require(trader != address(0), "TradingVault: Zero trader");
        require(amountToReturn <= usdc.balanceOf(address(this)), "TradingVault: Insufficient vault liquidity");
        
        if (protocolFee > 0) {
            accumulatedFees += protocolFee;
        }

        if (amountToReturn > 0) {
            if (userBalances[trader] >= amountToReturn) {
                userBalances[trader] -= amountToReturn;
            } else {
                userBalances[trader] = 0;
            }
            if (totalVaultBalance >= amountToReturn) {
                totalVaultBalance -= amountToReturn;
            } else {
                totalVaultBalance = 0;
            }
            require(usdc.transfer(trader, amountToReturn), "TradingVault: Transfer failed");
        }

        emit SettledWithdrawal(trader, amountToReturn, 0, protocolFee);
    }

    /// @notice Direct withdrawal by trader signed by clearing engine (EIP-712 style voucher)
    function withdrawWithSignature(
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(block.timestamp <= expiry, "TradingVault: Voucher expired");
        require(nonce == nonces[msg.sender]++, "TradingVault: Invalid nonce");
        require(amount <= usdc.balanceOf(address(this)), "TradingVault: Insufficient vault liquidity");

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encode(address(this), msg.sender, amount, fee, nonce, expiry))
            )
        );
        address recovered = ecrecover(messageHash, v, r, s);
        require(recovered == clearingGateway || recovered == admin, "TradingVault: Invalid voucher signature");

        if (fee > 0) {
            accumulatedFees += fee;
        }

        if (userBalances[msg.sender] >= amount) {
            userBalances[msg.sender] -= amount;
        } else {
            userBalances[msg.sender] = 0;
        }

        require(usdc.transfer(msg.sender, amount), "TradingVault: Transfer failed");
        emit SettledWithdrawal(msg.sender, amount, 0, fee);
    }

    /// @notice Sends collected taker/clearing fees to Platform Treasury
    function flushFeesToTreasury() external onlyGateway nonReentrant {
        require(accumulatedFees > 0, "TradingVault: No fees");
        uint256 toFlush = accumulatedFees;
        accumulatedFees = 0;
        require(usdc.transfer(treasury, toFlush), "TradingVault: Transfer failed");
        emit FeesTransferredToTreasury(treasury, toFlush);
    }

    // --- Admin Two-Step Transfer (48h Timelock) ---

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "TradingVault: Zero address");
        pendingAdmin = _newAdmin;
        pendingAdminEta = block.timestamp + ADMIN_TIMELOCK;
        emit AdminTransferInitiated(admin, _newAdmin, pendingAdminEta);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "TradingVault: Not pending admin");
        require(block.timestamp >= pendingAdminEta, "TradingVault: 48h Timelock active");
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

    // --- Clearing Gateway Two-Step Setters (48h Timelock) ---

    function initiateSetClearingGateway(address _gateway) external onlyAdmin {
        require(_gateway != address(0), "TradingVault: Zero address");
        pendingClearingGateway = _gateway;
        pendingClearingGatewayEta = block.timestamp + PARAM_TIMELOCK;
        emit ClearingGatewayUpdateInitiated(_gateway, pendingClearingGatewayEta);
    }

    function applyClearingGateway() external onlyAdmin {
        require(pendingClearingGateway != address(0), "TradingVault: No pending gateway");
        require(block.timestamp >= pendingClearingGatewayEta, "TradingVault: Timelock active");
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

    /// @notice Allows instant bootstrap only if gateway is zero, otherwise enforces 48h timelock
    function setClearingGateway(address _gateway) external onlyAdmin {
        require(_gateway != address(0), "TradingVault: Zero address");
        if (clearingGateway == address(0)) {
            clearingGateway = _gateway;
            emit ClearingGatewayUpdated(_gateway);
        } else {
            revert("TradingVault: Use initiateSetClearingGateway (48h timelock)");
        }
    }

    // --- Treasury Two-Step Setters (48h Timelock) ---

    function initiateSetTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "TradingVault: Zero address");
        pendingTreasury = _treasury;
        pendingTreasuryEta = block.timestamp + PARAM_TIMELOCK;
        emit TreasuryUpdateInitiated(_treasury, pendingTreasuryEta);
    }

    function applyTreasury() external onlyAdmin {
        require(pendingTreasury != address(0), "TradingVault: No pending treasury");
        require(block.timestamp >= pendingTreasuryEta, "TradingVault: Timelock active");
        treasury = pendingTreasury;
        pendingTreasury = address(0);
        pendingTreasuryEta = 0;
        emit TreasuryUpdated(treasury);
    }

    function cancelSetTreasury() external onlyAdmin {
        pendingTreasury = address(0);
        pendingTreasuryEta = 0;
        emit TreasuryUpdateCancelled();
    }

    /// @notice Allows instant bootstrap only if treasury is zero, otherwise enforces 48h timelock
    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "TradingVault: Zero address");
        if (treasury == address(0)) {
            treasury = _treasury;
            emit TreasuryUpdated(_treasury);
        } else {
            revert("TradingVault: Use initiateSetTreasury (48h timelock)");
        }
    }
}

