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

    function execute(Call calldata calls) external payable;
}
