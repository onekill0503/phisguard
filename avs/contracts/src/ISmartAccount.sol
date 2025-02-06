// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;



interface ISmartAccount {
    event ExecutionSuccess(address indexed target, uint256 value, bytes data);

    error FAILED_EXECUTION(string message);
    error FAILED_FORBIDDEN(string message);

    function executeSingle(bytes calldata data, address to, uint256 value) external payable;
}
