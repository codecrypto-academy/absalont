// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DocumentRegistry.sol";

contract DocumentRegistryTest is Test {
    DocumentRegistry public registry;

    address public signer1;
    uint256 public signer1PrivateKey;
    address public signer2;
    uint256 public signer2PrivateKey;

    bytes32 public constant TEST_HASH = keccak256("test document content");
    uint256 public constant TEST_TIMESTAMP = 1700000000;

    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp,
        bytes signature
    );

    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );

    function setUp() public {
        registry = new DocumentRegistry();

        signer1PrivateKey = 0xA11CE;
        signer1 = vm.addr(signer1PrivateKey);

        signer2PrivateKey = 0xB0B;
        signer2 = vm.addr(signer2PrivateKey);

        vm.deal(signer1, 10 ether);
        vm.deal(signer2, 10 ether);
    }

    // ============================================================
    // Helper: Signature creation
    // ============================================================

    function _createSignature(
        bytes32 _hash,
        uint256 _timestamp,
        uint256 _privateKey
    ) internal pure returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(_hash, _timestamp));

        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_privateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    // ============================================================
    // StoreDocument Tests
    // ============================================================

    function test_StoreDocumentHash_Success() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        vm.expectEmit(true, true, false, true);
        emit DocumentStored(TEST_HASH, signer1, TEST_TIMESTAMP, signature);

        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        DocumentRegistry.Document memory doc = registry.getDocumentInfo(TEST_HASH);

        assertEq(doc.timestamp, TEST_TIMESTAMP);
        assertEq(doc.signer, signer1);
        assertEq(keccak256(doc.signature), keccak256(signature));
        assertTrue(doc.signer != address(0));
    }

    function test_StoreDocumentHash_RevertEmptyHash() public {
        bytes memory signature =
            _createSignature(bytes32(0), TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        vm.expectRevert("Hash cannot be empty");
        registry.storeDocumentHash(bytes32(0), TEST_TIMESTAMP, signature, signer1);
    }

    function test_StoreDocumentHash_RevertDuplicateHash() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        vm.prank(signer1);
        vm.expectRevert("Document already exists");
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);
    }

    function test_StoreDocumentHash_RevertInvalidSignature() public {
        vm.prank(signer1);
        vm.expectRevert("Invalid signature");
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, new bytes(0), signer1);
    }

    function test_StoreDocumentHash_RevertInvalidSigner() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        vm.expectRevert("Invalid signer address");
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, address(0));
    }

    // ============================================================
    // VerifyDocument Tests (view function - no events)
    // ============================================================

    function test_VerifyDocument_Success() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        // verifyDocument es view, no emite eventos
        assertTrue(registry.verifyDocument(TEST_HASH, signer1, signature));
    }

    function test_VerifyDocument_NonExistent() public view {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        assertFalse(registry.verifyDocument(TEST_HASH, signer1, signature));
    }

    function test_VerifyDocument_WrongSigner() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        assertFalse(registry.verifyDocument(TEST_HASH, signer2, signature));
    }

    function test_VerifyDocument_WrongSignature() public {
        bytes memory goodSig =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        bytes memory badSig =
            _createSignature(TEST_HASH, TEST_TIMESTAMP + 1, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, goodSig, signer1);

        assertFalse(registry.verifyDocument(TEST_HASH, signer1, badSig));
    }

    function test_VerifyDocument_EmptySignature() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        assertFalse(registry.verifyDocument(TEST_HASH, signer1, new bytes(0)));
    }

    function test_VerifyDocument_SignerMatchesButEmptySignature() public {
        bytes memory goodSig =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, goodSig, signer1);

        assertFalse(registry.verifyDocument(TEST_HASH, signer1, new bytes(0)));
    }

    function test_VerifyDocument_IsViewFunction() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        // verifyDocument es view y NO emite eventos
        bool result = registry.verifyDocument(TEST_HASH, signer1, signature);
        assertTrue(result);
        
        // Verificar que se puede llamar múltiples veces sin modificar estado
        bool result2 = registry.verifyDocument(TEST_HASH, signer1, signature);
        assertTrue(result2);
    }

    // ============================================================
    // VerifyDocumentWithEvent Tests (con eventos)
    // ============================================================

    function test_VerifyDocumentWithEvent_Success() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        vm.expectEmit(true, true, false, true);
        emit DocumentVerified(TEST_HASH, signer1, true);
        
        assertTrue(registry.verifyDocumentWithEvent(TEST_HASH, signer1, signature));
    }

    function test_VerifyDocumentWithEvent_False() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        bytes memory wrongSig = _createSignature(TEST_HASH, TEST_TIMESTAMP + 1, signer1PrivateKey);

        vm.expectEmit(true, true, false, true);
        emit DocumentVerified(TEST_HASH, signer1, false);
        
        assertFalse(registry.verifyDocumentWithEvent(TEST_HASH, signer1, wrongSig));
    }

    // ============================================================
    // User Documents Tests
    // ============================================================

    function test_GetUserDocuments() public {
        bytes32 h1 = keccak256("doc1");
        bytes32 h2 = keccak256("doc2");

        bytes memory s1 = _createSignature(h1, TEST_TIMESTAMP, signer1PrivateKey);
        bytes memory s2 = _createSignature(h2, TEST_TIMESTAMP + 1, signer1PrivateKey);

        vm.startPrank(signer1);
        registry.storeDocumentHash(h1, TEST_TIMESTAMP, s1, signer1);
        registry.storeDocumentHash(h2, TEST_TIMESTAMP + 1, s2, signer1);
        vm.stopPrank();

        bytes32[] memory docs = registry.getUserDocuments(signer1);
        assertEq(docs.length, 2);
        assertEq(docs[0], h1);
        assertEq(docs[1], h2);
    }

    function test_GetUserDocuments_EmptyForNewUser() public view {
        address user = address(0x999);
        bytes32[] memory docs = registry.getUserDocuments(user);
        assertEq(docs.length, 0);
    }

    function test_MultipleUsersDocuments() public {
        bytes32 h1 = keccak256("user1-doc1");
        bytes32 h2 = keccak256("user2-doc1");

        bytes memory s1 = _createSignature(h1, TEST_TIMESTAMP, signer1PrivateKey);
        bytes memory s2 = _createSignature(h2, TEST_TIMESTAMP, signer2PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(h1, TEST_TIMESTAMP, s1, signer1);

        vm.prank(signer2);
        registry.storeDocumentHash(h2, TEST_TIMESTAMP, s2, signer2);

        bytes32[] memory d1 = registry.getUserDocuments(signer1);
        bytes32[] memory d2 = registry.getUserDocuments(signer2);

        assertEq(d1.length, 1);
        assertEq(d2.length, 1);
        assertEq(d1[0], h1);
        assertEq(d2[0], h2);
        assertEq(registry.getDocumentCount(), 2);
    }

    // ============================================================
    // Accessor Tests
    // ============================================================

    function test_GetDocumentCount() public {
        assertEq(registry.getDocumentCount(), 0);

        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        assertEq(registry.getDocumentCount(), 1);
    }

    function test_DocumentExists() public {
        assertFalse(registry.isDocumentStored(TEST_HASH));

        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        assertTrue(registry.isDocumentStored(TEST_HASH));
    }

    function test_GetDocumentInfo() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        DocumentRegistry.Document memory doc =
            registry.getDocumentInfo(TEST_HASH);

        assertEq(doc.hash, TEST_HASH);
        assertEq(doc.timestamp, TEST_TIMESTAMP);
        assertEq(doc.signer, signer1);
        assertEq(keccak256(doc.signature), keccak256(signature));
    }

    function test_GetDocumentInfo_RevertNonExistent() public {
        bytes32 h = keccak256(abi.encodePacked("non-existent"));

        vm.expectRevert("Document does not exist");
        registry.getDocumentInfo(h);
    }

    function test_GetDocumentHashByIndex() public {
        bytes32 h1 = keccak256("doc1");
        bytes32 h2 = keccak256("doc2");

        bytes memory s1 = _createSignature(h1, TEST_TIMESTAMP, signer1PrivateKey);
        bytes memory s2 = _createSignature(h2, TEST_TIMESTAMP + 1, signer1PrivateKey);

        vm.startPrank(signer1);
        registry.storeDocumentHash(h1, TEST_TIMESTAMP, s1, signer1);
        registry.storeDocumentHash(h2, TEST_TIMESTAMP + 1, s2, signer1);
        vm.stopPrank();

        assertEq(registry.getDocumentHashByIndex(0), h1);
        assertEq(registry.getDocumentHashByIndex(1), h2);
    }

    function test_GetDocumentHashByIndex_RevertOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        registry.getDocumentHashByIndex(999);
    }

    // ============================================================
    // Events
    // ============================================================

    function test_Events_DocumentStored() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.expectEmit(true, true, false, true);
        emit DocumentStored(TEST_HASH, signer1, TEST_TIMESTAMP, signature);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);
    }

    function test_Events_DocumentVerifiedWithEvent() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        // verifyDocumentWithEvent SÍ emite eventos
        vm.expectEmit(true, true, false, true);
        emit DocumentVerified(TEST_HASH, signer1, true);
        registry.verifyDocumentWithEvent(TEST_HASH, signer1, signature);
    }

    function test_Events_DocumentVerifiedFalse() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        bytes32 wrongHash = keccak256("wrong");

        vm.expectEmit(true, true, false, true);
        emit DocumentVerified(wrongHash, signer1, false);
        registry.verifyDocumentWithEvent(wrongHash, signer1, signature);
    }

    // ============================================================
    // Modifier Tests
    // ============================================================

    function test_Modifier_DocumentExists_Success() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        // Llamada que usa el modifier y NO revierte
        DocumentRegistry.Document memory doc = registry.getDocumentInfo(TEST_HASH);

        // Validación mínima
        assertEq(doc.hash, TEST_HASH);
    }

    function test_Modifier_DocumentNotExists_Success() public {
        bytes memory signature =
            _createSignature(TEST_HASH, TEST_TIMESTAMP, signer1PrivateKey);

        vm.prank(signer1);
        registry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature, signer1);

        // Solo verificamos que la primera vez pasó sin revert
        assertTrue(registry.isDocumentStored(TEST_HASH));
    }
}