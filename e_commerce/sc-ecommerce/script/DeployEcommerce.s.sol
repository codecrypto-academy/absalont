// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Ecommerce.sol";

contract DeployEcommerce is Script {
    function run() external returns (Ecommerce) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("EUROTOKEN_ADDRESS");

        require(tokenAddress != address(0), "EuroToken address required");

        vm.startBroadcast(deployerPrivateKey);

        Ecommerce ecommerce = new Ecommerce(tokenAddress);
        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("Using EuroToken at:", tokenAddress);

        vm.stopBroadcast();

        return ecommerce;
    }
}
