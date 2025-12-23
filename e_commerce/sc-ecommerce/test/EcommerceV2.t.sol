// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EcommerceV2.sol";
import "../src/LoyaltyNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 Token para testing
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract EcommerceV2Test is Test {
    EcommerceV2 public ecommerce;
    LoyaltyNFT public loyaltyNFT;
    MockERC20 public euroToken;
    MockERC20 public usdToken;

    address public owner;
    address public company1Owner;
    address public company2Owner;
    address public customer1;
    address public customer2;

    uint256 public company1Id;
    uint256 public company2Id;
    uint256 public product1Id;
    uint256 public product2Id;

    function setUp() public {
        // Setup addresses
        owner = address(this);
        company1Owner = makeAddr("company1");
        company2Owner = makeAddr("company2");
        customer1 = makeAddr("customer1");
        customer2 = makeAddr("customer2");

        // Deploy tokens
        euroToken = new MockERC20("Euro Token", "EUR");
        usdToken = new MockERC20("USD Token", "USD");

        // Deploy LoyaltyNFT
        loyaltyNFT = new LoyaltyNFT();

        // Deploy EcommerceV2
        ecommerce = new EcommerceV2(address(euroToken), address(loyaltyNFT));

        // Transfer ownership of loyaltyNFT to ecommerce contract
        loyaltyNFT.transferOwnership(address(ecommerce));

        // Mint tokens to customers
        euroToken.mint(customer1, 10000 * 10**18);
        euroToken.mint(customer2, 10000 * 10**18);
        usdToken.mint(customer1, 10000 * 10**18);

        // Setup companies
        vm.prank(company1Owner);
        company1Id = ecommerce.registerCompany(
            "Company One",
            "First test company",
            "TAX001"
        );

        vm.prank(company2Owner);
        company2Id = ecommerce.registerCompany(
            "Company Two",
            "Second test company",
            "TAX002"
        );

        // Add products
        vm.prank(company1Owner);
        product1Id = ecommerce.addProduct(
            company1Id,
            "Product 1",
            "Description 1",
            100 * 10**18,
            50,
            "QmHash1"
        );

        vm.prank(company1Owner);
        product2Id = ecommerce.addProduct(
            company1Id,
            "Product 2",
            "Description 2",
            200 * 10**18,
            30,
            "QmHash2"
        );
    }

    // ========== COMPANY TESTS ==========

    function testRegisterCompany() public {
        address newOwner = makeAddr("newCompany");
        vm.prank(newOwner);
        uint256 companyId = ecommerce.registerCompany(
            "New Company",
            "Test description",
            "TAX003"
        );

        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "New Company");
        assertEq(company.companyAddress, newOwner);
        assertEq(company.taxId, "TAX003");
        assertTrue(company.isActive);
    }

    function testGetCompanyByAddress() public view {
        CompanyLib.Company memory company = ecommerce.getCompanyByAddress(
            company1Owner
        );
        assertEq(company.companyId, company1Id);
        assertEq(company.name, "Company One");
    }

    function testUpdateCompany() public {
        vm.prank(company1Owner);
        ecommerce.updateCompany(
            company1Id,
            "Updated Company",
            "Updated description",
            "TAX001-UPDATED",
            true
        );

        CompanyLib.Company memory company = ecommerce.getCompany(company1Id);
        assertEq(company.name, "Updated Company");
        assertEq(company.description, "Updated description");
        assertEq(company.taxId, "TAX001-UPDATED");
    }

    function testUpdateCompanyFailsIfNotOwner() public {
        vm.prank(customer1);
        vm.expectRevert("Not company owner");
        ecommerce.updateCompany(
            company1Id,
            "Updated Company",
            "Updated description",
            "TAX001-UPDATED",
            true
        );
    }

    function testRegisterCompanyFor() public {
        address newOwner = makeAddr("companyForTest");
        uint256 companyId = ecommerce.registerCompanyFor(
            "Company For Test",
            "Description",
            "TAX004",
            newOwner
        );

        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.companyAddress, newOwner);
    }

    // ========== PRODUCT TESTS ==========

    function testAddProduct() public {
        vm.prank(company1Owner);
        uint256 productId = ecommerce.addProduct(
            company1Id,
            "New Product",
            "New Description",
            150 * 10**18,
            100,
            "QmHashNew"
        );

        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "New Product");
        assertEq(product.price, 150 * 10**18);
        assertEq(product.stock, 100);
        assertTrue(product.isActive);
    }

    function testAddProductFailsIfNotOwner() public {
        vm.prank(customer1);
        vm.expectRevert("Not company owner");
        ecommerce.addProduct(
            company1Id,
            "Unauthorized Product",
            "Description",
            100 * 10**18,
            50,
            "QmHash"
        );
    }

    function testUpdateProduct() public {
        vm.prank(company1Owner);
        ecommerce.updateProduct(
            product1Id,
            "Updated Product",
            "Updated Description",
            120 * 10**18,
            60,
            true
        );

        ProductLib.Product memory product = ecommerce.getProduct(product1Id);
        assertEq(product.name, "Updated Product");
        assertEq(product.price, 120 * 10**18);
        assertEq(product.stock, 60);
    }

    function testGetCompanyProducts() public view {
        uint256[] memory productIds = ecommerce.getCompanyProducts(company1Id);
        assertEq(productIds.length, 2);
        assertEq(productIds[0], product1Id);
        assertEq(productIds[1], product2Id);
    }

    function testGetAllProducts() public view {
        ProductLib.Product[] memory products = ecommerce.getAllProducts();
        assertEq(products.length, 2);
        assertEq(products[0].name, "Product 1");
        assertEq(products[1].name, "Product 2");
    }

    // ========== CART TESTS ==========

    function testAddToCart() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, product1Id);
        assertEq(cart[0].quantity, 2);
    }

    function testAddToCartFailsIfInsufficientStock() public {
        vm.prank(customer1);
        vm.expectRevert("Insufficient stock");
        ecommerce.addToCart(product1Id, 100);
    }

    function testUpdateCartQuantity() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);

        vm.prank(customer1);
        ecommerce.updateCartQuantity(product1Id, 5);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart[0].quantity, 5);
    }

    function testRemoveFromCart() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);

        vm.prank(customer1);
        ecommerce.removeFromCart(product1Id);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    function testClearCart() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);
        vm.prank(customer1);
        ecommerce.addToCart(product2Id, 3);

        vm.prank(customer1);
        ecommerce.clearCart();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    function testGetCartTotal() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2); // 2 * 100
        vm.prank(customer1);
        ecommerce.addToCart(product2Id, 1); // 1 * 200

        vm.prank(customer1);
        uint256 total = ecommerce.getCartTotal();
        assertEq(total, 400 * 10**18);
    }

    // ========== INVOICE TESTS ==========

    function testCreateInvoiceFromCart() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);

        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        (
            uint256 id,
            uint256 companyId,
            address customerAddress,
            uint256 totalAmount,
            ,
            bool isPaid
        ) = ecommerce.getInvoice(invoiceId);

        assertEq(id, invoiceId);
        assertEq(companyId, company1Id);
        assertEq(customerAddress, customer1);
        assertEq(totalAmount, 200 * 10**18);
        assertFalse(isPaid);

        // Check stock decreased
        ProductLib.Product memory product = ecommerce.getProduct(product1Id);
        assertEq(product.stock, 48);
    }

    function testCreateInvoiceFailsWithEmptyCart() public {
        vm.prank(customer1);
        vm.expectRevert("Cart is empty");
        ecommerce.createInvoiceFromCart(company1Id);
    }

    function testGetInvoiceItems() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);
        vm.prank(customer1);
        ecommerce.addToCart(product2Id, 1);

        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        InvoiceLib.InvoiceItem[] memory items = ecommerce.getInvoiceItems(
            invoiceId
        );
        assertEq(items.length, 2);
        assertEq(items[0].quantity, 2);
        assertEq(items[1].quantity, 1);
    }

    function testGetCustomerInvoices() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 1);
        vm.prank(customer1);
        uint256 invoice1 = ecommerce.createInvoiceFromCart(company1Id);

        vm.prank(customer1);
        ecommerce.addToCart(product2Id, 1);
        vm.prank(customer1);
        uint256 invoice2 = ecommerce.createInvoiceFromCart(company1Id);

        uint256[] memory invoices = ecommerce.getCustomerInvoices(customer1);
        assertEq(invoices.length, 2);
        assertEq(invoices[0], invoice1);
        assertEq(invoices[1], invoice2);
    }

    function testGetCompanyInvoices() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 1);
        vm.prank(customer1);
        ecommerce.createInvoiceFromCart(company1Id);

        uint256[] memory invoices = ecommerce.getCompanyInvoices(company1Id);
        assertEq(invoices.length, 1);
    }

    // ========== PAYMENT TESTS ==========

    function testProcessPayment() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);
        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        uint256 amount = 200 * 10**18;
        uint256 platformFee = (amount * 2) / 100;
        uint256 merchantAmount = amount - platformFee;

        // Approve tokens
        vm.prank(customer1);
        euroToken.approve(address(ecommerce), amount);

        uint256 ownerBalanceBefore = euroToken.balanceOf(owner);
        uint256 merchantBalanceBefore = euroToken.balanceOf(company1Owner);

        // Process payment
        vm.prank(customer1);
        ecommerce.processPayment(customer1, amount, invoiceId);

        // Check invoice is paid
        (, , , , , bool isPaid) = ecommerce.getInvoice(invoiceId);
        assertTrue(isPaid);

        // Check balances
        assertEq(
            euroToken.balanceOf(owner),
            ownerBalanceBefore + platformFee
        );
        assertEq(
            euroToken.balanceOf(company1Owner),
            merchantBalanceBefore + merchantAmount
        );
    }

    function testProcessPaymentFailsIfAlreadyPaid() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 1);
        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        uint256 amount = 100 * 10**18;
        vm.prank(customer1);
        euroToken.approve(address(ecommerce), amount);

        vm.prank(customer1);
        ecommerce.processPayment(customer1, amount, invoiceId);

        // Try to pay again
        vm.prank(customer1);
        euroToken.approve(address(ecommerce), amount);
        vm.prank(customer1);
        vm.expectRevert("Invoice already paid");
        ecommerce.processPayment(customer1, amount, invoiceId);
    }

    function testProcessPaymentWithMultiCurrency() public {
        // Test simplificado: usar un rate de 1:1 para facilitar
        // 1 USD = 1 EUR, entonces rateToEUR = 1 * 10**6 = 1000000
        ecommerce.addSupportedToken(
            address(usdToken),
            "USD",
            18,
            1000000 // 1.0 EUR per USD (con 6 decimales)
        );

        // Agregar producto al carrito
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 1); // 100 EUR = 100 * 10**18
        
        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        // Obtener el monto de la factura en EUR
        (, , , uint256 invoiceAmountEUR, , ) = ecommerce.getInvoice(invoiceId);
        
        // Con rate 1:1, necesitamos exactamente la misma cantidad en USD
        // convertToEUR: (amount * 1000000) / 10**6 = amount
        // Por lo tanto, usdAmount = invoiceAmountEUR
        uint256 usdAmount = invoiceAmountEUR;
        
        vm.prank(customer1);
        usdToken.approve(address(ecommerce), usdAmount);

        vm.prank(customer1);
        ecommerce.processPaymentWithToken(
            customer1,
            usdAmount,
            invoiceId,
            address(usdToken)
        );

        (, , , , , bool isPaid) = ecommerce.getInvoice(invoiceId);
        assertTrue(isPaid);
    }

    // ========== REVIEW TESTS ==========

    function testAddReview() public {
        vm.prank(customer1);
        uint256 reviewId = ecommerce.addReview(
            product1Id,
            5,
            "Great product!"
        );

        ReviewLib.Review memory review = ecommerce.getReview(reviewId);
        assertEq(review.productId, product1Id);
        assertEq(review.rating, 5);
        assertEq(review.comment, "Great product!");
        assertEq(review.customerAddress, customer1);
    }

    function testUpdateReview() public {
        vm.prank(customer1);
        uint256 reviewId = ecommerce.addReview(product1Id, 4, "Good");

        vm.prank(customer1);
        ecommerce.updateReview(reviewId, 5, "Excellent!");

        ReviewLib.Review memory review = ecommerce.getReview(reviewId);
        assertEq(review.rating, 5);
        assertEq(review.comment, "Excellent!");
    }

    function testGetProductReviews() public {
        vm.prank(customer1);
        ecommerce.addReview(product1Id, 5, "Great!");
        vm.prank(customer2);
        ecommerce.addReview(product1Id, 4, "Good");

        uint256[] memory reviewIds = ecommerce.getProductReviews(product1Id);
        assertEq(reviewIds.length, 2);
    }

    function testGetProductRating() public {
        vm.prank(customer1);
        ecommerce.addReview(product1Id, 5, "Great!");
        vm.prank(customer2);
        ecommerce.addReview(product1Id, 3, "OK");

        (uint256 average, uint256 count) = ecommerce.getProductRating(
            product1Id
        );
        assertEq(count, 2);
        // La función retorna el promedio * 100 para mantener 2 decimales
        // (5 + 3) / 2 = 4.0, 4.0 * 100 = 400
        assertEq(average, 400); // (5 + 3) / 2 * 100 = 400
    }

    // ========== MULTI-CURRENCY TESTS ==========

    function testAddSupportedToken() public {
        MockERC20 newToken = new MockERC20("New Token", "NEW");

        ecommerce.addSupportedToken(
            address(newToken),
            "NEW",
            18,
            1 * 10**6
        );

        address[] memory tokens = ecommerce.getSupportedTokens();
        assertEq(tokens[tokens.length - 1], address(newToken));
    }

    function testUpdateTokenRate() public {
        ecommerce.addSupportedToken(
            address(usdToken),
            "USD",
            18,
            900000
        );

        ecommerce.updateTokenRate(address(usdToken), 950000);

        MultiCurrencyLib.SupportedToken memory token = ecommerce.getTokenInfo(
            address(usdToken)
        );
        assertEq(token.rateToEUR, 950000);
    }

    // ========== ANALYTICS TESTS ==========

    function testAnalyticsRecordSale() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);
        vm.prank(customer1);
        ecommerce.createInvoiceFromCart(company1Id);

        (
            uint256 totalSales,
            uint256 totalRevenue,
            uint256 totalOrders
        ) = ecommerce.getCompanyAnalytics(company1Id);

        assertEq(totalSales, 2);
        assertEq(totalRevenue, 200 * 10**18);
        assertEq(totalOrders, 1);
    }

    function testGetProductSales() public {
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 3);
        vm.prank(customer1);
        ecommerce.createInvoiceFromCart(company1Id);

        uint256 sales = ecommerce.getProductSales(company1Id, product1Id);
        assertEq(sales, 3);
    }

    // ========== PLATFORM TESTS ==========

    function testSetPlatformFee() public {
        ecommerce.setPlatformFee(5);
        assertEq(ecommerce.platformFeePercentage(), 5);
    }

    function testSetPlatformFeeFailsIfTooHigh() public {
        vm.expectRevert("Fee too high");
        ecommerce.setPlatformFee(11);
    }

    function testWithdrawPlatformFees() public {
        // Make a purchase to generate fees
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 1);
        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        uint256 amount = 100 * 10**18;
        vm.prank(customer1);
        euroToken.approve(address(ecommerce), amount);
        vm.prank(customer1);
        ecommerce.processPayment(customer1, amount, invoiceId);

        // The platform fee (2%) goes directly to owner, not to contract
        // So contract balance should be 0
        // Let's send some tokens to the contract manually for testing withdrawal
        euroToken.transfer(address(ecommerce), 10 * 10**18);

        uint256 contractBalance = euroToken.balanceOf(address(ecommerce));
        uint256 ownerBalanceBefore = euroToken.balanceOf(owner);

        ecommerce.withdrawPlatformFees(address(euroToken));

        assertEq(
            euroToken.balanceOf(owner),
            ownerBalanceBefore + contractBalance
        );
        assertEq(euroToken.balanceOf(address(ecommerce)), 0);
    }

    // ========== INTEGRATION TESTS ==========

    function testCompleteEcommerceCycle() public {
        // 1. Customer adds products to cart
        vm.prank(customer1);
        ecommerce.addToCart(product1Id, 2);
        vm.prank(customer1);
        ecommerce.addToCart(product2Id, 1);

        // 2. Create invoice
        vm.prank(customer1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(company1Id);

        // 3. Process payment
        uint256 amount = 400 * 10**18; // (2*100 + 1*200)
        vm.prank(customer1);
        euroToken.approve(address(ecommerce), amount);
        vm.prank(customer1);
        ecommerce.processPayment(customer1, amount, invoiceId);

        // 4. Add review
        vm.prank(customer1);
        ecommerce.addReview(product1Id, 5, "Excellent purchase!");

        // 5. Verify everything
        (, , , , , bool isPaid) = ecommerce.getInvoice(invoiceId);
        assertTrue(isPaid);

        ProductLib.Product memory p1 = ecommerce.getProduct(product1Id);
        assertEq(p1.stock, 48);

        (uint256 totalSales, uint256 totalRevenue, ) = ecommerce
            .getCompanyAnalytics(company1Id);
        assertEq(totalSales, 3);
        assertEq(totalRevenue, 400 * 10**18);
    }
}