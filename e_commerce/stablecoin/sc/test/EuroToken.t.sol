// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public token;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        token = new EuroToken();
    }

    function testDeployment() public {
        assertEq(token.name(), "EuroToken");
        assertEq(token.symbol(), "EURT");
        assertEq(token.decimals(), 6);
        assertEq(token.owner(), owner);
    }

    function testMintByOwner() public {
        uint256 amount = 1000 * 10 ** 6; // 1000 EURT

        token.mint(user1, amount);

        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), amount);
    }

    function testMintByNonOwner() public {
        uint256 amount = 1000 * 10 ** 6;

        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, amount);
    }

    function testMintToZeroAddress() public {
        uint256 amount = 1000 * 10 ** 6;

        vm.expectRevert("Cannot mint to zero address");
        token.mint(address(0), amount);
    }

    function testMintZeroAmount() public {
        vm.expectRevert("Amount must be greater than 0");
        token.mint(user1, 0);
    }

    function testTransfer() public {
        uint256 amount = 1000 * 10 ** 6;
        uint256 transferAmount = 300 * 10 ** 6;

        // Mint tokens to user1
        token.mint(user1, amount);

        // Transfer from user1 to user2
        vm.prank(user1);
        token.transfer(user2, transferAmount);

        assertEq(token.balanceOf(user1), amount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);
    }

    function testBurnByOwner() public {
        uint256 amount = 1000 * 10 ** 6;
        uint256 burnAmount = 300 * 10 ** 6;

        token.mint(user1, amount);
        token.burn(user1, burnAmount);

        assertEq(token.balanceOf(user1), amount - burnAmount);
        assertEq(token.totalSupply(), amount - burnAmount);
    }

    function testBurnByNonOwner() public {
        uint256 amount = 1000 * 10 ** 6;

        token.mint(user1, amount);

        vm.prank(user1);
        vm.expectRevert();
        token.burn(user1, 100 * 10 ** 6);
    }

    function testBurnOwn() public {
        uint256 amount = 1000 * 10 ** 6;
        uint256 burnAmount = 300 * 10 ** 6;

        token.mint(user1, amount);

        vm.prank(user1);
        token.burnOwn(burnAmount);

        assertEq(token.balanceOf(user1), amount - burnAmount);
    }

    function testMintEvent() public {
        uint256 amount = 1000 * 10 ** 6;

        vm.expectEmit(true, false, false, true);
        emit EuroToken.TokensMinted(user1, amount, block.timestamp);

        token.mint(user1, amount);
    }

    function testMultipleMints() public {
        uint256 amount1 = 1000 * 10 ** 6;
        uint256 amount2 = 500 * 10 ** 6;

        token.mint(user1, amount1);
        token.mint(user2, amount2);

        assertEq(token.balanceOf(user1), amount1);
        assertEq(token.balanceOf(user2), amount2);
        assertEq(token.totalSupply(), amount1 + amount2);
    }

    function testApproveAndTransferFrom() public {
        uint256 amount = 1000 * 10 ** 6;
        uint256 transferAmount = 300 * 10 ** 6;

        token.mint(user1, amount);

        // User1 approves user2 to spend tokens
        vm.prank(user1);
        token.approve(user2, transferAmount);

        assertEq(token.allowance(user1, user2), transferAmount);

        // User2 transfers from user1 to themselves
        vm.prank(user2);
        token.transferFrom(user1, user2, transferAmount);

        assertEq(token.balanceOf(user1), amount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);
    }

    function testBurnFromZeroAddress() public {
        vm.expectRevert("Cannot burn from zero address");
        token.burn(address(0), 100);
    }

    function testBurnZeroAmount() public {
        vm.expectRevert("Amount must be greater than 0");
        token.burn(user1, 0);
    }

    function testBurnInsufficientBalance() public {
        token.mint(user1, 100);
        vm.expectRevert("Insufficient balance");
        token.burn(user1, 200);
    }

    function testBurnOwnZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        token.burnOwn(0);
    }

    function testBurnOwnInsufficientBalance() public {
        token.mint(user1, 100);
        vm.prank(user1);
        vm.expectRevert("Insufficient balance");
        token.burnOwn(200);
    }
}
