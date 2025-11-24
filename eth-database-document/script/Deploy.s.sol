// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/DocumentRegistry.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        // Obtener la clave privada del entorno o usar la primera cuenta de Anvil
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying DocumentRegistry...");
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        DocumentRegistry registry = new DocumentRegistry();
        
        vm.stopBroadcast();
        
        console.log("DocumentRegistry deployed at:", address(registry));
        console.log("");
        console.log("===========================================");
        console.log("Add this to your .env.local file:");
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=", address(registry));
        console.log("===========================================");
    }
}
