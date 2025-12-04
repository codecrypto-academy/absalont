// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Escrow
 * @dev Sistema de intercambio seguro de tokens ERC20
 * 
 * Funcionalidades:
 * - Crear operaciones de intercambio
 * - Completar operaciones con garantía atómica
 * - Cancelar operaciones y recuperar fondos
 * - Gestionar tokens permitidos
 */
contract Escrow is Ownable, ReentrancyGuard {
    
    // ==================== TIPOS ====================
    
    enum OperationStatus { PENDING, COMPLETED, CANCELLED }
    
    struct Operation {
        address initiator;           // Quien inicia la operación
        address recipient;           // Quien completa la operación
        uint256 amountA;             // Cantidad de Token A
        uint256 amountB;             // Cantidad de Token B
        address tokenA;              // Dirección de Token A
        address tokenB;              // Dirección de Token B
        OperationStatus status;      // Estado de la operación
        uint256 createdAt;           // Timestamp de creación
    }
    
    // ==================== ESTADO ====================
    
    mapping(uint256 => Operation) public operations;
    mapping(address => bool) public allowedTokens;
    uint256 public operationCount;
    
    // ==================== EVENTOS ====================
    
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
    
    // ==================== FUNCIONES ADMIN ====================
    
    /**
     * @dev Añadir token permitido para intercambios
     * @param _token Dirección del token ERC20
     */
    function addToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!allowedTokens[_token], "Token already added");
        
        allowedTokens[_token] = true;
        emit TokenAdded(_token);
    }
    
    /**
     * @dev Remover token permitido
     * @param _token Dirección del token ERC20
     */
    function removeToken(address _token) external onlyOwner {
        require(allowedTokens[_token], "Token not allowed");
        allowedTokens[_token] = false;
    }
    
    // ==================== FUNCIONES PRINCIPALES ====================
    
    /**
     * @dev Crear operación de intercambio
     * 
     * El iniciador debe haber aprobado previamente el contrato
     * para transferir los tokens.
     * 
     * @param _amountA Cantidad de Token A a intercambiar
     * @param _recipient Dirección quien completa la operación
     * @param _amountB Cantidad de Token B solicitada
     * @param _tokenA Dirección del Token A
     * @param _tokenB Dirección del Token B
     * @return operationId ID de la operación creada
     */
    function createOperation(
        uint256 _amountA,
        address _recipient,
        uint256 _amountB,
        address _tokenA,
        address _tokenB
    ) external nonReentrant returns (uint256) {
        require(_amountA > 0, "Amount A must be greater than 0");
        require(_amountB > 0, "Amount B must be greater than 0");
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != msg.sender, "Recipient cannot be initiator");
        require(allowedTokens[_tokenA], "Token A not allowed");
        require(allowedTokens[_tokenB], "Token B not allowed");
        require(_tokenA != _tokenB, "Tokens must be different");
        
        // Transferir tokens del iniciador al contrato
        bool success = IERC20(_tokenA).transferFrom(
            msg.sender,
            address(this),
            _amountA
        );
        require(success, "Token transfer failed");
        
        // Crear operación
        uint256 operationId = operationCount;
        operations[operationId] = Operation({
            initiator: msg.sender,
            recipient: _recipient,
            amountA: _amountA,
            amountB: _amountB,
            tokenA: _tokenA,
            tokenB: _tokenB,
            status: OperationStatus.PENDING,
            createdAt: block.timestamp
        });
        
        operationCount++;
        
        emit OperationCreated(
            operationId,
            msg.sender,
            _recipient,
            _amountA,
            _tokenA,
            _amountB,
            _tokenB
        );
        
        return operationId;
    }
    
    /**
     * @dev Completar operación de intercambio
     * 
     * Solo el destinatario puede completar la operación.
     * Debe haber aprobado previamente los tokens.
     * 
     * @param _operationId ID de la operación
     * @param _amountB Cantidad de Token B a transferir
     */
    function completeOperation(
        uint256 _operationId,
        uint256 _amountB
    ) external nonReentrant {
        Operation storage op = operations[_operationId];
        
        require(op.status == OperationStatus.PENDING, "Operation not pending");
        require(msg.sender == op.recipient, "Only recipient can complete");
        require(_amountB == op.amountB, "Amount must match operation");
        
        // Cambiar estado antes de transferencias (Checks-Effects-Interactions)
        op.status = OperationStatus.COMPLETED;
        
        // Transferir Token B del recipient al initiator
        bool successB = IERC20(op.tokenB).transferFrom(
            msg.sender,
            op.initiator,
            op.amountB
        );
        require(successB, "Token B transfer failed");
        
        // Transferir Token A del contrato al recipient
        bool successA = IERC20(op.tokenA).transfer(
            msg.sender,
            op.amountA
        );
        require(successA, "Token A transfer failed");
        
        emit OperationCompleted(_operationId, op.initiator, msg.sender);
    }
    
    /**
     * @dev Cancelar operación y recuperar tokens
     * 
     * Solo el iniciador puede cancelar antes de que sea completada.
     * 
     * @param _operationId ID de la operación
     */
    function cancelOperation(uint256 _operationId) external nonReentrant {
        Operation storage op = operations[_operationId];
        
        require(op.status == OperationStatus.PENDING, "Operation not pending");
        require(msg.sender == op.initiator, "Only initiator can cancel");
        
        // Cambiar estado
        op.status = OperationStatus.CANCELLED;
        
        // Retornar tokens al initiator
        bool success = IERC20(op.tokenA).transfer(
            msg.sender,
            op.amountA
        );
        require(success, "Token transfer failed");
        
        emit OperationCancelled(_operationId, msg.sender);
    }
    
    // ==================== FUNCIONES LECTURA ====================
    
    /**
     * @dev Obtener detalles de una operación
     * @param _operationId ID de la operación
     * @return operation Estructura con los detalles
     */
    function getOperation(uint256 _operationId) 
        external 
        view 
        returns (Operation memory) 
    {
        return operations[_operationId];
    }
    
    /**
     * @dev Obtener número total de operaciones
     * @return count Total de operaciones creadas
     */
    function getOperationCount() external view returns (uint256) {
        return operationCount;
    }
    
    /**
     * @dev Verificar si un token es permitido
     * @param _token Dirección del token
     * @return isAllowed True si está permitido
     */
    function isTokenAllowed(address _token) external view returns (bool) {
        return allowedTokens[_token];
    }
    
    /**
     * @dev Obtener lista de operaciones activas
     * @return Array de IDs de operaciones activas
     */
    function getAllOperations() external view returns (uint256[] memory) {
        uint256[] memory activeOps = new uint256[](operationCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < operationCount; i++) {
            if (operations[i].status == OperationStatus.PENDING) {
                activeOps[count] = i;
                count++;
            }
        }
        
        // Crear array del tamaño correcto
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeOps[i];
        }
        
        return result;
    }
}
