// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library MultiCurrencyLib {
    struct SupportedToken {
        address tokenAddress;
        string symbol;
        uint8 decimals;
        bool isActive;
        uint256 rateToEUR; // Tasa de cambio a EUR (con 6 decimales)
    }

    struct MultiCurrencyStorage {
        mapping(address => SupportedToken) tokens;
        address[] tokenList;
    }

    event TokenAdded(address indexed tokenAddress, string symbol);
    event TokenUpdated(address indexed tokenAddress);
    event RateUpdated(address indexed tokenAddress, uint256 newRate);

    function addToken(
        MultiCurrencyStorage storage self,
        address tokenAddress,
        string memory symbol,
        uint8 decimals,
        uint256 rateToEUR
    ) internal {
        require(tokenAddress != address(0), "Invalid token address");
        require(!self.tokens[tokenAddress].isActive, "Token already added");
        require(rateToEUR > 0, "Rate must be greater than 0");

        self.tokens[tokenAddress] = SupportedToken({
            tokenAddress: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            isActive: true,
            rateToEUR: rateToEUR
        });

        self.tokenList.push(tokenAddress);

        emit TokenAdded(tokenAddress, symbol);
    }

    function updateTokenRate(
        MultiCurrencyStorage storage self,
        address tokenAddress,
        uint256 newRate
    ) internal {
        require(self.tokens[tokenAddress].isActive, "Token not found");
        require(newRate > 0, "Rate must be greater than 0");

        self.tokens[tokenAddress].rateToEUR = newRate;

        emit RateUpdated(tokenAddress, newRate);
    }

    function disableToken(
        MultiCurrencyStorage storage self,
        address tokenAddress
    ) internal {
        require(self.tokens[tokenAddress].isActive, "Token not found");
        self.tokens[tokenAddress].isActive = false;
        emit TokenUpdated(tokenAddress);
    }

    function convertToEUR(
        MultiCurrencyStorage storage self,
        address tokenAddress,
        uint256 amount
    ) internal view returns (uint256) {
        SupportedToken memory token = self.tokens[tokenAddress];
        require(token.isActive, "Token not supported");

        // amount * rateToEUR / 10^6
        return (amount * token.rateToEUR) / 10**6;
    }

    function convertFromEUR(
        MultiCurrencyStorage storage self,
        address tokenAddress,
        uint256 eurAmount
    ) internal view returns (uint256) {
        SupportedToken memory token = self.tokens[tokenAddress];
        require(token.isActive, "Token not supported");

        // eurAmount * 10^6 / rateToEUR
        return (eurAmount * 10**6) / token.rateToEUR;
    }

    function isTokenSupported(
        MultiCurrencyStorage storage self,
        address tokenAddress
    ) internal view returns (bool) {
        return self.tokens[tokenAddress].isActive;
    }

    function getToken(
        MultiCurrencyStorage storage self,
        address tokenAddress
    ) internal view returns (SupportedToken memory) {
        require(self.tokens[tokenAddress].isActive, "Token not supported");
        return self.tokens[tokenAddress];
    }

    function getAllTokens(
        MultiCurrencyStorage storage self
    ) internal view returns (address[] memory) {
        return self.tokenList;
    }
}
