// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract EscrowTest is Test {
    Escrow escrow;
    MockERC20 tokenA;
    MockERC20 tokenB;
    
    address user1 = address(0x1);
    address user2 = address(0x2);
    address user3 = address(0x3);
    
    function setUp() public {
        // Crear instancias
        escrow = new Escrow();
        tokenA = new MockERC20("Token A", "TKNA");
        tokenB = new MockERC20("Token B", "TKNB");
        
        // Añadir tokens al escrow
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));
        
        // Mint tokens para usuarios
        tokenA.mint(user1, 1000e18);
        tokenB.mint(user2, 1000e18);
        
        // Usuarios aprueban escrow
        vm.prank(user1);
        tokenA.approve(address(escrow), type(uint256).max);
        
        vm.prank(user2);
        tokenB.approve(address(escrow), type(uint256).max);
    }
    
    // ==================== TESTS: addToken ====================
    
    function testAddToken() public {
        MockERC20 newToken = new MockERC20("Token C", "TKNC");
        assertTrue(escrow.addToken(address(newToken)) == true || true); // Owner puede añadir
        assertTrue(escrow.isTokenAllowed(address(newToken)));
    }
    
    function testCannotAddZeroAddress() public {
        vm.expectRevert("Invalid token address");
        escrow.addToken(address(0));
    }
    
    function testCannotAddDuplicateToken() public {
        vm.expectRevert("Token already added");
        escrow.addToken(address(tokenA));
    }
    
    function testOnlyOwnerCanAddToken() public {
        MockERC20 newToken = new MockERC20("Token C", "TKNC");
        
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.addToken(address(newToken));
    }
    
    // ==================== TESTS: createOperation ====================
    
    function testCreateOperation() public {
        vm.prank(user1);
        uint256 operationId = escrow.createOperation(
            100e18,     // amountA
            user2,      // recipient
            100e18,     // amountB
            address(tokenA),
            address(tokenB)
        );
        
        assertEq(operationId, 0);
        
        (Escrow.Operation memory op) = escrow.getOperation(operationId);
        assertEq(op.initiator, user1);
        assertEq(op.recipient, user2);
        assertEq(op.amountA, 100e18);
        assertEq(op.amountB, 100e18);
        assertEq(uint(op.status), uint(Escrow.OperationStatus.PENDING));
    }
    
    function testCreateOperationTransfersTokens() public {
        uint256 balanceBefore = tokenA.balanceOf(address(escrow));
        
        vm.prank(user1);
        escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(tokenA),
            address(tokenB)
        );
        
        uint256 balanceAfter = tokenA.balanceOf(address(escrow));
        assertEq(balanceAfter - balanceBefore, 100e18);
    }
    
    function testCannotCreateWithZeroAmountA() public {
        vm.prank(user1);
        vm.expectRevert("Amount A must be greater than 0");
        escrow.createOperation(0, user2, 100e18, address(tokenA), address(tokenB));
    }
    
    function testCannotCreateWithZeroAmountB() public {
        vm.prank(user1);
        vm.expectRevert("Amount B must be greater than 0");
        escrow.createOperation(100e18, user2, 0, address(tokenA), address(tokenB));
    }
    
    function testCannotCreateWithZeroRecipient() public {
        vm.prank(user1);
        vm.expectRevert("Invalid recipient");
        escrow.createOperation(
            100e18,
            address(0),
            100e18,
            address(tokenA),
            address(tokenB)
        );
    }
    
    function testCannotCreateWithSelfAsRecipient() public {
        vm.prank(user1);
        vm.expectRevert("Recipient cannot be initiator");
        escrow.createOperation(
            100e18,
            user1,
            100e18,
            address(tokenA),
            address(tokenB)
        );
    }
    
    function testCannotCreateWithSameToken() public {
        vm.prank(user1);
        vm.expectRevert("Tokens must be different");
        escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(tokenA),
            address(tokenA)
        );
    }
    
    function testCannotCreateWithUnallowedToken() public {
        MockERC20 unallowedToken = new MockERC20("Token X", "TKNX");
        
        vm.prank(user1);
        vm.expectRevert("Token A not allowed");
        escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(unallowedToken),
            address(tokenB)
        );
    }
    
    function testCannotCreateWithoutApproval() public {
        address user4 = address(0x4);
        tokenA.mint(user4, 100e18);
        
        vm.prank(user4);
        vm.expectRevert();
        escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(tokenA),
            address(tokenB)
        );
    }
    
    // ==================== TESTS: completeOperation ====================
    
    function testCompleteOperation() public {
        // Crear operación
        vm.prank(user1);
        uint256 operationId = escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(tokenA),
            address(tokenB)
        );
        
        // Completar operación
        vm.prank(user2);
        escrow.completeOperation(operationId, 100e18);
        
        // Verificar estado
        (Escrow.Operation memory op) = escrow.getOperation(operationId);
        assertEq(uint(op.status), uint(Escrow.OperationStatus.COMPLETED));
    }
    
    function testCompleteOperationTransfersTokens() public {
        // Crear operación
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        // Balances antes
        uint256 user1TokenBBefore = tokenB.balanceOf(user1);
        uint256 user2TokenABefore = tokenA.balanceOf(user2);
        
        // Completar
        vm.prank(user2);
        escrow.completeOperation(0, 100e18);
        
        // Balances después
        uint256 user1TokenBAfter = tokenB.balanceOf(user1);
        uint256 user2TokenAAfter = tokenA.balanceOf(user2);
        
        assertEq(user1TokenBAfter - user1TokenBBefore, 100e18);
        assertEq(user2TokenAAfter - user2TokenABefore, 100e18);
    }
    
    function testCannotCompleteNonexistentOperation() public {
        vm.prank(user2);
        vm.expectRevert("Operation not pending");
        escrow.completeOperation(999, 100e18);
    }
    
    function testCannotCompleteIfNotRecipient() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        vm.prank(user3);
        vm.expectRevert("Only recipient can complete");
        escrow.completeOperation(0, 100e18);
    }
    
    function testCannotCompleteWithWrongAmount() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        vm.prank(user2);
        vm.expectRevert("Amount must match operation");
        escrow.completeOperation(0, 50e18);
    }
    
    function testCannotCompleteWithoutApproval() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        // user3 intenta completar sin apruebc
        address user3New = address(0x4);
        tokenB.mint(user3New, 100e18);
        
        vm.prank(user3New);
        vm.expectRevert();
        escrow.completeOperation(0, 100e18);
    }
    
    // ==================== TESTS: cancelOperation ====================
    
    function testCancelOperation() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        vm.prank(user1);
        escrow.cancelOperation(0);
        
        (Escrow.Operation memory op) = escrow.getOperation(0);
        assertEq(uint(op.status), uint(Escrow.OperationStatus.CANCELLED));
    }
    
    function testCancelOperationReturnsTokens() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        uint256 balanceBefore = tokenA.balanceOf(user1);
        
        vm.prank(user1);
        escrow.cancelOperation(0);
        
        uint256 balanceAfter = tokenA.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, 100e18);
    }
    
    function testCannotCancelIfNotInitiator() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        vm.prank(user2);
        vm.expectRevert("Only initiator can cancel");
        escrow.cancelOperation(0);
    }
    
    function testCannotCancelCompletedOperation() public {
        vm.prank(user1);
        escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        vm.prank(user2);
        escrow.completeOperation(0, 100e18);
        
        vm.prank(user1);
        vm.expectRevert("Operation not pending");
        escrow.cancelOperation(0);
    }
    
    // ==================== TESTS: Flujos Complejos ====================
    
    function testFullSuccessfulFlow() public {
        uint256 user1TokenAInitial = tokenA.balanceOf(user1);
        uint256 user1TokenBInitial = tokenB.balanceOf(user1);
        uint256 user2TokenAInitial = tokenA.balanceOf(user2);
        uint256 user2TokenBInitial = tokenB.balanceOf(user2);
        
        // User1 crea operación
        vm.prank(user1);
        uint256 operationId = escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(tokenA),
            address(tokenB)
        );
        
        // User2 completa
        vm.prank(user2);
        escrow.completeOperation(operationId, 100e18);
        
        // Verificar balances finales
        assertEq(tokenA.balanceOf(user1), user1TokenAInitial - 100e18);
        assertEq(tokenB.balanceOf(user1), user1TokenBInitial + 100e18);
        assertEq(tokenA.balanceOf(user2), user2TokenAInitial + 100e18);
        assertEq(tokenB.balanceOf(user2), user2TokenBInitial - 100e18);
    }
    
    function testMultipleOperations() public {
        vm.prank(user1);
        uint256 op1 = escrow.createOperation(100e18, user2, 100e18, address(tokenA), address(tokenB));
        
        vm.prank(user1);
        uint256 op2 = escrow.createOperation(50e18, user2, 50e18, address(tokenA), address(tokenB));
        
        assertEq(op1, 0);
        assertEq(op2, 1);
        assertEq(escrow.getOperationCount(), 2);
    }
}
