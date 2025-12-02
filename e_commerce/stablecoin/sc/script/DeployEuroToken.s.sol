// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EuroToken.sol";

contract DeployEuroToken is Script {
    function run() external returns (EuroToken) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy EuroToken
        EuroToken token = new EuroToken();
        console.log("EuroToken deployed at:", address(token));
        
        // Mint inicial de 1,000,000 tokens (con 6 decimales)
        uint256 initialMint = 1_000_000 * 10**6;
        token.mint(vm.addr(deployerPrivateKey), initialMint);
        console.log("Minted initial supply:", initialMint);
        console.log("Owner balance:", token.balanceOf(vm.addr(deployerPrivateKey)));
        
        vm.stopBroadcast();
        
        return token;
    }
}
