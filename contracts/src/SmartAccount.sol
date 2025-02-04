// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Implements batch execution of transactions, supporting EIP-7702
interface IERC7821 {
    enum ExecutionMode {
        CALL,
        DELEGATECALL
    }

    struct Call {
        bytes data;
        address to;
        uint256 value;
    }

    function execute(Call[] calldata calls, ExecutionMode mode) external payable;
}

contract SmartAccount is IERC7821 {
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);

    error FAILED_EXECUTION(string message);

    /// @notice Executes a batch of calls based on the provided struct array
    /// @param calls An array of Call structs containing target addresses, values, and data
    /// @param mode Execution mode (CALL [0] or DELEGATECALL [1])
    function execute(Call[] calldata calls, ExecutionMode mode) external payable override {
        for (uint256 i = 0; i < calls.length; i++) {
            bool success;
            bytes memory result;

            if (mode == ExecutionMode.CALL) {
                (success, result) = calls[i].to.call{value: calls[i].value}(calls[i].data);
            } else {
                (success, result) = calls[i].to.delegatecall(calls[i].data);
            }

            if (!success) revert FAILED_EXECUTION(_getRevertMsg(result));
        }
    }

    /// @notice Function to extract the revert message from the return data
    function _getRevertMsg(bytes memory returnData) private pure returns (string memory) {
        if (returnData.length < 68) return "Transaction reverted";
        assembly {
            returnData := add(returnData, 0x04)
        }
        return abi.decode(returnData, (string));
    }

    /// @notice Allows receiving ETH
    receive() external payable {}
}
