// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "./mocks/MockEuroToken.sol";

/**
 * @title EcommerceComprehensiveTest
 * @dev Comprehensive test suite for Ecommerce contract with >80% coverage
 */
contract EcommerceComprehensiveTest is Test {
    Ecommerce public ecommerce;
    MockEuroToken public token;

    address public owner;
    address public company1;
    address public company2;
    address public company3;
    address public customer1;
    address public customer2;
    address public customer3;

    event CompanyRegistered(
        uint256 indexed companyId,
        string name,
        address companyAddress
    );
    event CompanyUpdated(uint256 indexed companyId);
    event ProductAdded(
        uint256 indexed productId,
        uint256 indexed companyId,
        string name,
        uint256 price
    );
    event ProductUpdated(uint256 indexed productId);

    function setUp() public {
        owner = address(this);
        company1 = address(0x1);
        company2 = address(0x2);
        company3 = address(0x3);
        customer1 = address(0x4);
        customer2 = address(0x5);
        customer3 = address(0x6);

        token = new MockEuroToken();
        ecommerce = new Ecommerce(address(token));

        // Mint tokens to customers
        token.mint(customer1, 100000 * 10 ** 6);
        token.mint(customer2, 100000 * 10 ** 6);
        token.mint(customer3, 100000 * 10 ** 6);
    }

    // ========== CONSTRUCTOR & INITIALIZATION TESTS ==========

    function testConstructorInitialization() public view {
        assertEq(address(ecommerce.paymentToken()), address(token));
    }

    function testConstructorRevertsWithZeroAddress() public {
        vm.expectRevert("Invalid token address");
        new Ecommerce(address(0));
    }

    // ========== COMPANY REGISTRATION TESTS ==========

    function testRegisterCompany() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Description 1",
            "TAX123"
        );

        assertEq(companyId, 1);

        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "Company 1");
        assertEq(company.description, "Description 1");
        assertEq(company.companyAddress, company1);
        assertEq(company.taxId, "TAX123");
        assertTrue(company.isActive);
        assertGt(company.createdAt, 0);
    }

    function testRegisterMultipleCompanies() public {
        vm.prank(company1);
        uint256 id1 = ecommerce.registerCompany(
            "Company 1",
            "Desc 1",
            "TAX001"
        );

        vm.prank(company2);
        uint256 id2 = ecommerce.registerCompany(
            "Company 2",
            "Desc 2",
            "TAX002"
        );

        vm.prank(company3);
        uint256 id3 = ecommerce.registerCompany(
            "Company 3",
            "Desc 3",
            "TAX003"
        );

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(ecommerce.getCompanyCount(), 3);
    }

    function testGetCompanyByAddress() public {
        vm.prank(company1);
        ecommerce.registerCompany("Company 1", "Desc 1", "TAX123");

        CompanyLib.Company memory company = ecommerce.getCompanyByAddress(
            company1
        );
        assertEq(company.name, "Company 1");
        assertEq(company.companyAddress, company1);
    }

    function testCannotRegisterCompanyTwice() public {
        vm.startPrank(company1);
        ecommerce.registerCompany("Company 1", "Description", "TAX123");

        vm.expectRevert("Company already registered");
        ecommerce.registerCompany("Company 1 Again", "Another Desc", "TAX456");
        vm.stopPrank();
    }

    function testUpdateCompany() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc 1",
            "TAX123"
        );

        vm.prank(company1);
        ecommerce.updateCompany(
            companyId,
            "Updated Name",
            "Updated Desc",
            "TAX999",
            false
        );

        CompanyLib.Company memory company = ecommerce.getCompany(companyId);
        assertEq(company.name, "Updated Name");
        assertEq(company.description, "Updated Desc");
        assertEq(company.taxId, "TAX999");
        assertFalse(company.isActive);
    }

    function testUpdateCompanyAsNonOwner() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company2);
        vm.expectRevert("Not company owner");
        ecommerce.updateCompany(companyId, "Hacked", "Hacked", "HACK", false);
    }

    // ========== PRODUCT TESTS ==========

    function testAddProduct() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Description",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Description",
            10 * 10 ** 6,
            100,
            "ipfs_hash"
        );

        assertEq(productId, 1);

        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "Product 1");
        assertEq(product.description, "Description");
        assertEq(product.price, 10 * 10 ** 6);
        assertEq(product.stock, 100);
        assertEq(product.companyId, companyId);
        assertTrue(product.isActive);
    }

    function testAddMultipleProducts() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 id1 = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc 1",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 id2 = ecommerce.addProduct(
            companyId,
            "Product 2",
            "Desc 2",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        uint256 id3 = ecommerce.addProduct(
            companyId,
            "Product 3",
            "Desc 3",
            15 * 10 ** 6,
            75,
            "hash3"
        );
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(ecommerce.getProductCount(), 3);
    }

    function testGetCompanyProducts() public {
        vm.prank(company1);
        uint256 companyId1 = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company2);
        uint256 companyId2 = ecommerce.registerCompany(
            "Company 2",
            "Desc",
            "TAX456"
        );

        vm.startPrank(company1);
        uint256 id1 = ecommerce.addProduct(
            companyId1,
            "Product 1",
            "Desc 1",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 id2 = ecommerce.addProduct(
            companyId1,
            "Product 2",
            "Desc 2",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        vm.stopPrank();

        vm.prank(company2);
        ecommerce.addProduct(
            companyId2,
            "Product 3",
            "Desc 3",
            15 * 10 ** 6,
            75,
            "hash3"
        );

        uint256[] memory products1 = ecommerce.getCompanyProducts(companyId1);
        assertEq(products1.length, 2);
        assertEq(products1[0], id1);
        assertEq(products1[1], id2);

        uint256[] memory products2 = ecommerce.getCompanyProducts(companyId2);
        assertEq(products2.length, 1);
    }

    function testGetAllProducts() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc 1",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        ecommerce.addProduct(
            companyId,
            "Product 2",
            "Desc 2",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        ecommerce.addProduct(
            companyId,
            "Product 3",
            "Desc 3",
            15 * 10 ** 6,
            75,
            "hash3"
        );
        vm.stopPrank();

        ProductLib.Product[] memory allProducts = ecommerce.getAllProducts();
        assertEq(allProducts.length, 3);
        assertEq(allProducts[0].name, "Product 1");
        assertEq(allProducts[1].name, "Product 2");
        assertEq(allProducts[2].name, "Product 3");
    }

    function testUpdateProduct() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.prank(company1);
        ecommerce.updateProduct(
            productId,
            "Updated",
            "New Desc",
            15 * 10 ** 6,
            50,
            false
        );

        ProductLib.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "Updated");
        assertEq(product.description, "New Desc");
        assertEq(product.price, 15 * 10 ** 6);
        assertEq(product.stock, 50);
        assertFalse(product.isActive);
    }

    function testCannotAddProductAsNonOwner() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Description",
            "TAX123"
        );

        vm.prank(company2);
        vm.expectRevert("Not company owner");
        ecommerce.addProduct(
            companyId,
            "Product",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );
    }

    function testCannotUpdateProductAsNonOwner() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.prank(company2);
        vm.expectRevert("Not company owner");
        ecommerce.updateProduct(
            productId,
            "Updated",
            "Desc",
            15 * 10 ** 6,
            50,
            true
        );
    }

    // ========== CART TESTS ==========

    function testAddToCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Description",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.prank(customer1);
        ecommerce.addToCart(productId, 5);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, 5);
        assertEq(cart[0].price, 10 * 10 ** 6);
    }

    function testAddMultipleItemsToCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 product1 = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 product2 = ecommerce.addProduct(
            companyId,
            "Product 2",
            "Desc",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        uint256 product3 = ecommerce.addProduct(
            companyId,
            "Product 3",
            "Desc",
            15 * 10 ** 6,
            75,
            "hash3"
        );
        vm.stopPrank();

        vm.startPrank(customer1);
        ecommerce.addToCart(product1, 2);
        ecommerce.addToCart(product2, 3);
        ecommerce.addToCart(product3, 1);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 3);
        assertEq(cart[0].quantity, 2);
        assertEq(cart[1].quantity, 3);
        assertEq(cart[2].quantity, 1);
    }

    function testAddSameProductToCartMultipleTimes() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        ecommerce.addToCart(productId, 3);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 1);
        assertEq(cart[0].quantity, 8);
    }

    function testRemoveFromCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        ecommerce.removeFromCart(productId);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    function testRemoveFromCartWithMultipleItems() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 p1 = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 p2 = ecommerce.addProduct(
            companyId,
            "Product 2",
            "Desc",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        uint256 p3 = ecommerce.addProduct(
            companyId,
            "Product 3",
            "Desc",
            15 * 10 ** 6,
            75,
            "hash3"
        );
        vm.stopPrank();

        vm.startPrank(customer1);
        ecommerce.addToCart(p1, 2);
        ecommerce.addToCart(p2, 3);
        ecommerce.addToCart(p3, 1);
        ecommerce.removeFromCart(p2);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 2);
        assertEq(cart[0].productId, p1);
        assertEq(cart[1].productId, p3);
    }

    function testUpdateCartQuantity() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        ecommerce.updateCartQuantity(productId, 10);
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart[0].quantity, 10);
    }

    function testClearCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 product1 = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 product2 = ecommerce.addProduct(
            companyId,
            "Product 2",
            "Desc",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        vm.stopPrank();

        vm.startPrank(customer1);
        ecommerce.addToCart(product1, 5);
        ecommerce.addToCart(product2, 3);
        ecommerce.clearCart();
        vm.stopPrank();

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    function testGetCartTotal() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 product1 = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 product2 = ecommerce.addProduct(
            companyId,
            "Product 2",
            "Desc",
            20 * 10 ** 6,
            50,
            "hash2"
        );
        vm.stopPrank();

        vm.startPrank(customer1);
        ecommerce.addToCart(product1, 2);
        ecommerce.addToCart(product2, 1);
        vm.stopPrank();

        vm.prank(customer1);
        uint256 total = ecommerce.getCartTotal();
        assertEq(total, 40 * 10 ** 6);
    }

    function testGetCartTotalWithMultipleItems() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 p1 = ecommerce.addProduct(
            companyId,
            "P1",
            "D1",
            5 * 10 ** 6,
            100,
            "h1"
        );
        uint256 p2 = ecommerce.addProduct(
            companyId,
            "P2",
            "D2",
            10 * 10 ** 6,
            100,
            "h2"
        );
        uint256 p3 = ecommerce.addProduct(
            companyId,
            "P3",
            "D3",
            15 * 10 ** 6,
            100,
            "h3"
        );
        vm.stopPrank();

        vm.startPrank(customer1);
        ecommerce.addToCart(p1, 2); // 10 EUR
        ecommerce.addToCart(p2, 3); // 30 EUR
        ecommerce.addToCart(p3, 1); // 15 EUR
        vm.stopPrank();

        vm.prank(customer1);
        uint256 total = ecommerce.getCartTotal();
        assertEq(total, 55 * 10 ** 6);
    }

    function testCannotAddInactiveProductToCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.prank(company1);
        ecommerce.updateProduct(
            productId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            false
        );

        vm.prank(customer1);
        vm.expectRevert("Product not active");
        ecommerce.addToCart(productId, 5);
    }

    function testCannotAddToCartIfInsufficientStock() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            10,
            "hash"
        );

        vm.prank(customer1);
        vm.expectRevert("Insufficient stock");
        ecommerce.addToCart(productId, 15);
    }

    // ========== INVOICE TESTS ==========

    function testCreateInvoiceFromCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

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
        assertEq(total, 50 * 10 ** 6);
        assertFalse(isPaid);

        CartLib.CartItem[] memory cart = ecommerce.getCart(customer1);
        assertEq(cart.length, 0);
    }

    function testCreateMultipleInvoices() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            1000,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoice1 = ecommerce.createInvoiceFromCart(companyId);

        ecommerce.addToCart(productId, 3);
        uint256 invoice2 = ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        assertEq(invoice1, 1);
        assertEq(invoice2, 2);
        assertEq(ecommerce.getInvoiceCount(), 2);
    }

    function testGetInvoiceItems() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.startPrank(company1);
        uint256 p1 = ecommerce.addProduct(
            companyId,
            "P1",
            "D1",
            10 * 10 ** 6,
            100,
            "h1"
        );
        uint256 p2 = ecommerce.addProduct(
            companyId,
            "P2",
            "D2",
            20 * 10 ** 6,
            100,
            "h2"
        );
        vm.stopPrank();

        vm.startPrank(customer1);
        ecommerce.addToCart(p1, 2);
        ecommerce.addToCart(p2, 1);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        InvoiceLib.InvoiceItem[] memory items = ecommerce.getInvoiceItems(
            invoiceId
        );
        assertEq(items.length, 2);
        assertEq(items[0].productId, p1);
        assertEq(items[0].quantity, 2);
        assertEq(items[1].productId, p2);
        assertEq(items[1].quantity, 1);
    }

    function testGetCustomerInvoices() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            1000,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        ecommerce.createInvoiceFromCart(companyId);

        ecommerce.addToCart(productId, 3);
        ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        uint256[] memory invoices = ecommerce.getCustomerInvoices(customer1);
        assertEq(invoices.length, 2);
    }

    function testGetCompanyInvoices() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            1000,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        vm.startPrank(customer2);
        ecommerce.addToCart(productId, 3);
        ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        uint256[] memory invoices = ecommerce.getCompanyInvoices(companyId);
        assertEq(invoices.length, 2);
    }

    function testCannotCreateInvoiceFromEmptyCart() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(customer1);
        vm.expectRevert("Cart is empty");
        ecommerce.createInvoiceFromCart(companyId);
    }

    function testCannotCreateInvoiceFromInactiveProduct() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        vm.stopPrank();

        vm.prank(company1);
        ecommerce.updateProduct(
            productId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            false
        );

        vm.prank(customer1);
        vm.expectRevert("Product not active");
        ecommerce.createInvoiceFromCart(companyId);
    }

    function testCannotCreateInvoiceWithInsufficientStock() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            10,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        vm.stopPrank();

        vm.prank(company1);
        ecommerce.updateProduct(
            productId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            3,
            true
        );

        vm.prank(customer1);
        vm.expectRevert("Insufficient stock");
        ecommerce.createInvoiceFromCart(companyId);
    }

    // ========== PAYMENT TESTS ==========

    function testProcessPayment() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);

        uint256 amount = 50 * 10 ** 6;
        token.approve(address(ecommerce), amount);
        ecommerce.processPayment(customer1, amount, invoiceId);
        vm.stopPrank();

        (, , , , , bool isPaid) = ecommerce.getInvoice(invoiceId);
        assertTrue(isPaid);
        assertEq(token.balanceOf(company1), amount);
    }

    function testProcessMultiplePayments() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            1000,
            "hash"
        );

        // Customer 1 payment
        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoice1 = ecommerce.createInvoiceFromCart(companyId);
        token.approve(address(ecommerce), 50 * 10 ** 6);
        ecommerce.processPayment(customer1, 50 * 10 ** 6, invoice1);
        vm.stopPrank();

        // Customer 2 payment
        vm.startPrank(customer2);
        ecommerce.addToCart(productId, 3);
        uint256 invoice2 = ecommerce.createInvoiceFromCart(companyId);
        token.approve(address(ecommerce), 30 * 10 ** 6);
        ecommerce.processPayment(customer2, 30 * 10 ** 6, invoice2);
        vm.stopPrank();

        assertEq(token.balanceOf(company1), 80 * 10 ** 6);
    }

    function testCannotPayPaidInvoice() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);

        uint256 amount = 50 * 10 ** 6;
        token.approve(address(ecommerce), amount * 2);
        ecommerce.processPayment(customer1, amount, invoiceId);

        vm.expectRevert("Invoice already paid");
        ecommerce.processPayment(customer1, amount, invoiceId);
        vm.stopPrank();
    }

    function testCannotPayWithWrongCustomer() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        vm.startPrank(customer2);
        token.approve(address(ecommerce), 50 * 10 ** 6);
        vm.expectRevert("Invalid customer");
        ecommerce.processPayment(customer2, 50 * 10 ** 6, invoiceId);
        vm.stopPrank();
    }

    function testCannotPayWithWrongAmount() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);

        token.approve(address(ecommerce), 100 * 10 ** 6);
        vm.expectRevert("Invalid amount");
        ecommerce.processPayment(customer1, 100 * 10 ** 6, invoiceId);
        vm.stopPrank();
    }

    function testCannotPayWithInactiveCompany() public {
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "Company 1",
            "Desc",
            "TAX123"
        );

        vm.prank(company1);
        uint256 productId = ecommerce.addProduct(
            companyId,
            "Product 1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );

        vm.startPrank(customer1);
        ecommerce.addToCart(productId, 5);
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);
        vm.stopPrank();

        vm.prank(company1);
        ecommerce.updateCompany(
            companyId,
            "Company 1",
            "Desc",
            "TAX123",
            false
        );

        vm.startPrank(customer1);
        token.approve(address(ecommerce), 50 * 10 ** 6);
        vm.expectRevert("Company not active");
        ecommerce.processPayment(customer1, 50 * 10 ** 6, invoiceId);
        vm.stopPrank();
    }

    // ========== INTEGRATION TESTS ==========

    function testFullFlow() public {
        // 1. Register company
        vm.prank(company1);
        uint256 companyId = ecommerce.registerCompany(
            "My Shop",
            "Great products",
            "TAX123"
        );

        // 2. Add products
        vm.startPrank(company1);
        uint256 product1 = ecommerce.addProduct(
            companyId,
            "Product A",
            "Desc A",
            10 * 10 ** 6,
            100,
            "hash1"
        );
        uint256 product2 = ecommerce.addProduct(
            companyId,
            "Product B",
            "Desc B",
            25 * 10 ** 6,
            50,
            "hash2"
        );
        vm.stopPrank();

        // 3. Customer adds to cart
        vm.startPrank(customer1);
        ecommerce.addToCart(product1, 2);
        ecommerce.addToCart(product2, 1);

        // 4. Create invoice
        uint256 invoiceId = ecommerce.createInvoiceFromCart(companyId);

        // 5. Approve and pay
        uint256 total = 45 * 10 ** 6;
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

    function testMultiCompanyScenario() public {
        // Register two companies
        vm.prank(company1);
        uint256 companyId1 = ecommerce.registerCompany(
            "Shop 1",
            "Desc 1",
            "TAX001"
        );

        vm.prank(company2);
        uint256 companyId2 = ecommerce.registerCompany(
            "Shop 2",
            "Desc 2",
            "TAX002"
        );

        // Add products to both companies
        vm.startPrank(company1);
        uint256 p1_1 = ecommerce.addProduct(
            companyId1,
            "Product 1-1",
            "Desc",
            10 * 10 ** 6,
            100,
            "hash"
        );
        uint256 p1_2 = ecommerce.addProduct(
            companyId1,
            "Product 1-2",
            "Desc",
            20 * 10 ** 6,
            50,
            "hash"
        );
        vm.stopPrank();

        vm.startPrank(company2);
        uint256 p2_1 = ecommerce.addProduct(
            companyId2,
            "Product 2-1",
            "Desc",
            15 * 10 ** 6,
            100,
            "hash"
        );
        vm.stopPrank();

        // Customer buys from company 1
        vm.startPrank(customer1);
        ecommerce.addToCart(p1_1, 2);
        ecommerce.addToCart(p1_2, 1);
        uint256 total1 = ecommerce.getCartTotal();
        uint256 invoice1 = ecommerce.createInvoiceFromCart(companyId1);
        token.approve(address(ecommerce), total1);
        ecommerce.processPayment(customer1, total1, invoice1);
        vm.stopPrank();

        // Customer buys from company 2
        vm.startPrank(customer2);
        ecommerce.addToCart(p2_1, 3);
        uint256 total2 = ecommerce.getCartTotal();
        uint256 invoice2 = ecommerce.createInvoiceFromCart(companyId2);
        token.approve(address(ecommerce), total2);
        ecommerce.processPayment(customer2, total2, invoice2);
        vm.stopPrank();

        // Verify both companies received payments
        // Customer1 bought: 2 * 10 + 1 * 20 = 40 EUR
        // Customer2 bought: 3 * 15 = 45 EUR
        assertEq(token.balanceOf(company1), 40 * 10 ** 6);
        assertEq(token.balanceOf(company2), 45 * 10 ** 6);
    }
}
