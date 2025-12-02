// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/CompanyLib.sol";
import "./libraries/ProductLib.sol";
import "./libraries/CartLib.sol";
import "./libraries/InvoiceLib.sol";
import "./libraries/PaymentLib.sol";

contract Ecommerce {
    using CompanyLib for CompanyLib.CompanyStorage;
    using ProductLib for ProductLib.ProductStorage;
    using CartLib for CartLib.CartStorage;
    using InvoiceLib for InvoiceLib.InvoiceStorage;

    CompanyLib.CompanyStorage private companies;
    ProductLib.ProductStorage private products;
    CartLib.CartStorage private carts;
    InvoiceLib.InvoiceStorage private invoices;

    IERC20 public paymentToken;

    constructor(address _paymentToken) {
        require(_paymentToken != address(0), "Invalid token address");
        paymentToken = IERC20(_paymentToken);
    }

    // ========== COMPANY FUNCTIONS ==========

    function registerCompany(
        string memory name,
        string memory taxId
    ) external returns (uint256) {
        return companies.registerCompany(name, msg.sender, taxId);
    }

    function getCompany(uint256 companyId) external view returns (CompanyLib.Company memory) {
        return companies.getCompany(companyId);
    }

    function getCompanyByAddress(address companyAddress) external view returns (CompanyLib.Company memory) {
        return companies.getCompanyByAddress(companyAddress);
    }

    function updateCompany(
        uint256 companyId,
        string memory name,
        string memory taxId,
        bool isActive
    ) external {
        require(companies.isCompanyOwner(companyId, msg.sender), "Not company owner");
        companies.updateCompany(companyId, name, taxId, isActive);
    }

    function getCompanyCount() external view returns (uint256) {
        return companies.companyCounter;
    }

    // ========== PRODUCT FUNCTIONS ==========

    function addProduct(
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) external returns (uint256) {
        require(companies.isCompanyOwner(companyId, msg.sender), "Not company owner");
        return products.addProduct(companyId, name, description, price, stock, ipfsImageHash);
    }

    function updateProduct(
        uint256 productId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        bool isActive
    ) external {
        ProductLib.Product memory product = products.getProduct(productId);
        require(companies.isCompanyOwner(product.companyId, msg.sender), "Not company owner");
        products.updateProduct(productId, name, description, price, stock, isActive);
    }

    function getProduct(uint256 productId) external view returns (ProductLib.Product memory) {
        return products.getProduct(productId);
    }

    function getCompanyProducts(uint256 companyId) external view returns (uint256[] memory) {
        return products.getCompanyProducts(companyId);
    }

    function getProductCount() external view returns (uint256) {
        return products.productCounter;
    }

    function getAllProducts() external view returns (ProductLib.Product[] memory) {
        uint256 count = products.productCounter;
        ProductLib.Product[] memory allProducts = new ProductLib.Product[](count);
        
        for (uint256 i = 1; i <= count; i++) {
            allProducts[i - 1] = products.getProduct(i);
        }
        
        return allProducts;
    }

    // ========== CART FUNCTIONS ==========

    function addToCart(uint256 productId, uint256 quantity) external {
        ProductLib.Product memory product = products.getProduct(productId);
        require(product.isActive, "Product not active");
        require(product.stock >= quantity, "Insufficient stock");
        
        carts.addToCart(msg.sender, productId, quantity, product.price);
    }

    function removeFromCart(uint256 productId) external {
        carts.removeFromCart(msg.sender, productId);
    }

    function updateCartQuantity(uint256 productId, uint256 newQuantity) external {
        carts.updateQuantity(msg.sender, productId, newQuantity);
    }

    function getCart(address customer) external view returns (CartLib.CartItem[] memory) {
        return carts.getCart(customer);
    }

    function clearCart() external {
        carts.clearCart(msg.sender);
    }

    function getCartTotal() external view returns (uint256) {
        return carts.calculateTotal(msg.sender);
    }

    // ========== INVOICE FUNCTIONS ==========

    function createInvoiceFromCart(uint256 companyId) external returns (uint256) {
        require(companies.companyExists(companyId), "Company not found");
        
        CartLib.CartItem[] memory cart = carts.getCart(msg.sender);
        require(cart.length > 0, "Cart is empty");

        // Calcular total y verificar que todos los productos son de la misma empresa
        uint256 total = 0;
        for (uint256 i = 0; i < cart.length; i++) {
            ProductLib.Product memory product = products.getProduct(cart[i].productId);
            require(product.companyId == companyId, "Products from different companies");
            require(product.isActive, "Product not active");
            require(product.stock >= cart[i].quantity, "Insufficient stock");
            
            total += cart[i].price * cart[i].quantity;
        }

        // Crear invoice
        uint256 invoiceId = invoices.createInvoice(companyId, msg.sender, total);

        // Agregar items a la invoice
        for (uint256 i = 0; i < cart.length; i++) {
            ProductLib.Product memory product = products.getProduct(cart[i].productId);
            invoices.addInvoiceItem(
                invoiceId,
                cart[i].productId,
                product.name,
                cart[i].quantity,
                cart[i].price
            );

            // Reducir stock
            products.decreaseStock(cart[i].productId, cart[i].quantity);
        }

        // Limpiar carrito
        carts.clearCart(msg.sender);

        return invoiceId;
    }

    function getInvoice(uint256 invoiceId) external view returns (
        uint256 id,
        uint256 companyId,
        address customerAddress,
        uint256 totalAmount,
        uint256 timestamp,
        bool isPaid
    ) {
        InvoiceLib.Invoice storage invoice = invoices.getInvoice(invoiceId);
        return (
            invoice.invoiceId,
            invoice.companyId,
            invoice.customerAddress,
            invoice.totalAmount,
            invoice.timestamp,
            invoice.isPaid
        );
    }

    function getInvoiceItems(uint256 invoiceId) external view returns (InvoiceLib.InvoiceItem[] memory) {
        InvoiceLib.Invoice storage invoice = invoices.getInvoice(invoiceId);
        return invoice.items;
    }

    function getCustomerInvoices(address customer) external view returns (uint256[] memory) {
        return invoices.getCustomerInvoices(customer);
    }

    function getCompanyInvoices(uint256 companyId) external view returns (uint256[] memory) {
        return invoices.getCompanyInvoices(companyId);
    }

    // ========== PAYMENT FUNCTIONS ==========

    function processPayment(
        address customer,
        uint256 amount,
        uint256 invoiceId
    ) external {
        InvoiceLib.Invoice storage invoice = invoices.getInvoice(invoiceId);
        require(!invoice.isPaid, "Invoice already paid");
        require(invoice.customerAddress == customer, "Invalid customer");
        require(invoice.totalAmount == amount, "Invalid amount");

        CompanyLib.Company memory company = companies.getCompany(invoice.companyId);
        require(company.isActive, "Company not active");

        // Procesar pago
        PaymentLib.processPayment(
            paymentToken,
            customer,
            company.companyAddress,
            amount,
            invoiceId
        );

        // Marcar invoice como pagada
        bytes32 txHash = keccak256(abi.encodePacked(block.timestamp, customer, amount));
        invoices.markAsPaid(invoiceId, txHash);
    }

    function getInvoiceCount() external view returns (uint256) {
        return invoices.invoiceCounter;
    }
}
