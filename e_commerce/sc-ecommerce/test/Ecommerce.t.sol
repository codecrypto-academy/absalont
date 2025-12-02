// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../../stablecoin/sc/src/EuroToken.sol";

contract EcommerceTest is Test {
    Ecommerce public ecommerce;
    EuroToken public token;
    
    address public owner;
    address public company1;
    address public company2;
    address public customer1;
    address public customer2;

    function setUp() public {
        owner = address(this);
        company1 = address(0x1);
        company2 = address(0x2);
        customer1 = address(0x3);
        customer2 = address(0x4);

        // Deploy EuroToken
        token = new EuroToken();
        
        // Deploy Ecommerce
        ecommerce = new Ecommerce(address(token));

        // Mint tokens to customers
        token.mint(customer1, 10000 * 10**6); // 10,000 EURT
        token.mint(customer2, 10000 * 10**6);
    }

    // ========== COMPANY TESTS ==========

    function testRegisterCompany() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        assertEq(companyId, 1);
        
        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "Company 1");
        assertEq(company.companyAddress, company1);
        assertEq(company.taxId, "TAX123");
        assertTrue(company.isActive);
    }

    function testCannotRegisterCompanyTwice() public {
        vm.startPrank(company1);
        ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.expectRevert("Company already registered");
        ecommerce.registerCompany("Company 1 Again", "TAX456");
        vm.stopPrank();
    }

    // ========== PRODUCT TESTS ==========

    function testAddProduct() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Description",
            10 * 10**6, // 10 EUR
            100,
            "ipfs_hash"
        );

        assertEq(productId, 1);
        
        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "Product 1");
        assertEq(product.price, 10 * 10**6);
        assertEq(product.stock, 100);
    }

    function testCannotAddProductAsNonOwner() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.prank(company2);
        vm.expectRevert("Not company owner");
        ecommerce.addProduct(companyId, "Product", "Desc", 10 * 10**6, 100, "hash");
    }

    // ========== CART TESTS ==========

    function testAddToCart() public {
        // Setup company and product
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Description",
            10 * 10**6,
            100,
            "hash"
        );

        // Add to cart
        vm.prank(customer1);
        ecommerce.addToCart(productId, 5);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, 5);
    }

    function testRemoveFromCart() public {
        // Setup
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(companyId, "Product 1", "Desc", 10 * 10**6, 100, "hash");

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        ecommerce.removeFromCart(productId);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    // ========== INVOICE TESTS ==========

    function testCreateInvoiceFromCart() public {
        // Setup
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(companyId, "Product 1", "Desc", 10 * 10**6, 100, "hash");

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        assertEq(invoiceId, 1);

        (
            uint256 id,
            uint256 compId,
            address customer,
            uint256 total,
            ,
            bool isPaid
        ) = ecommerce.getInvoice(invoiceId);

        assertEq(id, invoiceId);
        assertEq(compId, companyId);
        assertEq(customer, customer1);
        assertEq(total, 50 * 10**6); // 5 * 10 EUR
        assertFalse(isPaid);

        // Cart should be cleared
        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    // ========== PAYMENT TESTS ==========

    function testProcessPayment() public {
        // Setup
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("Company 1", "TAX123");
        
        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(companyId, "Product 1", "Desc", 10 * 10**6, 100, "hash");

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);
        
        // Approve tokens
        uint256 amount = 50 * 10**6;
        token.approve(address(ecommerce), amount);
        vm.stopPrank();

        // Process payment
        vm.prank(customer1);
        ecommerce.processPayment(customer1, amount, invoiceId);

        // Check invoice is paid
        (, , , , , bool isPaid) = ecommerce.getInvoice(invoiceId);
        assertTrue(isPaid);

        // Check tokens transferred
        assertEq(token.balanceOf(company1), amount);
    }

    function testFullFlow() public {
        // 1. Register company
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany("My Shop", "TAX123");

        // 2. Add products
        vm.startPrank(company1);
        uint256 product1 = ecommerce.addProduct(companyId, "Product A", "Desc A", 10 * 10**6, 100, "hash1");
        uint256 product2 = ecommerce.addProduct(companyId, "Product B", "Desc B", 25 * 10**6, 50, "hash2");
        vm.stopPrank();

        // 3. Customer adds to cart
        vm.startPrank(customer1);
        ecommerce.addToCart(product1, 2);
        ecommerce.addToCart(product2, 1);

        // 4. Create invoice
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);

        // 5. Approve and pay
        uint256 total = 45 * 10**6; // (2*10) + (1*25) = 45 EUR
        token.approve(address(ecommerce), total);
        ecommerce.processPayment(customer1, total, invoiceId);
        vm.stopPrank();

        // Verify
        (, , , , , bool isPaid) = ecommerce.getInvoice(invoiceId);
        assertTrue(isPaid);
        assertEq(token.balanceOf(company1), total);

        // Check stock updated
        ProductLib.Product memory p1 = ecommerce.getProduct(product1);
        ProductLib.Product memory p2 = ecommerce.getProduct(product2);
        assertEq(p1.stock, 98);
        assertEq(p2.stock, 49);
    }
}
