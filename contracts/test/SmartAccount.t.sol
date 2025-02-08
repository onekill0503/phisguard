// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {Test, console2 as console} from "forge-std/Test.sol";
import "../src/SmartAccount.sol";
import "../src/IERC7821.sol";

contract SmartAccountTest is Test {
    // the identifiers of the forks
    uint256 mainnetFork;
    SmartAccount SA;

    //Access variables from .env file via vm.envString("varname")
    //Replace ALCHEMY_KEY by your alchemy key or Etherscan key, change RPC url if need
    //inside your .env file e.g:
    //MAINNET_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/ALCHEMY_KEY'
    //string MAINNET_RPC_URL = vm.envString("MAINNET_RPC_URL");
    //string OPTIMISM_RPC_URL = vm.envString("OPTIMISM_RPC_URL");

    // create two _different_ forks during setup
    function setUp() public {
        SA = new SmartAccount(0x91A54c2CEb59b9070b29D852a249f67B6acA7Bf2);
    }

    // select a specific fork
    function testExecute() public {
        IERC7821.Call memory data = IERC7821.Call({
            to: address(0xaf4F62EBe8732A090E402335706d44d642ce130D),
            data: "0x",
            value: 0
        });
        SA.execute(data);

        // from here on data is fetched from the `mainnetFork` if the EVM requests it and written to the storage of `mainnetFork`
    }
}
