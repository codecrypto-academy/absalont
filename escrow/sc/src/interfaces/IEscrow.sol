// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEscrow
 * @dev Interfaz para el contrato Escrow
 */
interface IEscrow {
    
    enum OperationStatus { PENDING, COMPLETED, CANCELLED }
    
    struct Operation {
        address initiator;
        address recipient;
        uint256 amountA;
        uint256 amountB;
        address tokenA;
        address tokenB;
        OperationStatus status;
        uint256 createdAt;
    }
    
    // Eventos
    event TokenAdded(address indexed token);
    event OperationCreated(
        uint256 indexed operationId,
        address indexed initiator,
        address indexed recipient,
        uint256 amountA,
        address tokenA,
        uint256 amountB,
        address tokenB
    );
    event OperationCompleted(
        uint256 indexed operationId,
        address indexed initiator,
        address indexed recipient
    );
    event OperationCancelled(
        uint256 indexed operationId,
        address indexed initiator
    );
    
    // Funciones
    function addToken(address _token) external;
    function removeToken(address _token) external;
    function createOperation(
        uint256 _amountA,
        address _recipient,
        uint256 _amountB,
        address _tokenA,
        address _tokenB
    ) external returns (uint256);
    function completeOperation(
        uint256 _operationId,
        uint256 _amountB
    ) external;
    function cancelOperation(uint256 _operationId) external;
    function getOperation(uint256 _operationId) external view returns (Operation memory);
    function getOperationCount() external view returns (uint256);
    function isTokenAllowed(address _token) external view returns (bool);
    function getAllOperations() external view returns (uint256[] memory);
}
