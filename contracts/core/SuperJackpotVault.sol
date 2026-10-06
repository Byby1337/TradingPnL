// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";

/**
 * @title SuperJackpotVault
 * @notice 30-Day Cross-Pair Mega Jackpot vault.
 * Accumulates 25% of burned lottery tickets from all pairs and distributes
 * 100% of the monthly pool among 10 distinct winners (35% / 20% / 15% / 4.28% each).
 */
contract SuperJackpotVault {
    IERC20 public immutable usdc;
    address public admin;
    address public lotteryCore;

    uint256 public currentMonth;
    uint256 public monthStartTime;
    uint256 public constant MONTH_DURATION = 30 days;

    // Monthly pool balances
    mapping(uint256 => uint256) public monthlyPool;
    mapping(uint256 => uint256) public contestPairId;
    mapping(uint256 => address[]) internal monthParticipants;
    mapping(uint256 => mapping(address => bool)) public hasContestTicket;

    // Tournament tier split basis points (sum = 10000 = 100%)
    uint256[10] public tierShares = [
        3500, // 1st: 35%
        2000, // 2nd: 20%
        1500, // 3rd: 15%
        428,  // 4th: 4.28%
        428,  // 5th: 4.28%
        428,  // 6th: 4.28%
        428,  // 7th: 4.28%
        430,  // 8th: 4.30%
        430,  // 9th: 4.30%
        428   // 10th: 4.28%
    ];

    // Winner tracking & Pull-over-Push claim balances
    mapping(uint256 => address[10]) public monthWinners;
    mapping(uint256 => bool) public isMonthResolved;
    mapping(address => uint256) public pendingJackpotRewards;

    event JackpotFunded(uint256 indexed month, uint256 amount, uint256 totalPool);
    event ContestPairAnnounced(uint256 indexed month, uint256 pairId);
    event ContestTicketIssued(uint256 indexed month, address indexed trader);
    event JackpotResolved(uint256 indexed month, address[10] winners, uint256 totalAmount);
    event RewardClaimed(address indexed winner, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Jackpot: Not admin");
        _;
    }

    modifier onlyLotteryCore() {
        require(msg.sender == lotteryCore, "Jackpot: Not lottery core");
        _;
    }

    constructor(address _usdc, address _admin) {
        require(_usdc != address(0) && _admin != address(0), "Jackpot: Zero address");
        usdc = IERC20(_usdc);
        admin = _admin;
        currentMonth = 1;
        monthStartTime = block.timestamp;
    }

    uint256 public constant ADMIN_TIMELOCK = 48 hours;
    uint256 public constant PARAM_TIMELOCK = 48 hours;
    address public pendingAdmin;
    uint256 public pendingAdminEta;

    address public pendingLotteryCore;
    uint256 public pendingLotteryCoreEta;

    address public pendingVrfCoordinator;
    uint256 public pendingVrfCoordinatorEta;

    event AdminTransferInitiated(address indexed currentAdmin, address indexed newAdmin, uint256 effectiveEta);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event AdminTransferCancelled();

    event LotteryCoreUpdateInitiated(address indexed newLotteryCore, uint256 eta);
    event LotteryCoreUpdated(address indexed newLotteryCore);
    event LotteryCoreUpdateCancelled();

    event VrfCoordinatorUpdateInitiated(address indexed newCoordinator, uint256 eta);
    event VrfCoordinatorUpdated(address indexed newCoordinator);
    event VrfCoordinatorUpdateCancelled();

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Jackpot: Zero address");
        pendingAdmin = _newAdmin;
        pendingAdminEta = block.timestamp + ADMIN_TIMELOCK;
        emit AdminTransferInitiated(admin, _newAdmin, pendingAdminEta);
    }

    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "Jackpot: Not pending admin");
        require(block.timestamp >= pendingAdminEta, "Jackpot: 48h Timelock active");
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

    function initiateSetLotteryCore(address _lotteryCore) external onlyAdmin {
        require(_lotteryCore != address(0), "Jackpot: Zero address");
        pendingLotteryCore = _lotteryCore;
        pendingLotteryCoreEta = block.timestamp + PARAM_TIMELOCK;
        emit LotteryCoreUpdateInitiated(_lotteryCore, pendingLotteryCoreEta);
    }

    function applyLotteryCore() external onlyAdmin {
        require(pendingLotteryCore != address(0), "Jackpot: No pending lottery core");
        require(block.timestamp >= pendingLotteryCoreEta, "Jackpot: Timelock active");
        lotteryCore = pendingLotteryCore;
        pendingLotteryCore = address(0);
        pendingLotteryCoreEta = 0;
        emit LotteryCoreUpdated(lotteryCore);
    }

    function cancelSetLotteryCore() external onlyAdmin {
        pendingLotteryCore = address(0);
        pendingLotteryCoreEta = 0;
        emit LotteryCoreUpdateCancelled();
    }

    function setLotteryCore(address _lotteryCore) external onlyAdmin {
        require(_lotteryCore != address(0), "Jackpot: Zero address");
        if (lotteryCore == address(0)) {
            lotteryCore = _lotteryCore;
            emit LotteryCoreUpdated(_lotteryCore);
        } else {
            revert("Jackpot: Use initiateSetLotteryCore (48h timelock)");
        }
    }

    /// @notice Called by LotteryCore to deposit 25% of burned tickets into current monthly jackpot
    function depositBurnedTicketShare(uint256 amount) external onlyLotteryCore {
        require(amount > 0, "Jackpot: Zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Jackpot: Transfer failed");
        monthlyPool[currentMonth] += amount;
        emit JackpotFunded(currentMonth, amount, monthlyPool[currentMonth]);
    }

    /// @notice Designates the contest pair for the last week of the month
    function setContestPair(uint256 pairId) external onlyAdmin {
        contestPairId[currentMonth] = pairId;
        emit ContestPairAnnounced(currentMonth, pairId);
    }

    /// @notice Registers eligible trader who achieved ROI >= 20% on designated contest pair (1 wallet = 1 ticket)
    function registerContestant(address trader) external onlyLotteryCore {
        require(!hasContestTicket[currentMonth][trader], "Jackpot: Ticket already issued");
        hasContestTicket[currentMonth][trader] = true;
        monthParticipants[currentMonth].push(trader);
        emit ContestTicketIssued(currentMonth, trader);
    }

    address public vrfCoordinator;
    bool public isMonthClosed;
    bytes32 public randomCommitment;
    uint256 public commitBlock;

    event MonthClosedForRegistration(uint256 indexed month, uint256 contestantsCount);
    event JackpotEntropyCommitted(uint256 indexed month, bytes32 commitment, uint256 blockNumber);

    function initiateSetVrfCoordinator(address _coordinator) external onlyAdmin {
        require(_coordinator != address(0), "Jackpot: Zero address");
        pendingVrfCoordinator = _coordinator;
        pendingVrfCoordinatorEta = block.timestamp + PARAM_TIMELOCK;
        emit VrfCoordinatorUpdateInitiated(_coordinator, pendingVrfCoordinatorEta);
    }

    function applyVrfCoordinator() external onlyAdmin {
        require(pendingVrfCoordinator != address(0), "Jackpot: No pending coordinator");
        require(block.timestamp >= pendingVrfCoordinatorEta, "Jackpot: Timelock active");
        vrfCoordinator = pendingVrfCoordinator;
        pendingVrfCoordinator = address(0);
        pendingVrfCoordinatorEta = 0;
        emit VrfCoordinatorUpdated(vrfCoordinator);
    }

    function cancelSetVrfCoordinator() external onlyAdmin {
        pendingVrfCoordinator = address(0);
        pendingVrfCoordinatorEta = 0;
        emit VrfCoordinatorUpdateCancelled();
    }

    function setVrfCoordinator(address _coordinator) external onlyAdmin {
        require(_coordinator != address(0), "Jackpot: Zero address");
        if (vrfCoordinator == address(0)) {
            vrfCoordinator = _coordinator;
            emit VrfCoordinatorUpdated(_coordinator);
        } else {
            revert("Jackpot: Use initiateSetVrfCoordinator (48h timelock)");
        }
    }

    /// @notice Closes contestant registration before entropy generation
    function closeMonthRegistration(bytes32 _commitment) external onlyAdmin {
        require(block.timestamp >= monthStartTime + MONTH_DURATION, "Jackpot: Month duration not elapsed");
        require(!isMonthResolved[currentMonth], "Jackpot: Month already resolved");
        require(!isMonthClosed, "Jackpot: Already closed");

        isMonthClosed = true;
        randomCommitment = _commitment;
        commitBlock = block.number;

        emit MonthClosedForRegistration(currentMonth, monthParticipants[currentMonth].length);
        emit JackpotEntropyCommitted(currentMonth, _commitment, block.number);
    }

    /// @notice Resolves month-end jackpot, drawing 10 unique winners with verified commit-reveal or VRF
    function resolveMonthlyJackpot(uint256 randomSecret) external {
        require(isMonthClosed, "Jackpot: Registration must be closed first");
        require(!isMonthResolved[currentMonth], "Jackpot: Month already resolved");
        require(block.number > commitBlock, "Jackpot: Cannot reveal in same block");

        if (msg.sender != vrfCoordinator) {
            require(msg.sender == admin, "Jackpot: Not authorized");
            require(keccak256(abi.encodePacked(randomSecret)) == randomCommitment, "Jackpot: Invalid secret reveal");
        }

        uint256 totalPool = monthlyPool[currentMonth];
        require(totalPool > 0, "Jackpot: Empty pool");

        address[] storage contestants = monthParticipants[currentMonth];
        uint256 count = contestants.length;
        require(count >= 10, "Jackpot: Less than 10 contestants");

        address[10] memory winners;
        uint256 found = 0;
        uint256 nonce = 0;

        bytes32 futureBlock = blockhash(commitBlock);
        uint256 verifiedEntropy = uint256(keccak256(abi.encode(randomSecret, futureBlock, block.prevrandao, block.timestamp)));

        // Select 10 distinct winners
        while (found < 10) {
            uint256 idx = uint256(keccak256(abi.encode(verifiedEntropy, nonce))) % count;
            address candidate = contestants[idx];

            bool alreadyWon = false;
            for (uint256 i = 0; i < found; i++) {
                if (winners[i] == candidate) {
                    alreadyWon = true;
                    break;
                }
            }

            if (!alreadyWon) {
                winners[found] = candidate;
                uint256 prize = (totalPool * tierShares[found]) / 10000;
                pendingJackpotRewards[candidate] += prize;
                found++;
            }
            nonce++;
        }

        monthWinners[currentMonth] = winners;
        isMonthResolved[currentMonth] = true;

        emit JackpotResolved(currentMonth, winners, totalPool);

        // Advance to next month
        currentMonth++;
        monthStartTime = block.timestamp;
    }

    /// @notice Pull-over-Push claim pattern for winners
    function claimReward() external {
        uint256 reward = pendingJackpotRewards[msg.sender];
        require(reward > 0, "Jackpot: No pending reward");

        pendingJackpotRewards[msg.sender] = 0;
        require(usdc.transfer(msg.sender, reward), "Jackpot: Transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    function getParticipantsCount(uint256 month) external view returns (uint256) {
        return monthParticipants[month].length;
    }
}
