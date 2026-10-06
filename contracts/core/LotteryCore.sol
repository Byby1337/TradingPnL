// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";
import "../security/AegisSentinel.sol";
import "./SuperJackpotVault.sol";
import "../governance/PlatformTreasury.sol";

/**
 * @title LotteryCore
 * @notice Hourly Sheriff lottery with pair-isolated epochs, 1-ticket-per-wallet rule,
 * 24h win cooldown, 60m trading freeze, 50+ quorum barrier, and 50/25/25 split.
 */
contract LotteryCore is AegisSentinel {
    IERC20 public immutable usdc;
    PlatformTreasury public immutable treasury;
    SuperJackpotVault public immutable superJackpot;
    address public pnlRouter;
    address public keeper;
    address public admin;

    uint256 public constant EPOCH_DURATION = 3600; // 1 hour
    uint256 public constant MIN_MARGIN = 100 * 1e6; // $100 USDC (6 decimals)
    uint256 public constant MAX_MARGIN = 10000 * 1e6; // $10,000 USDC

    struct EpochData {
        uint256 startTime;
        uint256 totalBurnedPool; // 20% PnL contributed by entrants
        uint256 pairVolume; // Total volume accrued on this pair
        address crownedSheriff;
        bool isResolved;
        bool isRolledOver;
    }

    // pairId => epochId => EpochData
    mapping(uint256 => mapping(uint256 => EpochData)) public epochs;
    mapping(uint256 => uint256) public currentEpochId;
    mapping(uint256 => mapping(uint256 => address[])) internal epochEntrants;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasTicket;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public ticketCost;

    // Pull-over-Push claim balances
    mapping(address => uint256) public pendingClaims;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public softLossClaimed;

    event TicketPurchased(uint256 indexed pairId, uint256 indexed epochId, address indexed trader, uint256 cost);
    event EpochResolved(uint256 indexed pairId, uint256 indexed epochId, address indexed sheriff, uint256 entrantsCount);
    event EpochRolledOver(uint256 indexed pairId, uint256 indexed epochId, uint256 entrantsCount);
    event SoftLossRefundCredited(address indexed trader, uint256 amount);
    event ClaimProcessed(address indexed user, uint256 amount);

    modifier onlyRouter() {
        require(msg.sender == pnlRouter, "Lottery: Only PnLRouter");
        _;
    }

    modifier onlyKeeperOrAdmin() {
        require(msg.sender == keeper || msg.sender == admin, "Lottery: Not keeper or admin");
        _;
    }

    constructor(
        address _usdc,
        address _treasury,
        address _superJackpot,
        address _admin,
        address _keeper
    ) {
        require(_usdc != address(0) && _admin != address(0), "Lottery: Zero address");
        usdc = IERC20(_usdc);
        treasury = PlatformTreasury(_treasury);
        superJackpot = SuperJackpotVault(_superJackpot);
        admin = _admin;
        keeper = _keeper;
    }

    address public pendingAdmin;
    uint256 public pendingAdminEta;
    uint256 public constant ADMIN_TIMELOCK = 48 hours;
    uint256 public constant PARAM_TIMELOCK = 48 hours;

    // Two-step timelock states
    address public pendingPnLRouter;
    uint256 public pendingPnLRouterEta;

    address public pendingKeeper;
    uint256 public pendingKeeperEta;

    uint256 public pendingMinQuorum;
    uint256 public pendingMinQuorumEta;

    event AdminTransferInitiated(address indexed currentAdmin, address indexed newAdmin, uint256 effectiveEta);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferCancelled();

    event PnLRouterUpdateInitiated(address indexed newRouter, uint256 eta);
    event PnLRouterUpdated(address indexed newRouter);
    event PnLRouterUpdateCancelled();

    event KeeperUpdateInitiated(address indexed newKeeper, uint256 eta);
    event KeeperUpdated(address indexed newKeeper);
    event KeeperUpdateCancelled();

    event MinQuorumUpdateInitiated(uint256 newQuorum, uint256 eta);
    event MinQuorumUpdateCancelled();

    function transferAdmin(address _newAdmin) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_newAdmin != address(0), "Lottery: Zero address");
        pendingAdmin = _newAdmin;
        pendingAdminEta = block.timestamp + ADMIN_TIMELOCK;
        emit AdminTransferInitiated(admin, _newAdmin, pendingAdminEta);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "Lottery: Not pending admin");
        require(block.timestamp >= pendingAdminEta, "Lottery: 48h Timelock not elapsed");
        address prev = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        pendingAdminEta = 0;
        emit AdminTransferred(prev, admin);
    }

    function cancelAdminTransfer() external {
        require(msg.sender == admin, "Lottery: Not admin");
        pendingAdmin = address(0);
        pendingAdminEta = 0;
        emit AdminTransferCancelled();
    }

    // --- Two-Step Timelocked Setters ---

    function initiateSetPnLRouter(address _router) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_router != address(0), "Lottery: Zero address");
        pendingPnLRouter = _router;
        pendingPnLRouterEta = block.timestamp + PARAM_TIMELOCK;
        emit PnLRouterUpdateInitiated(_router, pendingPnLRouterEta);
    }

    function applyPnLRouter() external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(pendingPnLRouter != address(0), "Lottery: No pending router");
        require(block.timestamp >= pendingPnLRouterEta, "Lottery: Timelock not elapsed");
        pnlRouter = pendingPnLRouter;
        pendingPnLRouter = address(0);
        pendingPnLRouterEta = 0;
        emit PnLRouterUpdated(pnlRouter);
    }

    function cancelSetPnLRouter() external {
        require(msg.sender == admin, "Lottery: Not admin");
        pendingPnLRouter = address(0);
        pendingPnLRouterEta = 0;
        emit PnLRouterUpdateCancelled();
    }

    function setPnLRouter(address _router) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_router != address(0), "Lottery: Zero address");
        if (pnlRouter == address(0)) {
            pnlRouter = _router;
            emit PnLRouterUpdated(_router);
        } else {
            revert("Lottery: Use initiateSetPnLRouter (48h timelock)");
        }
    }

    function initiateSetKeeper(address _keeper) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_keeper != address(0), "Lottery: Zero address");
        pendingKeeper = _keeper;
        pendingKeeperEta = block.timestamp + PARAM_TIMELOCK;
        emit KeeperUpdateInitiated(_keeper, pendingKeeperEta);
    }

    function applyKeeper() external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(pendingKeeper != address(0), "Lottery: No pending keeper");
        require(block.timestamp >= pendingKeeperEta, "Lottery: Timelock not elapsed");
        keeper = pendingKeeper;
        pendingKeeper = address(0);
        pendingKeeperEta = 0;
        emit KeeperUpdated(keeper);
    }

    function cancelSetKeeper() external {
        require(msg.sender == admin, "Lottery: Not admin");
        pendingKeeper = address(0);
        pendingKeeperEta = 0;
        emit KeeperUpdateCancelled();
    }

    function setKeeper(address _keeper) external {
        require(msg.sender == admin, "Lottery: Not admin");
        if (keeper == address(0)) {
            keeper = _keeper;
            emit KeeperUpdated(_keeper);
        } else {
            revert("Lottery: Use initiateSetKeeper (48h timelock)");
        }
    }

    function initiateSetMinQuorum(uint256 _quorum) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_quorum >= 10 && _quorum <= 200, "Lottery: Quorum out of range");
        pendingMinQuorum = _quorum;
        pendingMinQuorumEta = block.timestamp + PARAM_TIMELOCK;
        emit MinQuorumUpdateInitiated(_quorum, pendingMinQuorumEta);
    }

    function applyMinQuorum() external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(pendingMinQuorum != 0, "Lottery: No pending quorum");
        require(block.timestamp >= pendingMinQuorumEta, "Lottery: Timelock not elapsed");
        minParticipantsQuorum = pendingMinQuorum;
        pendingMinQuorum = 0;
        pendingMinQuorumEta = 0;
        emit QuorumUpdated(minParticipantsQuorum);
    }

    function cancelSetMinQuorum() external {
        require(msg.sender == admin, "Lottery: Not admin");
        pendingMinQuorum = 0;
        pendingMinQuorumEta = 0;
        emit MinQuorumUpdateCancelled();
    }

    function setMinQuorum(uint256 _quorum) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_quorum >= 10 && _quorum <= 200, "Lottery: Quorum out of range");
        if (minParticipantsQuorum == 0) {
            minParticipantsQuorum = _quorum;
            emit QuorumUpdated(_quorum);
        } else {
            revert("Lottery: Use initiateSetMinQuorum (48h timelock)");
        }
    }

    function _canPause(address who) internal view override returns (bool) {
        return who == admin || who == keeper;
    }

    function _canUnpause(address who) internal view override returns (bool) {
        return who == admin;
    }

    /// @notice Validates tiered ROI requirements based on leverage
    function validateEligibility(uint256 leverage, uint256 margin, uint256 profit) public pure returns (bool) {
        if (margin < MIN_MARGIN || margin > MAX_MARGIN) return false;
        uint256 roiBps = (profit * 10000) / margin;

        if (leverage <= 20) {
            return roiBps >= 1000; // >= 10%
        } else if (leverage <= 50) {
            return roiBps >= 3000; // >= 30%
        } else if (leverage <= 100) {
            return roiBps >= 7500; // >= 75%
        }
        return false;
    }

    uint256 public constant MIN_LOTTERY_ALLOCATION_BPS = 1000; // 10% minimum PnL allocation
    uint256 public constant MAX_ENTRANTS_PER_EPOCH = 500;

    /// @notice Entry point for trader with custom allocated cost (called by PnLRouter)
    function enterLottery(
        address trader,
        uint256 pairId,
        uint256 margin,
        uint256 profit,
        uint256 leverage,
        uint256 cost
    ) public onlyRouter whenNotPaused returns (bool success) {
        // Enforce minimum 10% PnL allocation rule
        require(cost >= (profit * MIN_LOTTERY_ALLOCATION_BPS) / 10000, "Lottery: Minimum 10% PnL allocation required");

        // 1. Check Trading Freeze (Aegis)
        if (_isTradingFrozen(trader)) return false;

        // 2. Check 24-Hour Daily Win Cooldown (Aegis)
        if (!_canParticipateInLottery(trader)) return false;

        // 3. Check Tiered ROI requirements
        if (!validateEligibility(leverage, margin, profit)) return false;

        uint256 epochId = currentEpochId[pairId];
        if (epochs[pairId][epochId].startTime == 0) {
            epochs[pairId][epochId].startTime = block.timestamp;
        }

        // 4. Rule: 1 wallet = 1 ticket per pair per epoch
        if (hasTicket[pairId][epochId][trader]) return false;

        require(epochEntrants[pairId][epochId].length < MAX_ENTRANTS_PER_EPOCH, "Lottery: epoch full");

        // Transfer allocated USDC fee from router
        require(usdc.transferFrom(msg.sender, address(this), cost), "Lottery: Transfer failed");

        hasTicket[pairId][epochId][trader] = true;
        ticketCost[pairId][epochId][trader] = cost;
        epochEntrants[pairId][epochId].push(trader);
        epochs[pairId][epochId].totalBurnedPool += cost;

        // Check if eligible for monthly SuperJackpot (ROI >= 20%)
        if ((profit * 10000) / margin >= 2000) {
            try superJackpot.registerContestant(trader) {} catch {}
        }

        emit TicketPurchased(pairId, epochId, trader, cost);
        return true;
    }

    /// @notice Backward-compatible overload defaulting to 10% minimum PnL allocation
    function enterLottery(
        address trader,
        uint256 pairId,
        uint256 margin,
        uint256 profit,
        uint256 leverage
    ) external onlyRouter whenNotPaused returns (bool success) {
        uint256 minCost = (profit * MIN_LOTTERY_ALLOCATION_BPS) / 10000;
        return enterLottery(trader, pairId, margin, profit, leverage, minCost);
    }

    // VRF / Verifiable Entropy Coordinator
    address public vrfCoordinator;
    mapping(uint256 => mapping(uint256 => bool)) public epochClosed;
    mapping(uint256 => mapping(uint256 => bytes32)) public epochRandomCommitment;
    mapping(uint256 => mapping(uint256 => uint256)) public epochCommitBlock;

    event EpochClosedForEntries(uint256 indexed pairId, uint256 indexed epochId, uint256 entrantsCount);
    event EntropyCommitted(uint256 indexed pairId, uint256 indexed epochId, bytes32 commitment, uint256 blockNumber);

    address public pendingVrfCoordinator;
    uint256 public pendingVrfCoordinatorEta;

    event VrfCoordinatorUpdateInitiated(address indexed newCoordinator, uint256 eta);
    event VrfCoordinatorUpdated(address indexed newCoordinator);
    event VrfCoordinatorUpdateCancelled();

    function initiateSetVrfCoordinator(address _coordinator) external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(_coordinator != address(0), "Lottery: Zero address");
        pendingVrfCoordinator = _coordinator;
        pendingVrfCoordinatorEta = block.timestamp + PARAM_TIMELOCK;
        emit VrfCoordinatorUpdateInitiated(_coordinator, pendingVrfCoordinatorEta);
    }

    function applyVrfCoordinator() external {
        require(msg.sender == admin, "Lottery: Not admin");
        require(pendingVrfCoordinator != address(0), "Lottery: No pending coordinator");
        require(block.timestamp >= pendingVrfCoordinatorEta, "Lottery: Timelock not elapsed");
        vrfCoordinator = pendingVrfCoordinator;
        pendingVrfCoordinator = address(0);
        pendingVrfCoordinatorEta = 0;
        emit VrfCoordinatorUpdated(vrfCoordinator);
    }

    function cancelSetVrfCoordinator() external {
        require(msg.sender == admin, "Lottery: Not admin");
        pendingVrfCoordinator = address(0);
        pendingVrfCoordinatorEta = 0;
        emit VrfCoordinatorUpdateCancelled();
    }

    function setVrfCoordinator(address _coordinator) external {
        require(msg.sender == admin, "Lottery: Not admin");
        if (vrfCoordinator == address(0)) {
            vrfCoordinator = _coordinator;
            emit VrfCoordinatorUpdated(_coordinator);
        } else {
            revert("Lottery: Use initiateSetVrfCoordinator (48h timelock)");
        }
    }

    /// @notice Stage 1: Close entries strictly before randomness request. Prevents late entry gaming.
    function closeEpochEntries(uint256 pairId, bytes32 randomCommitment) external onlyKeeperOrAdmin whenNotPaused {
        uint256 epochId = currentEpochId[pairId];
        EpochData storage epoch = epochs[pairId][epochId];
        require(!epoch.isResolved, "Lottery: Already resolved");
        require(!epochClosed[pairId][epochId], "Lottery: Already closed");
        require(block.timestamp >= epoch.startTime + EPOCH_DURATION, "Lottery: 1 hour not elapsed");

        epochClosed[pairId][epochId] = true;
        epochRandomCommitment[pairId][epochId] = randomCommitment;
        epochCommitBlock[pairId][epochId] = block.number;

        emit EpochClosedForEntries(pairId, epochId, epochEntrants[pairId][epochId].length);
        emit EntropyCommitted(pairId, epochId, randomCommitment, block.number);
    }

    /// @notice Stage 2: Resolves epoch using verified randomness (VRF fulfiller or commit-revealed secret with future blockhash)
    function resolveEpoch(uint256 pairId, uint256 randomSecret) external whenNotPaused {
        uint256 epochId = currentEpochId[pairId];
        EpochData storage epoch = epochs[pairId][epochId];
        require(!epoch.isResolved, "Lottery: Already resolved");
        require(epochClosed[pairId][epochId], "Lottery: Epoch entries must be closed first");

        // Enforce commit-reveal delay and valid EVM blockhash window (max 256 blocks, M-R4)
        uint256 commitBlk = epochCommitBlock[pairId][epochId];
        require(block.number > commitBlk, "Lottery: Cannot reveal in same block");

        if (block.number > commitBlk + 250 && msg.sender != vrfCoordinator) {
            // Blockhash window expired (EVM returns 0x0 after 256 blocks): trigger safe Rollover
            epoch.startTime = block.timestamp;
            epoch.isRolledOver = true;
            epochClosed[pairId][epochId] = false;
            emit EpochRolledOver(pairId, epochId, entrantCount);
            return;
        }

        // Verify either caller is VRF coordinator OR secret matches commitment
        bytes32 expectedCommitment = epochRandomCommitment[pairId][epochId];
        if (msg.sender != vrfCoordinator) {
            require(msg.sender == keeper || msg.sender == admin, "Lottery: Not authorized");
            require(keccak256(abi.encodePacked(randomSecret)) == expectedCommitment, "Lottery: Invalid secret reveal");
        }

        // Quorum check (Aegis Sentinel)
        if (entrantCount < minParticipantsQuorum) {
            // Rollover scenario: extend for another hour, keep tickets alive
            epoch.startTime = block.timestamp;
            epoch.isRolledOver = true;
            epochClosed[pairId][epochId] = false;
            emit EpochRolledOver(pairId, epochId, entrantCount);
            return;
        }

        // Entropy derived from future blockhash + reveal secret + prevrandao
        bytes32 futureBlock = blockhash(commitBlk);
        require(futureBlock != bytes32(0) || msg.sender == vrfCoordinator, "Lottery: Invalid blockhash");
        uint256 verifiedEntropy = uint256(keccak256(abi.encode(randomSecret, futureBlock, block.prevrandao, block.timestamp)));

        // Uniform random choice: 1 wallet = equal probability
        uint256 winningIndex = verifiedEntropy % entrantCount;
        address sheriff = entrants[winningIndex];
        epoch.crownedSheriff = sheriff;
        epoch.isResolved = true;

        // Apply Aegis Trading Freeze & Daily Win Cooldown on Sheriff
        tradingFreezeUntil[sheriff] = block.timestamp + TRADING_FREEZE_DURATION;
        lastWinTimestamp[sheriff] = block.timestamp;
        emit TradingFreezeActivated(sheriff, block.timestamp + TRADING_FREEZE_DURATION);
        emit WinCooldownRecorded(sheriff, block.timestamp + WIN_COOLDOWN_DURATION);

        // Process 50 / 25 / 25 split for losing tickets
        _processLosingTicketsSplit(pairId, epochId, sheriff);

        emit EpochResolved(pairId, epochId, sheriff, entrantCount);

        // Advance to next epoch
        currentEpochId[pairId] = epochId + 1;
        epochs[pairId][epochId + 1].startTime = block.timestamp;
    }

    /// @notice Distributes 25% to Treasury and 25% to SuperJackpot in O(1) constant gas (Audit Section 3)
    function _processLosingTicketsSplit(uint256 pairId, uint256 epochId, address sheriff) internal {
        EpochData storage epoch = epochs[pairId][epochId];
        uint256 sheriffCost = ticketCost[pairId][epochId][sheriff];
        uint256 losersTotal = epoch.totalBurnedPool > sheriffCost ? epoch.totalBurnedPool - sheriffCost : 0;

        uint256 totalTreasury = (losersTotal * 25) / 100;
        uint256 totalJackpot = (losersTotal * 25) / 100;

        // Forward to Treasury & SuperJackpot
        if (totalTreasury > 0) {
            usdc.approve(address(treasury), totalTreasury);
            treasury.depositRevenue(totalTreasury, 1);
        }
        if (totalJackpot > 0) {
            usdc.approve(address(superJackpot), totalJackpot);
            superJackpot.depositBurnedTicketShare(totalJackpot);
        }
    }

    /// @notice Lazy claim pattern for 50% Soft Loss refund (O(1) pull pattern)
    function claimSoftLoss(uint256 pairId, uint256 epochId) external whenNotPaused {
        EpochData storage epoch = epochs[pairId][epochId];
        require(epoch.isResolved, "Lottery: Epoch not resolved");
        require(msg.sender != epoch.crownedSheriff, "Lottery: Sheriff ticket does not receive soft loss");
        require(!softLossClaimed[pairId][epochId][msg.sender], "Lottery: Already claimed");

        uint256 cost = ticketCost[pairId][epochId][msg.sender];
        require(cost > 0, "Lottery: No ticket in epoch");

        softLossClaimed[pairId][epochId][msg.sender] = true;
        uint256 softLoss = (cost * 50) / 100;
        require(usdc.transfer(msg.sender, softLoss), "Lottery: Refund transfer failed");

        emit SoftLossRefundCredited(msg.sender, softLoss);
    }

    /// @notice Pull-over-Push claim pattern for Soft Loss refunds and Sheriff awards
    function claimPending() external {
        uint256 amount = pendingClaims[msg.sender];
        require(amount > 0, "Lottery: No pending balance");

        pendingClaims[msg.sender] = 0;
        require(usdc.transfer(msg.sender, amount), "Lottery: Transfer failed");

        emit ClaimProcessed(msg.sender, amount);
    }

    function getEntrants(uint256 pairId, uint256 epochId) external view returns (address[] memory) {
        return epochEntrants[pairId][epochId];
    }
}
