// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IDocumentRegistry - Interface del registro de documentos
/// @notice Define las funciones principales del contrato DocumentRegistry
interface IDocumentRegistry {
    /// @notice Almacena el hash de un documento con timestamp y firma
    /// @param hash Hash SHA-256 del documento
    /// @param timestamp Timestamp del momento de firma
    /// @param signature Firma digital del documento
    function storeDocumentHash(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) external;

    /// @notice Verifica la autenticidad de un documento
    /// @param hash Hash del documento a verificar
    /// @param signer Dirección del supuesto firmante
    /// @param signature Firma a verificar
    /// @return isValid true si el documento es válido
    function verifyDocument(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external returns (bool isValid);

    /// @notice Obtiene información de un documento almacenado
    /// @param hash Hash del documento
    /// @return timestamp Momento de registro
    /// @return signer Dirección del firmante
    /// @return signature Firma del documento
    /// @return exists Si el documento existe
    function getDocumentInfo(bytes32 hash)
        external
        view
        returns (
            uint256 timestamp,
            address signer,
            bytes memory signature,
            bool exists
        );
}
