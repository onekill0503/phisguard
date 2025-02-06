// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ISmartAccount.sol";
import "./IERC7821.sol";

contract SmartAccount is IERC7821, ISmartAccount {

    address public owner;
    address public avs;

    constructor(address _avs){
        owner = msg.sender;
        avs = _avs;
    }
    
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

    function executeSingle(bytes data, address to, uint256 value) external payable override {
        if(msg.sender != avs) revert FAILED_FORBIDDEN("Only AVS can executeSingle");

        (bool success, bytes memory result) = to.call{value: value}(data);
        if (!success) revert FAILED_EXECUTION(_getRevertMsg(result));
    }

    function updateAVS(address _avs) external {
        if(msg.sender != owner) revert FAILED_FORBIDDEN("Only owner can update AVS");
        require(msg.sender == owner, "Only owner can update AVS");
        avs = _avs;
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
