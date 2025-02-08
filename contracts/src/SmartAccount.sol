// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ISmartAccount.sol";
import "./IERC7821.sol";
import "./IHelloWorldServiceManager.sol";

contract SmartAccount is IERC7821, ISmartAccount {
    

    function execute(Call calldata calls) external payable override {
        // We put service manager address here cause when we use eip7702 there is different storage between smartcontract and eoa wallet.abi
        // so when we put service manager address above , it cause an error
        IHelloWorldServiceManager serviceManager = IHelloWorldServiceManager(0x4bB6e6967300618124b276AE79125798753D0847);
        serviceManager.createNewTask(msg.sender, calls.to, calls.data, calls.value);
    }

    function executeSingle(bytes memory data, address to, uint256 value) external payable override {
        if (msg.sender != address(0x4bB6e6967300618124b276AE79125798753D0847)) {
            revert FAILED_FORBIDDEN("Only AVS can executeSingle");
        }

        (bool success, bytes memory result) = to.call{value: value}(data);
        if (!success) revert FAILED_EXECUTION(_getRevertMsg(result));
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
