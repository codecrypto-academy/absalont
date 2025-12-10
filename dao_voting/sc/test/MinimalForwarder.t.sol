// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

contract MinimalForwarderTest is Test {
    MinimalForwarder public forwarder;
    DAOVoting public dao;
    
    address public user1;
    address public user2;
    address public relayer;
    
    uint256 public user1PrivateKey = 0x1;
    uint256 public user2PrivateKey = 0x2;
    
    function setUp() public {
        forwarder = new MinimalForwarder();
        dao = new DAOVoting(address(forwarder));
        
        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        relayer = makeAddr("relayer");
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(relayer, 10 ether);
    }
    
    function testGetNonce() public view {
        assertEq(forwarder.getNonce(user1), 0);
    }
    
    function testExecuteMetaTransaction() public {
        // User1 funds DAO
        vm.prank(user1);
        dao.fundDAO{value: 10 ether}();
        
        // Prepare meta-transaction for user2 to fund DAO
        bytes memory data = abi.encodeWithSelector(dao.fundDAO.selector);
        
        MinimalForwarder.ForwardRequest memory request = MinimalForwarder.ForwardRequest({
            from: user2,
            to: address(dao),
            value: 5 ether,
            gas: 100000,
            nonce: forwarder.getNonce(user2),
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(request);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user2PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Verify before execution
        assertTrue(forwarder.verify(request, signature));
        
        // Execute meta-transaction
        vm.prank(relayer);
        (bool success,) = forwarder.execute{value: 5 ether}(request, signature);
        assertTrue(success);
        
        // Verify user2's balance in DAO
        assertEq(dao.getUserBalance(user2), 5 ether);
        assertEq(forwarder.getNonce(user2), 1);
    }
    
    function test_RevertWhen_ReplayAttack() public {
        bytes memory data = abi.encodeWithSelector(dao.fundDAO.selector);
        
        MinimalForwarder.ForwardRequest memory request = MinimalForwarder.ForwardRequest({
            from: user1,
            to: address(dao),
            value: 1 ether,
            gas: 100000,
            nonce: forwarder.getNonce(user1),
            data: data
        });
        
        bytes32 digest = _getTypedDataHash(request);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // First execution should succeed
        vm.prank(relayer);
        forwarder.execute{value: 1 ether}(request, signature);
        
        // Second execution with same nonce should fail
        vm.prank(relayer);
        vm.expectRevert("MinimalForwarder: signature does not match request");
        forwarder.execute{value: 1 ether}(request, signature);
    }
    
    function test_RevertWhen_InvalidSignature() public {
        bytes memory data = abi.encodeWithSelector(dao.fundDAO.selector);
        
        MinimalForwarder.ForwardRequest memory request = MinimalForwarder.ForwardRequest({
            from: user1,
            to: address(dao),
            value: 1 ether,
            gas: 100000,
            nonce: forwarder.getNonce(user1),
            data: data
        });
        
        // Sign with wrong private key
        bytes32 digest = _getTypedDataHash(request);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user2PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.prank(relayer);
        vm.expectRevert("MinimalForwarder: signature does not match request");
        forwarder.execute{value: 1 ether}(request, signature);
    }
    
    function _getTypedDataHash(MinimalForwarder.ForwardRequest memory request) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"),
                request.from,
                request.to,
                request.value,
                request.gas,
                request.nonce,
                keccak256(request.data)
            )
        );
        
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                forwarder.DOMAIN_SEPARATOR(),
                structHash
            )
        );
    }
}
