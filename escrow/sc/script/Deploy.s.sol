// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract Deploy is Script {
    function run() public {
        vm.startBroadcast();
        
        // 1. Desplegar Escrow
        Escrow escrow = new Escrow();
        console.log("Escrow deployed at:", address(escrow));
        
        // 2. Desplegar Tokens Mock
        MockERC20 tokenA = new MockERC20("Token A", "TKNA");
        MockERC20 tokenB = new MockERC20("Token B", "TKNB");
        
        console.log("Token A deployed at:", address(tokenA));
        console.log("Token B deployed at:", address(tokenB));
        
        // 3. Añadir tokens permitidos
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));
        
        console.log("Tokens added to escrow");
        
        // 4. Mint tokens para el usuario (solo en redes locales/test)
        uint256 initialSupply = 1000e18;
        tokenA.mint(msg.sender, initialSupply);
        tokenB.mint(msg.sender, initialSupply);
        
        console.log("Initial supply minted:");
        console.log("  User:", msg.sender);
        console.log("  Token A:", initialSupply);
        console.log("  Token B:", initialSupply);
        
        // 5. Imprimir direcciones para .env.local
        console.log("=== COPY TO .env.local ===");
        console.log("NEXT_PUBLIC_ESCROW_ADDRESS=", address(escrow));
        console.log("NEXT_PUBLIC_TOKEN_A_ADDRESS=", address(tokenA));
        console.log("NEXT_PUBLIC_TOKEN_B_ADDRESS=", address(tokenB));
        
        vm.stopBroadcast();
    }
}
