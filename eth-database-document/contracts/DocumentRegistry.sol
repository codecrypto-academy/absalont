// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentRegistry
 * @dev Smart contract for storing and verifying document hashes with signatures
 */
contract DocumentRegistry {
    // Struct to store document information
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
    }

    // Mapping from document hash to Document struct
    mapping(bytes32 => Document) public documents;
    
    // Array to store all document hashes for enumeration
    bytes32[] public documentHashes;
    
    // Mapping from user address to their document hashes
    mapping(address => bytes32[]) private userDocuments;

    // Events
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

    // Modifiers
    modifier documentNotExists(bytes32 _hash) {
        _checkDocumentNotExists(_hash);
        _;
    }

    modifier documentExists(bytes32 _hash) {
        _checkDocumentExists(_hash);
        _;
    }

    // Internal validation functions
    function _checkDocumentNotExists(bytes32 _hash) internal view {
        require(documents[_hash].signer == address(0), "Document already exists");
    }

    function _checkDocumentExists(bytes32 _hash) internal view {
        require(documents[_hash].signer != address(0), "Document does not exist");
    }

    /**
     * @dev Store a document hash with signature
     * @param _hash The hash of the document
     * @param _timestamp The timestamp when the document was created
     * @param _signature The signature of the document hash
     * @param _signer The address of the signer
     */
    function storeDocumentHash(
        bytes32 _hash,
        uint256 _timestamp,
        bytes memory _signature,
        address _signer
    ) external documentNotExists(_hash) {
        require(_hash != bytes32(0), "Hash cannot be empty");
        require(_signature.length > 0, "Invalid signature");
        require(_signer != address(0), "Invalid signer address");
        
        documents[_hash] = Document({
            hash: _hash,
            timestamp: _timestamp,
            signer: _signer,
            signature: _signature
        });
        
        documentHashes.push(_hash);
        userDocuments[_signer].push(_hash);
        
        emit DocumentStored(_hash, _signer, _timestamp, _signature);
    }

    /**
     * @dev Verify a document signature (view function - no state change)
     * @param _hash The hash of the document
     * @param _signer The address of the signer
     * @param _signature The signature to verify
     * @return isValid True if the signature is valid
     */
    function verifyDocument(
        bytes32 _hash,
        address _signer,
        bytes memory _signature
    ) external view returns (bool isValid) {
        Document memory doc = documents[_hash];
        
        if (doc.signer == address(0)) {
            return false;
        }
        
        // Verificar que el signer coincida y que las firmas sean idénticas
        return (doc.signer == _signer && 
                keccak256(doc.signature) == keccak256(_signature));
    }

    /**
     * @dev Verify and emit event (for when you need to log verification)
     * @param _hash The hash of the document
     * @param _signer The address of the signer
     * @param _signature The signature to verify
     * @return isValid True if the signature is valid
     */
    function verifyDocumentWithEvent(
        bytes32 _hash,
        address _signer,
        bytes memory _signature
    ) external returns (bool isValid) {
        Document memory doc = documents[_hash];
        
        if (doc.signer == address(0)) {
            isValid = false;
        } else {
            isValid = (doc.signer == _signer && 
                      keccak256(doc.signature) == keccak256(_signature));
        }
        
        emit DocumentVerified(_hash, _signer, isValid);
        return isValid;
    }

    /**
     * @dev Get complete document information
     * @param _hash The hash of the document
     * @return document The complete document struct
     */
    function getDocumentInfo(bytes32 _hash) 
        external 
        view 
        documentExists(_hash) 
        returns (Document memory document) 
    {
        return documents[_hash];
    }

    /**
     * @dev Get user's documents
     * @param _user The address of the user
     * @return hashes Array of document hashes owned by the user
     */
    function getUserDocuments(address _user) 
        external 
        view 
        returns (bytes32[] memory hashes) 
    {
        return userDocuments[_user];
    }

    /**
     * @dev Check if a document exists
     * @param _hash The hash of the document
     * @return exists True if the document exists
     */
    function isDocumentStored(bytes32 _hash) external view returns (bool exists) {
        return documents[_hash].signer != address(0);
    }

    /**
     * @dev Get total number of documents
     * @return count The total number of stored documents
     */
    function getDocumentCount() external view returns (uint256 count) {
        return documentHashes.length;
    }

    /**
     * @dev Get document hash by index
     * @param _index The index of the document
     * @return hash The hash of the document at the given index
     */
    function getDocumentHashByIndex(uint256 _index) 
        external 
        view 
        returns (bytes32 hash) 
    {
        require(_index < documentHashes.length, "Index out of bounds");
        return documentHashes[_index];
    }
}