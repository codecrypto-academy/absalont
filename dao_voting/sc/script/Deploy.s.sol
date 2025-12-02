// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MinimalForwarder first
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));
        
        // Deploy DAOVoting with forwarder address
        DAOVoting dao = new DAOVoting(address(forwarder));
        console.log("DAOVoting deployed at:", address(dao));
        
        vm.stopBroadcast();
        
        // Save deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("MinimalForwarder:", address(forwarder));
        console.log("DAOVoting:", address(dao));
        console.log("Chain ID:", block.chainid);
        console.log("==========================\n");
    }
}
