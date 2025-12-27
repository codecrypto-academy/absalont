// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/CompanyLib.sol";
import "./libraries/ProductLib.sol";
import "./libraries/CartLib.sol";
import "./libraries/InvoiceLib.sol";
import "./libraries/PaymentLib.sol";
import "./libraries/ReviewLib.sol";
import "./libraries/MultiCurrencyLib.sol";
import "./libraries/AnalyticsLib.sol";
import "./LoyaltyNFT.sol";

contract EcommerceV2 {
    using CompanyLib for CompanyLib.CompanyStorage;
    using ProductLib for ProductLib.ProductStorage;
    using CartLib for CartLib.CartStorage;
    using InvoiceLib for InvoiceLib.InvoiceStorage;
    using ReviewLib for ReviewLib.ReviewStorage;
    using MultiCurrencyLib for MultiCurrencyLib.MultiCurrencyStorage;
    using AnalyticsLib for AnalyticsLib.CompanyAnalytics;

    CompanyLib.CompanyStorage private companies;
    ProductLib.ProductStorage private products;
    CartLib.CartStorage private carts;
    InvoiceLib.InvoiceStorage private invoices;
    ReviewLib.ReviewStorage private reviews;
    MultiCurrencyLib.MultiCurrencyStorage private currencies;
    AnalyticsLib.CompanyAnalytics private analytics;

    IERC20 public defaultPaymentToken; // EuroToken
    LoyaltyNFT public loyaltyNFT;
    address public owner;

    // Comisión de plataforma (en porcentaje, 0-100)
    uint256 public platformFeePercentage = 2; // 2%
    uint256 public totalFeesCollected;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _defaultPaymentToken, address _loyaltyNFT) {
        require(_defaultPaymentToken != address(0), "Invalid token address");
        defaultPaymentToken = IERC20(_defaultPaymentToken);
        loyaltyNFT = LoyaltyNFT(_loyaltyNFT);
        owner = msg.sender;
    }

    // ========== COMPANY FUNCTIONS ==========

    function registerCompany(
        string memory name,
        string memory description,
        string memory taxId
    ) external returns (uint256) {
        return companies.registerCompany(name, description, msg.sender, taxId);
    }

    function registerCompanyFor(
        string memory name,
        string memory description,
        string memory taxId,
        address ownerAddress
    ) external onlyOwner returns (uint256) {
        return
            companies.registerCompany(name, description, ownerAddress, taxId);
    }

    function getCompany(
        uint256 companyId
    ) external view returns (CompanyLib.Company memory) {
        return companies.getCompany(companyId);
    }

    function getCompanyByAddress(
        address companyAddress
    ) external view returns (CompanyLib.Company memory) {
        return companies.getCompanyByAddress(companyAddress);
    }

    function updateCompany(
        uint256 companyId,
        string memory name,
        string memory description,
        string memory taxId,
        bool isActive
    ) external {
        require(
            companies.isCompanyOwner(companyId, msg.sender),
            "Not company owner"
        );
        companies.updateCompany(companyId, name, description, taxId, isActive);
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
        require(
            companies.isCompanyOwner(companyId, msg.sender),
            "Not company owner"
        );
        return
            products.addProduct(
                companyId,
                name,
                description,
                price,
                stock,
                ipfsImageHash
            );
    }

    function addProductUnsafe(
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) external returns (uint256) {
        // Permitir que el dueño de la empresa o el owner del contrato agreguen productos
        require(
            companies.isCompanyOwner(companyId, msg.sender) || msg.sender == owner,
            "Not authorized"
        );
        require(companies.companyExists(companyId), "Company not found");
        return
            products.addProduct(
                companyId,
                name,
                description,
                price,
                stock,
                ipfsImageHash
            );
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
        require(
            companies.isCompanyOwner(product.companyId, msg.sender),
            "Not company owner"
        );
        products.updateProduct(
            productId,
            name,
            description,
            price,
            stock,
            isActive
        );
    }

    function updateProductUnsafe(
        uint256 productId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        bool isActive
    ) external {
        ProductLib.Product memory product = products.getProduct(productId);
        // Permitir que el dueño de la empresa o el owner del contrato actualicen productos
        require(
            companies.isCompanyOwner(product.companyId, msg.sender) || msg.sender == owner,
            "Not authorized"
        );
        products.updateProduct(
            productId,
            name,
            description,
            price,
            stock,
            isActive
        );
    }

    function getProduct(
        uint256 productId
    ) external view returns (ProductLib.Product memory) {
        return products.getProduct(productId);
    }

    function getCompanyProducts(
        uint256 companyId
    ) external view returns (uint256[] memory) {
        return products.getCompanyProducts(companyId);
    }

    function getProductCount() external view returns (uint256) {
        return products.productCounter;
    }

    function getAllProducts()
        external
        view
        returns (ProductLib.Product[] memory)
    {
        uint256 count = products.productCounter;
        ProductLib.Product[] memory allProducts = new ProductLib.Product[](
            count
        );

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

    function updateCartQuantity(
        uint256 productId,
        uint256 newQuantity
    ) external {
        carts.updateQuantity(msg.sender, productId, newQuantity);
    }

    function getCart(
        address customer
    ) external view returns (CartLib.CartItem[] memory) {
        return carts.getCart(customer);
    }

    function clearCart() external {
        carts.clearCart(msg.sender);
    }

    function getCartTotal() external view returns (uint256) {
        return carts.calculateTotal(msg.sender);
    }

    // ========== INVOICE FUNCTIONS ==========

    function createInvoiceFromCart(
        uint256 companyId
    ) external returns (uint256) {
        require(companies.companyExists(companyId), "Company not found");

        CartLib.CartItem[] memory cart = carts.getCart(msg.sender);
        require(cart.length > 0, "Cart is empty");

        uint256 total = 0;
        for (uint256 i = 0; i < cart.length; i++) {
            ProductLib.Product memory product = products.getProduct(
                cart[i].productId
            );
            require(
                product.companyId == companyId,
                "Products from different companies"
            );
            require(product.isActive, "Product not active");
            require(product.stock >= cart[i].quantity, "Insufficient stock");

            total += cart[i].price * cart[i].quantity;
        }

        // Aplicar descuento de fidelidad si tiene NFT
        try loyaltyNFT.getDiscount(msg.sender) returns (uint256 discount) {
            if (discount > 0) {
                uint256 discountAmount = (total * discount) / 100;
                total -= discountAmount;
            }
        } catch {}
        uint256 invoiceId = invoices.createInvoice(
            companyId,
            msg.sender,
            total
        );

        for (uint256 i = 0; i < cart.length; i++) {
            ProductLib.Product memory product = products.getProduct(
                cart[i].productId
            );
            invoices.addInvoiceItem(
                invoiceId,
                cart[i].productId,
                product.name,
                cart[i].quantity,
                cart[i].price
            );

            products.decreaseStock(cart[i].productId, cart[i].quantity);

            // Registrar análisis
            analytics.recordSale(
                companyId,
                cart[i].productId,
                cart[i].quantity,
                cart[i].price,
                msg.sender
            );
        }

        carts.clearCart(msg.sender);

        return invoiceId;
    }

    function getInvoice(
        uint256 invoiceId
    )
        external
        view
        returns (
            uint256 id,
            uint256 companyId,
            address customerAddress,
            uint256 totalAmount,
            uint256 timestamp,
            bool isPaid
        )
    {
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

    function getInvoiceItems(
        uint256 invoiceId
    ) external view returns (InvoiceLib.InvoiceItem[] memory) {
        InvoiceLib.Invoice storage invoice = invoices.getInvoice(invoiceId);
        return invoice.items;
    }

    function getCustomerInvoices(
        address customer
    ) external view returns (uint256[] memory) {
        return invoices.getCustomerInvoices(customer);
    }

    function getCompanyInvoices(
        uint256 companyId
    ) external view returns (uint256[] memory) {
        return invoices.getCompanyInvoices(companyId);
    }

    // ========== PAYMENT FUNCTIONS ==========

    function processPayment(
        address customer,
        uint256 amount,
        uint256 invoiceId
    ) external {
        processPaymentWithToken(
            customer,
            amount,
            invoiceId,
            address(defaultPaymentToken)
        );
    }

    function processPaymentWithToken(
        address customer,
        uint256 amount,
        uint256 invoiceId,
        address tokenAddress
    ) public {
        InvoiceLib.Invoice storage invoice = invoices.getInvoice(invoiceId);
        require(!invoice.isPaid, "Invoice already paid");
        require(invoice.customerAddress == customer, "Invalid customer");

        uint256 amountInEUR = amount;

        // Si no es el token por defecto, convertir a EUR
        if (tokenAddress != address(defaultPaymentToken)) {
            require(
                currencies.isTokenSupported(tokenAddress),
                "Token not supported"
            );
            amountInEUR = currencies.convertToEUR(tokenAddress, amount);
        }

        require(invoice.totalAmount == amountInEUR, "Invalid amount");

        CompanyLib.Company memory company = companies.getCompany(
            invoice.companyId
        );
        require(company.isActive, "Company not active");

        // Calcular comisión de plataforma
        uint256 platformFee = (amount * platformFeePercentage) / 100;
        uint256 merchantAmount = amount - platformFee;

        IERC20 token = IERC20(tokenAddress);

        // Transferir comisión a la plataforma
        bool feeSuccess = token.transferFrom(customer, owner, platformFee);
        require(feeSuccess, "Platform fee transfer failed");
        totalFeesCollected += platformFee;

        // Transferir al comerciante
        PaymentLib.processPayment(
            token,
            customer,
            company.companyAddress,
            merchantAmount,
            invoiceId
        );

        bytes32 txHash = keccak256(
            abi.encodePacked(block.timestamp, customer, amount)
        );
        invoices.markAsPaid(invoiceId, txHash);

        // Agregar puntos de fidelidad
        try loyaltyNFT.addPoints(customer, amountInEUR) {} catch {
            // Si no tiene tarjeta de fidelidad, intentar mintear una
            try loyaltyNFT.mintLoyaltyCard(customer) {} catch {}
        }
    }

    // ========== REVIEW FUNCTIONS ==========

    function addReview(
        uint256 productId,
        uint8 rating,
        string memory comment
    ) external returns (uint256) {
        require(products.productExists(productId), "Product not found");
        return reviews.addReview(productId, msg.sender, rating, comment);
    }

    function updateReview(
        uint256 reviewId,
        uint8 rating,
        string memory comment
    ) external {
        ReviewLib.Review memory review = reviews.getReview(reviewId);
        require(review.customerAddress == msg.sender, "Not review owner");
        reviews.updateReview(reviewId, rating, comment);
    }

    function getProductReviews(
        uint256 productId
    ) external view returns (uint256[] memory) {
        return reviews.getProductReviews(productId);
    }

    function getReview(
        uint256 reviewId
    ) external view returns (ReviewLib.Review memory) {
        return reviews.getReview(reviewId);
    }

    function getProductRating(
        uint256 productId
    ) external view returns (uint256 average, uint256 count) {
        return reviews.getAverageRating(productId);
    }

    // ========== MULTI-CURRENCY FUNCTIONS ==========

    function addSupportedToken(
        address tokenAddress,
        string memory symbol,
        uint8 decimals,
        uint256 rateToEUR
    ) external onlyOwner {
        currencies.addToken(tokenAddress, symbol, decimals, rateToEUR);
    }

    function updateTokenRate(
        address tokenAddress,
        uint256 newRate
    ) external onlyOwner {
        currencies.updateTokenRate(tokenAddress, newRate);
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return currencies.getAllTokens();
    }

    function getTokenInfo(
        address tokenAddress
    ) external view returns (MultiCurrencyLib.SupportedToken memory) {
        return currencies.getToken(tokenAddress);
    }

    // ========== ANALYTICS FUNCTIONS ==========

    function getCompanyAnalytics(
        uint256 companyId
    )
        external
        view
        returns (uint256 totalSales, uint256 totalRevenue, uint256 totalOrders)
    {
        return analytics.getCompanySales(companyId);
    }

    function getProductSales(
        uint256 companyId,
        uint256 productId
    ) external view returns (uint256) {
        return analytics.getProductSales(companyId, productId);
    }

    function getDailySales(
        uint256 companyId,
        uint256 dayTimestamp
    ) external view returns (uint256) {
        return analytics.getDailySales(companyId, dayTimestamp);
    }

    // ========== PLATFORM FUNCTIONS ==========

    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 10, "Fee too high"); // Máximo 10%
        platformFeePercentage = newFeePercentage;
    }

    function withdrawPlatformFees(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        bool success = token.transfer(owner, balance);  // ✅ Verificar retorno
        require(success, "Transfer failed");
    }

    function getInvoiceCount() external view returns (uint256) {
        return invoices.invoiceCounter;
    }
}
