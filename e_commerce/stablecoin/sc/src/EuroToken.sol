// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EuroToken
 * @dev Stablecoin ERC20 representando euros digitales (1 EURT = 1 EUR)
 */
contract EuroToken is ERC20, Ownable {
    // Eventos para auditoría
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);

    constructor() ERC20("EuroToken", "EURT") Ownable(msg.sender) {}

    /**
     * @dev Retorna 6 decimales para representar centavos de euro
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Crear nuevos tokens (solo owner)
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a crear (con 6 decimales)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, block.timestamp);
    }

    /**
     * @dev Quemar tokens (solo owner)
     * @param from Dirección desde la que se quemarán los tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        emit TokensBurned(from, amount, block.timestamp);
    }

    /**
     * @dev Permite al owner quemar sus propios tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burnOwn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, block.timestamp);
    }
}
