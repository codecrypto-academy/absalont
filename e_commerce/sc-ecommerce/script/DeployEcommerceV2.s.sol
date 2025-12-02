// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EcommerceV2.sol";
import "../src/LoyaltyNFT.sol";

contract DeployEcommerceV2 is Script {
    function run() external returns (EcommerceV2, LoyaltyNFT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("EUROTOKEN_ADDRESS");

        require(tokenAddress != address(0), "EuroToken address required");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy LoyaltyNFT
        LoyaltyNFT loyaltyNFT = new LoyaltyNFT();
        console.log("LoyaltyNFT deployed at:", address(loyaltyNFT));

        // Deploy EcommerceV2
        EcommerceV2 ecommerce = new EcommerceV2(tokenAddress, address(loyaltyNFT));
        console.log("EcommerceV2 deployed at:", address(ecommerce));
        console.log("Using EuroToken at:", tokenAddress);

        // Transfer ownership of LoyaltyNFT to Ecommerce contract
        loyaltyNFT.transferOwnership(address(ecommerce));
        console.log("LoyaltyNFT ownership transferred to EcommerceV2");

        vm.stopBroadcast();

        return (ecommerce, loyaltyNFT);
    }
}
