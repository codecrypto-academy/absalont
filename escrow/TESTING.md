# 🧪 Testing - Escrow DApp

## Ejecutar Tests

### Tests Básicos

```bash
cd escrow/sc

# Ejecutar todos los tests
forge test

# Verbose (muestra más detalles)
forge test -v

# Verbose con logs
forge test -vv

# Solo un test específico
forge test --match-test testCreateOperation

# Tests con gas report
forge test --gas-report
```

### Filtrar Tests

```bash
# Tests que coinciden con un patrón
forge test --match-contract Escrow

# Tests específicos
forge test --match-test testCreateOperation

# Excluir tests
forge test --match-test "not Admin"
```

## Estructura de Tests

### Archivos

```
test/
└── Escrow.t.sol       # Tests principales
```

### Plantilla

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/MockERC20.sol";

contract EscrowTest is Test {
    Escrow escrow;
    MockERC20 tokenA;
    MockERC20 tokenB;
    
    address user1;
    address user2;
    
    function setUp() public {
        // Setup antes de cada test
        user1 = address(0x1);
        user2 = address(0x2);
        
        escrow = new Escrow();
        tokenA = new MockERC20("Token A", "TKNA");
        tokenB = new MockERC20("Token B", "TKNB");
        
        // Mint tokens
        tokenA.mint(user1, 1000e18);
        tokenB.mint(user2, 1000e18);
    }
    
    function testCreateOperation() public {
        // Arrange
        vm.prank(user1);
        tokenA.approve(address(escrow), 100e18);
        
        // Act
        vm.prank(user1);
        uint256 operationId = escrow.createOperation(
            100e18,
            user2,
            100e18,
            address(tokenA),
            address(tokenB)
        );
        
        // Assert
        assertEq(operationId, 0);
        // Más aserciones...
    }
}
```

## Tests Recomendados

### 1. Crear Operación

```solidity
function testCreateOperation() public
function testCreateOperationWithInvalidRecipient() public
function testCreateOperationWithZeroAmount() public
function testCreateOperationWithUnapprovedToken() public
function testCreateOperationTransfersTokens() public
```

### 2. Completar Operación

```solidity
function testCompleteOperation() public
function testCompleteOperationWithInsufficientBalance() public
function testCompleteOperationNotRecipient() public
function testCompleteOperationTransfersTokensCorrectly() public
function testCompleteOperationEmitsEvent() public
```

### 3. Cancelar Operación

```solidity
function testCancelOperation() public
function testCancelOperationNotInitiator() public
function testCancelOperationAlreadyCompleted() public
function testCancelOperationReturnsTokens() public
```

### 4. Eventos

```solidity
function testOperationCreatedEvent() public
function testOperationCompletedEvent() public
function testOperationCancelledEvent() public
```

## Técnicas de Testing

### Usar vm.prank()

Ejecutar como otra dirección:

```solidity
vm.prank(user2);
escrow.completeOperation(operationId, 100e18);
```

### Usar expectRevert()

Verificar que revierte:

```solidity
vm.expectRevert("Insufficient balance");
vm.prank(user2);
escrow.completeOperation(operationId, 1000000e18);
```

### Usar expectEmit()

Verificar eventos:

```solidity
vm.expectEmit(true, false, false, true);
emit OperationCompleted(operationId, user1, user2);

vm.prank(user2);
escrow.completeOperation(operationId, 100e18);
```

### Usar block.timestamp

Manipular tiempo:

```solidity
vm.warp(block.timestamp + 7 days);
// Ahora el tiempo avanzó 7 días
```

## Ejemplos Prácticos

### Test Completo: Flujo Exitoso

```solidity
function testFullEscrowFlow() public {
    // 1. User1 crea operación
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    
    vm.prank(user1);
    uint256 operationId = escrow.createOperation(
        100e18,
        user2,
        100e18,
        address(tokenA),
        address(tokenB)
    );
    
    // 2. User2 completa operación
    vm.prank(user2);
    tokenB.approve(address(escrow), 100e18);
    
    vm.prank(user2);
    escrow.completeOperation(operationId, 100e18);
    
    // 3. Verificar balances finales
    assertEq(tokenA.balanceOf(user2), 100e18);
    assertEq(tokenB.balanceOf(user1), 100e18);
}
```

### Test: Verificar Evento

```solidity
function testOperationCreatedEventEmitted() public {
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    
    vm.expectEmit(true, true, false, true);
    emit OperationCreated(
        0,                      // operationId
        user1,                  // initiator
        user2                   // recipient
    );
    
    vm.prank(user1);
    escrow.createOperation(
        100e18,
        user2,
        100e18,
        address(tokenA),
        address(tokenB)
    );
}
```

### Test: Verificar Revert

```solidity
function testCompleteOperationFailsIfNotRecipient() public {
    // Setup
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    
    vm.prank(user1);
    uint256 operationId = escrow.createOperation(
        100e18,
        user2,
        100e18,
        address(tokenA),
        address(tokenB)
    );
    
    // Intentar completar como user3 (no recipient)
    address user3 = address(0x3);
    
    vm.expectRevert("Only recipient can complete");
    vm.prank(user3);
    escrow.completeOperation(operationId, 100e18);
}
```

## Coverage de Tests

Ver qué líneas están siendo testeadas:

```bash
# Generar reporte
forge coverage

# Con HTML
forge coverage --report lcov
# Abre coverage/index.html en navegador
```

## Debugging

### Usar console.log()

```solidity
import "forge-std/console.sol";

function testDebug() public {
    console.log("User1:", user1);
    console.log("Balance:", tokenA.balanceOf(user1));
}
```

Ejecutar con `-vv` para ver los logs:

```bash
forge test --match-test testDebug -vv
```

### Usar vm.breakpoint()

Pausar ejecución (requiere `-vvv` o debugger):

```solidity
vm.breakpoint("paused_here");
```

## Best Practices

1. ✅ Usar `setUp()` para inicialización común
2. ✅ Nombres descriptivos: `testCreateOperationWithValidParams`
3. ✅ Una aserción principal por test (pero OK múltiples verificaciones)
4. ✅ Usar Arrange-Act-Assert pattern
5. ✅ Probar casos negativos (revert)
6. ✅ Probar eventos
7. ✅ Usar fuzzing para inputs aleatorios
8. ✅ Gas optimization awareness

## Fuzzing

Generar inputs aleatorios automáticamente:

```solidity
function testCreateOperationFuzz(
    uint256 amountA,
    uint256 amountB
) public {
    // Limitar valores razonables
    amountA = bound(amountA, 1, 1000e18);
    amountB = bound(amountB, 1, 1000e18);
    
    // Test con valores aleatorios
    vm.prank(user1);
    tokenA.approve(address(escrow), amountA);
    
    vm.prank(user1);
    escrow.createOperation(
        amountA,
        user2,
        amountB,
        address(tokenA),
        address(tokenB)
    );
    
    // Assertions...
}
```

Ejecutar:
```bash
forge test --match-test Fuzz
```

## Recursos

- [Foundry Testing Docs](https://book.getfoundry.sh/forge/tests)
- [Foundry Cheatcodes](https://book.getfoundry.sh/cheatcodes/)
- [Testing Best Practices](https://ethereum.org/en/developers/docs/smart-contracts/testing/)