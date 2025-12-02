// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library PaymentLib {
    event PaymentProcessed(
        address indexed customer,
        uint256 indexed invoiceId,
        uint256 amount,
        address indexed merchant
    );

    function processPayment(
        IERC20 token,
        address customer,
        address merchant,
        uint256 amount,
        uint256 invoiceId
    ) internal {
        require(customer != address(0), "Invalid customer address");
        require(merchant != address(0), "Invalid merchant address");
        require(amount > 0, "Amount must be greater than 0");

        // Transferir tokens del cliente al comerciante
        bool success = token.transferFrom(customer, merchant, amount);
        require(success, "Payment transfer failed");

        emit PaymentProcessed(customer, invoiceId, amount, merchant);
    }

    function verifyBalance(
        IERC20 token,
        address account,
        uint256 requiredAmount
    ) internal view returns (bool) {
        return token.balanceOf(account) >= requiredAmount;
    }

    function verifyAllowance(
        IERC20 token,
        address owner,
        address spender,
        uint256 requiredAmount
    ) internal view returns (bool) {
        return token.allowance(owner, spender) >= requiredAmount;
    }
}
