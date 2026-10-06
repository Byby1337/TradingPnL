// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TimelockController
 * @notice 48-Hour Governance Timelock for Safe Multisig (2/3 or 3/5).
 * Acts as the ultimate administrative owner for all TradingPnL contracts:
 * LotteryCore, OptionVault, OptionLiquidityPool, PnLRouter, SuperJackpotVault, PlatformTreasury.
 * All proposed governance actions must spend at least 48 hours in queue before execution.
 */
contract TimelockController {
    uint256 public constant MIN_DELAY = 48 hours;
    uint256 public constant MAX_DELAY = 30 days;

    address public safeMultisig;
    uint256 public delay;

    // Operation status
    enum OperationState {
        Unset,
        Waiting,
        Ready,
        Done
    }

    mapping(bytes32 => uint256) public timestamps;

    event CallScheduled(
        bytes32 indexed id,
        uint256 indexed index,
        address target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        uint256 delay
    );
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);
    event Cancelled(bytes32 indexed id);
    event MinDelayChange(uint256 newDelay, uint256 previousDelay);
    event SafeMultisigUpdated(address indexed previousSafe, address indexed newSafe);

    modifier onlySafe() {
        require(msg.sender == safeMultisig, "Timelock: Caller is not Safe Multisig");
        _;
    }

    modifier onlySelf() {
        require(msg.sender == address(this), "Timelock: Caller must be Timelock itself");
        _;
    }

    constructor(address _safeMultisig, uint256 _delay) {
        require(_safeMultisig != address(0), "Timelock: Zero Safe address");
        require(_delay >= MIN_DELAY && _delay <= MAX_DELAY, "Timelock: Delay outside bounds (48h - 30d)");
        safeMultisig = _safeMultisig;
        delay = _delay;
        emit MinDelayChange(_delay, 0);
    }

    function isOperation(bytes32 id) public view returns (bool) {
        return getOperationState(id) != OperationState.Unset;
    }

    function isOperationPending(bytes32 id) public view returns (bool) {
        OperationState state = getOperationState(id);
        return state == OperationState.Waiting || state == OperationState.Ready;
    }

    function isOperationReady(bytes32 id) public view returns (bool) {
        return getOperationState(id) == OperationState.Ready;
    }

    function isOperationDone(bytes32 id) public view returns (bool) {
        return getOperationState(id) == OperationState.Done;
    }

    function getTimestamp(bytes32 id) public view returns (uint256) {
        return timestamps[id];
    }

    function getOperationState(bytes32 id) public view returns (OperationState) {
        uint256 timestamp = timestamps[id];
        if (timestamp == 0) {
            return OperationState.Unset;
        }
        if (timestamp == 1) {
            return OperationState.Done;
        }
        if (timestamp > block.timestamp) {
            return OperationState.Waiting;
        }
        return OperationState.Ready;
    }

    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /// @notice Safe Multisig queues an administrative call
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 customDelay
    ) external onlySafe returns (bytes32 id) {
        id = hashOperation(target, value, data, predecessor, salt);
        require(!isOperation(id), "Timelock: Operation already scheduled");
        require(customDelay >= delay, "Timelock: Delay shorter than minimum");

        uint256 scheduledTime = block.timestamp + customDelay;
        timestamps[id] = scheduledTime;

        emit CallScheduled(id, 0, target, value, data, predecessor, customDelay);
        return id;
    }

    /// @notice Cancel a queued operation before execution
    function cancel(bytes32 id) external onlySafe {
        require(isOperationPending(id), "Timelock: Operation cannot be cancelled");
        delete timestamps[id];
        emit Cancelled(id);
    }

    /// @notice Execute an operation after 48h timelock has elapsed
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable returns (bytes memory) {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        require(isOperationReady(id), "Timelock: Operation not ready or 48h not elapsed");
        if (predecessor != bytes32(0)) {
            require(isOperationDone(predecessor), "Timelock: Predecessor not done");
        }

        // Mark as Done (1) before external call to prevent reentrancy
        timestamps[id] = 1;

        (bool success, bytes memory returndata) = target.call{value: value}(data);
        require(success, "Timelock: Underlying call reverted");

        emit CallExecuted(id, 0, target, value, data);
        return returndata;
    }

    /// @notice Update Safe Multisig address (can only be executed through timelock self-call)
    function updateSafeMultisig(address newSafe) external onlySelf {
        require(newSafe != address(0), "Timelock: Zero Safe address");
        address prev = safeMultisig;
        safeMultisig = newSafe;
        emit SafeMultisigUpdated(prev, newSafe);
    }

    /// @notice Update default delay (can only be executed through timelock self-call)
    function updateDelay(uint256 newDelay) external onlySelf {
        require(newDelay >= MIN_DELAY && newDelay <= MAX_DELAY, "Timelock: Invalid delay");
        emit MinDelayChange(newDelay, delay);
        delay = newDelay;
    }

    receive() external payable {}
}
