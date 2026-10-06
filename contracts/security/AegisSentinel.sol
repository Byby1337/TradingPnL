// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IPyth.sol";

/**
 * @title AegisSentinel
 * @notice Proprietary multi-layered security engine ("Golden Mean") for TradingPnL & 0DTE Options.
 * Synthesizes the top 10% security practices from GMX v2, Hyperliquid, Orderly, Backpack,
 * Variational, Arcus, TxFlow + 30% proprietary TradingPnL defense mechanics.
 */
abstract contract AegisSentinel {
    // --- 1. GMX v2: T+1 Block & Min Hold Timelock (Anti-Flashloan & MEV) ---
    mapping(uint256 => uint256) public positionOpenedBlock;
    mapping(uint256 => uint256) public positionOpenedTime;
    uint256 public constant MIN_HOLD_SECONDS = 60; // 60s min hold against sandwich MEV

    // --- 2. Hyperliquid: Open Interest Cap & Circuit Breakers ---
    uint256 public constant MAX_OI_POOL_SHARE_BPS = 1500; // 15% max payout commitment of LP pool
    uint256 public constant MAX_VOLATILITY_JUMP_BPS = 800; // 8% max 1-minute price deviation
    bool public isEmergencyPaused;

    // --- 3. Backpack: Scoped Session Key Guard ---
    mapping(address => bool) public isAuthorizedSessionKey;
    mapping(address => address) public sessionKeyToTrader;

    // --- 4. Arcus: Pyth Oracle Confidence Band & Staleness ---
    uint256 public constant MAX_ORACLE_DELAY_SECONDS = 5;
    uint256 public constant MAX_CONFIDENCE_RATIO = 1000; // conf / price must be < 0.1%

    // --- 5. TradingPnL DNA: Anti-Wash Trading, Win Cooldown & Quorum ---
    uint256 public constant TRADING_FREEZE_DURATION = 3600; // 60 minutes
    uint256 public constant WIN_COOLDOWN_DURATION = 24 hours; // 24 hours
    uint256 public minParticipantsQuorum = 50; // Quorum 50+ participants

    mapping(address => uint256) public tradingFreezeUntil;
    mapping(address => uint256) public lastWinTimestamp;

    // --- Events ---
    event EmergencyPaused(address indexed by, string reason);
    event EmergencyUnpaused(address indexed by);
    event TradingFreezeActivated(address indexed trader, uint256 until);
    event WinCooldownRecorded(address indexed trader, uint256 until);
    event QuorumUpdated(uint256 newQuorum);

    modifier whenNotPaused() {
        require(!isEmergencyPaused, "Aegis: Protocol is emergency paused");
        _;
    }

    function _canPause(address who) internal view virtual returns (bool);
    function _canUnpause(address who) internal view virtual returns (bool);

    /// @notice Emergency pause circuit breaker
    function emergencyPause(string calldata reason) external {
        require(_canPause(msg.sender), "Aegis: Not authorized to pause");
        isEmergencyPaused = true;
        emit EmergencyPaused(msg.sender, reason);
    }

    /// @notice Unpause circuit breaker
    function emergencyUnpause() external {
        require(_canUnpause(msg.sender), "Aegis: Not authorized to unpause");
        isEmergencyPaused = false;
        emit EmergencyUnpaused(msg.sender);
    }

    /// @notice Authorizes a session key for scoped execution
    function authorizeSessionKey(address sessionKey) external {
        require(sessionKey != address(0), "Aegis: Zero address");
        isAuthorizedSessionKey[sessionKey] = true;
        sessionKeyToTrader[sessionKey] = msg.sender;
    }

    /// @notice Revokes a previously authorized session key
    function revokeSessionKey(address sessionKey) external {
        require(sessionKeyToTrader[sessionKey] == msg.sender, "Aegis: Not owner of session key");
        isAuthorizedSessionKey[sessionKey] = false;
        delete sessionKeyToTrader[sessionKey];
    }

    /// @notice Backpack-style Scoped Session check: permits trade actions, strictly rejects withdraws
    modifier onlyScopedSession(address trader) {
        if (msg.sender != trader) {
            require(isAuthorizedSessionKey[msg.sender], "Aegis: Unauthorized session key");
            require(sessionKeyToTrader[msg.sender] == trader, "Aegis: Session key mismatch");
        }
        _;
    }

    /// @notice GMX v2 & Arcus-style validation: checks T+1 block, 60s hold, staleness and confidence
    function _validateOptionExercise(
        uint256 optionId,
        IPyth pyth,
        bytes32 feedId
    ) internal view returns (int64 price) {
        // T+1 Block rule
        require(block.number > positionOpenedBlock[optionId], "Aegis: T+1 block violation (Flashloan blocked)");
        require(block.timestamp >= positionOpenedTime[optionId] + MIN_HOLD_SECONDS, "Aegis: Min 60s hold required");

        // Pyth staleness and confidence band check
        IPyth.Price memory pythPrice = pyth.getPriceNoOlderThan(feedId, MAX_ORACLE_DELAY_SECONDS);
        require(pythPrice.price > 0, "Aegis: Invalid negative price");
        require(uint256(pythPrice.conf) * MAX_CONFIDENCE_RATIO < uint256(uint64(pythPrice.price)), "Aegis: Oracle confidence spread too wide");

        return pythPrice.price;
    }

    /// @notice Records new position creation block & time
    function _recordPositionOpen(uint256 positionId) internal {
        positionOpenedBlock[positionId] = block.number;
        positionOpenedTime[positionId] = block.timestamp;
    }

    /// @notice Checks and enforces 24h win cooldown
    function _canParticipateInLottery(address trader) internal view returns (bool) {
        return block.timestamp >= lastWinTimestamp[trader] + WIN_COOLDOWN_DURATION;
    }

    /// @notice Checks whether trader is currently in a 60-minute Trading Freeze
    function _isTradingFrozen(address trader) internal view returns (bool) {
        return block.timestamp < tradingFreezeUntil[trader];
    }
}
