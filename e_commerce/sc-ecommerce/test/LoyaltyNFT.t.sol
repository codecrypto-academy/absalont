// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LoyaltyNFT.sol";

contract LoyaltyNFTTest is Test {
    LoyaltyNFT public loyaltyNFT;

    address public owner;
    address public customer1;
    address public customer2;
    address public customer3;
    address public unauthorized;

    // Constants from LoyaltyNFT
    uint256 constant SILVER_THRESHOLD = 100 * 10 ** 6; // 100 EUR
    uint256 constant GOLD_THRESHOLD = 500 * 10 ** 6; // 500 EUR
    uint256 constant PLATINUM_THRESHOLD = 1000 * 10 ** 6; // 1000 EUR

    uint256 constant BRONZE_DISCOUNT = 0; // 0%
    uint256 constant SILVER_DISCOUNT = 5; // 5%
    uint256 constant GOLD_DISCOUNT = 10; // 10%
    uint256 constant PLATINUM_DISCOUNT = 15; // 15%

    event LoyaltyCardMinted(
        address indexed customer,
        uint256 indexed tokenId,
        LoyaltyNFT.Tier tier
    );
    event LoyaltyCardUpgraded(uint256 indexed tokenId, LoyaltyNFT.Tier newTier);
    event PointsAdded(uint256 indexed tokenId, uint256 points, uint256 spent);

    function setUp() public {
        owner = address(this);
        customer1 = makeAddr("customer1");
        customer2 = makeAddr("customer2");
        customer3 = makeAddr("customer3");
        unauthorized = makeAddr("unauthorized");

        loyaltyNFT = new LoyaltyNFT();
    }

    // ========== MINTING TESTS ==========

    function testMintLoyaltyCard() public {
        uint256 tokenId = loyaltyNFT.mintLoyaltyCard(customer1);

        assertEq(tokenId, 1);
        assertEq(loyaltyNFT.ownerOf(tokenId), customer1);
        assertEq(loyaltyNFT.addressToTokenId(customer1), tokenId);
        assertEq(loyaltyNFT.balanceOf(customer1), 1);
    }

    function testMintLoyaltyCardInitialValues() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.BRONZE));
        assertEq(card.points, 0);
        assertEq(card.totalSpent, 0);
        assertEq(card.discountPercentage, BRONZE_DISCOUNT);
        assertGt(card.issuedAt, 0);
    }

    function testMintLoyaltyCardEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit LoyaltyCardMinted(customer1, 1, LoyaltyNFT.Tier.BRONZE);

        loyaltyNFT.mintLoyaltyCard(customer1);
    }

    function testMintMultipleLoyaltyCards() public {
        uint256 tokenId1 = loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 tokenId2 = loyaltyNFT.mintLoyaltyCard(customer2);
        uint256 tokenId3 = loyaltyNFT.mintLoyaltyCard(customer3);

        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(tokenId3, 3);

        assertEq(loyaltyNFT.ownerOf(tokenId1), customer1);
        assertEq(loyaltyNFT.ownerOf(tokenId2), customer2);
        assertEq(loyaltyNFT.ownerOf(tokenId3), customer3);
    }

    function testCannotMintDuplicateCard() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        vm.expectRevert("Customer already has loyalty card");
        loyaltyNFT.mintLoyaltyCard(customer1);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                unauthorized
            )
        );
        loyaltyNFT.mintLoyaltyCard(customer1);
    }

    // ========== POINTS TESTS ==========

    function testAddPoints() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 amountSpent = 50 * 10 ** 6; // 50 EUR

        loyaltyNFT.addPoints(customer1, amountSpent);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(card.points, 50); // 1 point per EUR
        assertEq(card.totalSpent, amountSpent);
    }

    function testAddPointsMultipleTimes() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        loyaltyNFT.addPoints(customer1, 25 * 10 ** 6); // 25 EUR
        loyaltyNFT.addPoints(customer1, 30 * 10 ** 6); // 30 EUR
        loyaltyNFT.addPoints(customer1, 45 * 10 ** 6); // 45 EUR

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(card.points, 100); // 25 + 30 + 45
        assertEq(card.totalSpent, 100 * 10 ** 6);
    }

    function testAddPointsEmitsEvent() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 amountSpent = 50 * 10 ** 6;

        vm.expectEmit(true, false, false, true);
        emit PointsAdded(1, 50, amountSpent);

        loyaltyNFT.addPoints(customer1, amountSpent);
    }

    function testAddPointsFailsWithoutCard() public {
        vm.expectRevert("Customer has no loyalty card");
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6);
    }

    function testOnlyOwnerCanAddPoints() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                unauthorized
            )
        );
        loyaltyNFT.addPoints(customer1, 50 * 10 ** 6);
    }

    // ========== TIER UPGRADE TESTS ==========

    function testUpgradeToSilver() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Gastar exactamente el umbral de Silver
        loyaltyNFT.addPoints(customer1, SILVER_THRESHOLD);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));
        assertEq(card.discountPercentage, SILVER_DISCOUNT);
    }

    function testUpgradeToGold() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Gastar exactamente el umbral de Gold
        loyaltyNFT.addPoints(customer1, GOLD_THRESHOLD);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.GOLD));
        assertEq(card.discountPercentage, GOLD_DISCOUNT);
    }

    function testUpgradeToPlatinum() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Gastar exactamente el umbral de Platinum
        loyaltyNFT.addPoints(customer1, PLATINUM_THRESHOLD);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.PLATINUM));
        assertEq(card.discountPercentage, PLATINUM_DISCOUNT);
    }

    function testUpgradeEmitsEvent() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        vm.expectEmit(true, false, false, true);
        emit LoyaltyCardUpgraded(1, LoyaltyNFT.Tier.SILVER);

        loyaltyNFT.addPoints(customer1, SILVER_THRESHOLD);
    }

    function testProgressiveTierUpgrade() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Start at Bronze
        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.BRONZE));

        // Upgrade to Silver
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));

        // Upgrade to Gold
        loyaltyNFT.addPoints(customer1, 400 * 10 ** 6);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.GOLD));

        // Upgrade to Platinum
        loyaltyNFT.addPoints(customer1, 500 * 10 ** 6);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.PLATINUM));
    }

    function testNoDowngrade() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Llegar a SILVER (100 EUR)
        loyaltyNFT.addPoints(customer1, SILVER_THRESHOLD);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        // Verificamos que estemos en SILVER (tier 1)
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));

        uint256 pointsAtSilver = card.points;

        // Agregar más puntos sin alcanzar GOLD (menos de 400 EUR adicionales)
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6); // Total: 200 EUR

        card = loyaltyNFT.getLoyaltyCard(customer1);
        // El tier debe seguir siendo SILVER (no se baja de tier)
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));
        // Los puntos sí deben aumentar
        assertEq(card.points, pointsAtSilver + 100);
    }

    function testBelowSilverThreshold() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Gastar justo por debajo del umbral de Silver
        loyaltyNFT.addPoints(customer1, SILVER_THRESHOLD - 1);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.BRONZE));
        assertEq(card.discountPercentage, BRONZE_DISCOUNT);
    }

    function testAboveSilverBelowGold() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Gastar entre Silver y Gold
        loyaltyNFT.addPoints(customer1, 300 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));
        assertEq(card.discountPercentage, SILVER_DISCOUNT);
    }

    // ========== DISCOUNT TESTS ==========

    function testGetDiscountBronze() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        uint256 discount = loyaltyNFT.getDiscount(customer1);
        assertEq(discount, BRONZE_DISCOUNT);
    }

    function testGetDiscountSilver() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, SILVER_THRESHOLD);

        uint256 discount = loyaltyNFT.getDiscount(customer1);
        assertEq(discount, SILVER_DISCOUNT);
    }

    function testGetDiscountGold() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, GOLD_THRESHOLD);

        uint256 discount = loyaltyNFT.getDiscount(customer1);
        assertEq(discount, GOLD_DISCOUNT);
    }

    function testGetDiscountPlatinum() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, PLATINUM_THRESHOLD);

        uint256 discount = loyaltyNFT.getDiscount(customer1);
        assertEq(discount, PLATINUM_DISCOUNT);
    }

    function testGetDiscountNoCard() public view {
        uint256 discount = loyaltyNFT.getDiscount(customer1);
        assertEq(discount, 0);
    }

    // ========== REDEEM POINTS TESTS ==========

    function testRedeemPoints() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory cardBefore = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        uint256 pointsBefore = cardBefore.points;

        loyaltyNFT.redeemPoints(customer1, 50);

        LoyaltyNFT.LoyaltyCard memory cardAfter = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(cardAfter.points, pointsBefore - 50);
    }

    function testRedeemAllPoints() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        uint256 allPoints = card.points;

        loyaltyNFT.redeemPoints(customer1, allPoints);

        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(card.points, 0);
    }

    function testRedeemPointsFailsWithInsufficientPoints() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, 50 * 10 ** 6);

        vm.expectRevert("Insufficient points");
        loyaltyNFT.redeemPoints(customer1, 100);
    }

    function testRedeemPointsFailsWithoutCard() public {
        vm.expectRevert("Customer has no loyalty card");
        loyaltyNFT.redeemPoints(customer1, 50);
    }

    function testOnlyOwnerCanRedeemPoints() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6);

        vm.prank(unauthorized);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                unauthorized
            )
        );
        loyaltyNFT.redeemPoints(customer1, 50);
    }

    function testRedeemPointsDoesNotAffectTier() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, SILVER_THRESHOLD);

        LoyaltyNFT.LoyaltyCard memory cardBefore = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(uint256(cardBefore.tier), uint256(LoyaltyNFT.Tier.SILVER));

        loyaltyNFT.redeemPoints(customer1, 50);

        LoyaltyNFT.LoyaltyCard memory cardAfter = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(uint256(cardAfter.tier), uint256(LoyaltyNFT.Tier.SILVER));
        assertEq(cardAfter.totalSpent, cardBefore.totalSpent);
    }

    // ========== SOULBOUND NFT TESTS ==========

    function testCannotTransferLoyaltyCard() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 tokenId = loyaltyNFT.addressToTokenId(customer1);

        vm.prank(customer1);
        vm.expectRevert("Loyalty cards are non-transferable");
        loyaltyNFT.transferFrom(customer1, customer2, tokenId);
    }

    function testCannotSafeTransferLoyaltyCard() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 tokenId = loyaltyNFT.addressToTokenId(customer1);

        vm.prank(customer1);
        vm.expectRevert("Loyalty cards are non-transferable");
        loyaltyNFT.safeTransferFrom(customer1, customer2, tokenId);
    }

    function testCannotApproveTransfer() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 tokenId = loyaltyNFT.addressToTokenId(customer1);

        // Approve should work
        vm.prank(customer1);
        loyaltyNFT.approve(customer2, tokenId);

        // But transfer should fail
        vm.prank(customer2);
        vm.expectRevert("Loyalty cards are non-transferable");
        loyaltyNFT.transferFrom(customer1, customer2, tokenId);
    }

    // ========== VIEW FUNCTIONS TESTS ==========

    function testGetLoyaltyCard() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, 250 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );

        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));
        assertEq(card.points, 250);
        assertEq(card.totalSpent, 250 * 10 ** 6);
        assertEq(card.discountPercentage, SILVER_DISCOUNT);
        assertGt(card.issuedAt, 0);
    }

    function testGetLoyaltyCardFailsWithoutCard() public {
        vm.expectRevert("Customer has no loyalty card");
        loyaltyNFT.getLoyaltyCard(customer1);
    }

    function testAddressToTokenIdMapping() public {
        uint256 tokenId1 = loyaltyNFT.mintLoyaltyCard(customer1);
        uint256 tokenId2 = loyaltyNFT.mintLoyaltyCard(customer2);

        assertEq(loyaltyNFT.addressToTokenId(customer1), tokenId1);
        assertEq(loyaltyNFT.addressToTokenId(customer2), tokenId2);
        assertEq(loyaltyNFT.addressToTokenId(customer3), 0);
    }

    // ========== ERC721 STANDARD TESTS ==========

    function testTokenName() public view {
        assertEq(loyaltyNFT.name(), "LoyaltyCard");
    }

    function testTokenSymbol() public view {
        assertEq(loyaltyNFT.symbol(), "LOYAL");
    }

    function testBalanceOf() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        assertEq(loyaltyNFT.balanceOf(customer1), 1);
        assertEq(loyaltyNFT.balanceOf(customer2), 0);
    }

    function testOwnerOf() public {
        uint256 tokenId = loyaltyNFT.mintLoyaltyCard(customer1);

        assertEq(loyaltyNFT.ownerOf(tokenId), customer1);
    }

    // ========== EDGE CASES TESTS ==========

    function testZeroPointsSpending() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        loyaltyNFT.addPoints(customer1, 0);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(card.points, 0);
        assertEq(card.totalSpent, 0);
    }

    function testVerySmallSpending() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Less than 1 EUR (no points should be added)
        loyaltyNFT.addPoints(customer1, 0.5 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(card.points, 0); // Should round down
        assertEq(card.totalSpent, 0.5 * 10 ** 6);
    }

    function testLargeSpending() public {
        loyaltyNFT.mintLoyaltyCard(customer1);

        // Spend 10,000 EUR at once
        loyaltyNFT.addPoints(customer1, 10000 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(card.points, 10000);
        assertEq(card.totalSpent, 10000 * 10 ** 6);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.PLATINUM));
    }

    function testMultipleCustomersIndependence() public {
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.mintLoyaltyCard(customer2);

        loyaltyNFT.addPoints(customer1, PLATINUM_THRESHOLD);
        loyaltyNFT.addPoints(customer2, 50 * 10 ** 6);

        LoyaltyNFT.LoyaltyCard memory card1 = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        LoyaltyNFT.LoyaltyCard memory card2 = loyaltyNFT.getLoyaltyCard(
            customer2
        );

        assertEq(uint256(card1.tier), uint256(LoyaltyNFT.Tier.PLATINUM));
        assertEq(uint256(card2.tier), uint256(LoyaltyNFT.Tier.BRONZE));
    }

    // ========== INTEGRATION TESTS ==========

    function testCompleteCustomerJourney() public {
        // 1. Mint card
        uint256 tokenId = loyaltyNFT.mintLoyaltyCard(customer1);
        assertEq(loyaltyNFT.ownerOf(tokenId), customer1);

        // 2. Start with Bronze
        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.BRONZE));
        assertEq(loyaltyNFT.getDiscount(customer1), 0);

        // 3. Make purchases to reach Silver
        loyaltyNFT.addPoints(customer1, 100 * 10 ** 6);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.SILVER));
        assertEq(loyaltyNFT.getDiscount(customer1), 5);

        // 4. Continue to Gold
        loyaltyNFT.addPoints(customer1, 400 * 10 ** 6);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.GOLD));
        assertEq(loyaltyNFT.getDiscount(customer1), 10);

        // 5. Redeem some points
        uint256 pointsBefore = card.points;
        loyaltyNFT.redeemPoints(customer1, 100);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(card.points, pointsBefore - 100);

        // 6. Reach Platinum
        loyaltyNFT.addPoints(customer1, 500 * 10 ** 6);
        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(uint256(card.tier), uint256(LoyaltyNFT.Tier.PLATINUM));
        assertEq(loyaltyNFT.getDiscount(customer1), 15);

        // 7. Verify card is soulbound
        vm.prank(customer1);
        vm.expectRevert("Loyalty cards are non-transferable");
        loyaltyNFT.transferFrom(customer1, customer2, tokenId);
    }

    function testMultipleCustomersScenario() public {
        // Mint cards for 3 customers
        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.mintLoyaltyCard(customer2);
        loyaltyNFT.mintLoyaltyCard(customer3);

        // Different spending patterns
        loyaltyNFT.addPoints(customer1, 50 * 10 ** 6); // Bronze
        loyaltyNFT.addPoints(customer2, 200 * 10 ** 6); // Silver
        loyaltyNFT.addPoints(customer3, 1500 * 10 ** 6); // Platinum

        // Verify tiers
        assertEq(
            uint256(loyaltyNFT.getLoyaltyCard(customer1).tier),
            uint256(LoyaltyNFT.Tier.BRONZE)
        );
        assertEq(
            uint256(loyaltyNFT.getLoyaltyCard(customer2).tier),
            uint256(LoyaltyNFT.Tier.SILVER)
        );
        assertEq(
            uint256(loyaltyNFT.getLoyaltyCard(customer3).tier),
            uint256(LoyaltyNFT.Tier.PLATINUM)
        );

        // Verify discounts
        assertEq(loyaltyNFT.getDiscount(customer1), 0);
        assertEq(loyaltyNFT.getDiscount(customer2), 5);
        assertEq(loyaltyNFT.getDiscount(customer3), 15);
    }

    // ========== FUZZ TESTS ==========

    function testFuzzAddPoints(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint128).max);

        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, amount);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        assertEq(card.totalSpent, amount);
        assertEq(card.points, amount / 10 ** 6);
    }

    function testFuzzRedeemPoints(
        uint256 addAmount,
        uint256 redeemAmount
    ) public {
        vm.assume(addAmount >= 10 ** 6 && addAmount < type(uint128).max);

        loyaltyNFT.mintLoyaltyCard(customer1);
        loyaltyNFT.addPoints(customer1, addAmount);

        LoyaltyNFT.LoyaltyCard memory card = loyaltyNFT.getLoyaltyCard(
            customer1
        );
        uint256 points = card.points;

        vm.assume(redeemAmount > 0 && redeemAmount <= points);

        loyaltyNFT.redeemPoints(customer1, redeemAmount);

        card = loyaltyNFT.getLoyaltyCard(customer1);
        assertEq(card.points, points - redeemAmount);
    }
}
