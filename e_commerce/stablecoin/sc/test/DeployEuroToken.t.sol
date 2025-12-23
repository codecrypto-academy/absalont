// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../script/DeployEuroToken.s.sol";
import "../src/EuroToken.sol";

contract DeployEuroTokenTest is Test {
    DeployEuroToken public deployer;

    function setUp() public {
        deployer = new DeployEuroToken();
    }

    function testDeployScript() public {
        // Set up the environment variable required by the script
        vm.setEnv(
            "PRIVATE_KEY",
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        );

        EuroToken token = deployer.run();

        assertEq(token.name(), "EuroToken");
        assertEq(token.symbol(), "EURT");
        assertEq(token.decimals(), 6);

        uint256 expectedBalance = 1_000_000 * 10 ** 6;
        address owner = vm.addr(
            0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        );
        assertEq(token.balanceOf(owner), expectedBalance);
    }
}
