// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoyaltyNFT
 * @dev NFT de programa de fidelidad con niveles y recompensas
 */
contract LoyaltyNFT is ERC721, Ownable {
    enum Tier { BRONZE, SILVER, GOLD, PLATINUM }

    struct LoyaltyCard {
        Tier tier;
        uint256 points;
        uint256 totalSpent; // En centavos de euro
        uint256 discountPercentage; // 0-100
        uint256 issuedAt;
    }

    mapping(uint256 => LoyaltyCard) public loyaltyCards;
    mapping(address => uint256) public addressToTokenId;
    uint256 private _tokenIdCounter;

    // Umbrales para niveles (en centavos de euro)
    uint256 public constant SILVER_THRESHOLD = 100 * 10**6;   // 100 EUR
    uint256 public constant GOLD_THRESHOLD = 500 * 10**6;     // 500 EUR
    uint256 public constant PLATINUM_THRESHOLD = 1000 * 10**6; // 1000 EUR

    // Descuentos por nivel
    uint256 public constant BRONZE_DISCOUNT = 0;    // 0%
    uint256 public constant SILVER_DISCOUNT = 5;    // 5%
    uint256 public constant GOLD_DISCOUNT = 10;     // 10%
    uint256 public constant PLATINUM_DISCOUNT = 15; // 15%

    event LoyaltyCardMinted(address indexed customer, uint256 indexed tokenId, Tier tier);
    event LoyaltyCardUpgraded(uint256 indexed tokenId, Tier newTier);
    event PointsAdded(uint256 indexed tokenId, uint256 points, uint256 spent);

    constructor() ERC721("LoyaltyCard", "LOYAL") Ownable(msg.sender) {}

    function mintLoyaltyCard(address customer) external onlyOwner returns (uint256) {
        require(addressToTokenId[customer] == 0, "Customer already has loyalty card");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(customer, newTokenId);

        loyaltyCards[newTokenId] = LoyaltyCard({
            tier: Tier.BRONZE,
            points: 0,
            totalSpent: 0,
            discountPercentage: BRONZE_DISCOUNT,
            issuedAt: block.timestamp
        });

        addressToTokenId[customer] = newTokenId;

        emit LoyaltyCardMinted(customer, newTokenId, Tier.BRONZE);

        return newTokenId;
    }

    function addPoints(address customer, uint256 amountSpent) external onlyOwner {
        uint256 tokenId = addressToTokenId[customer];
        require(tokenId > 0, "Customer has no loyalty card");

        LoyaltyCard storage card = loyaltyCards[tokenId];
        
        // 1 punto por cada euro gastado
        uint256 pointsToAdd = amountSpent / 10**6;
        card.points += pointsToAdd;
        card.totalSpent += amountSpent;

        // Verificar si debe subir de nivel
        Tier oldTier = card.tier;
        _updateTier(tokenId);

        emit PointsAdded(tokenId, pointsToAdd, amountSpent);

        if (card.tier != oldTier) {
            emit LoyaltyCardUpgraded(tokenId, card.tier);
        }
    }

    function _updateTier(uint256 tokenId) internal {
        LoyaltyCard storage card = loyaltyCards[tokenId];

        if (card.totalSpent >= PLATINUM_THRESHOLD && card.tier != Tier.PLATINUM) {
            card.tier = Tier.PLATINUM;
            card.discountPercentage = PLATINUM_DISCOUNT;
        } else if (card.totalSpent >= GOLD_THRESHOLD && card.tier != Tier.GOLD) {
            card.tier = Tier.GOLD;
            card.discountPercentage = GOLD_DISCOUNT;
        } else if (card.totalSpent >= SILVER_THRESHOLD && card.tier != Tier.SILVER) {
            card.tier = Tier.SILVER;
            card.discountPercentage = SILVER_DISCOUNT;
        }
    }

    function getLoyaltyCard(address customer) external view returns (LoyaltyCard memory) {
        uint256 tokenId = addressToTokenId[customer];
        require(tokenId > 0, "Customer has no loyalty card");
        return loyaltyCards[tokenId];
    }

    function getDiscount(address customer) external view returns (uint256) {
        uint256 tokenId = addressToTokenId[customer];
        if (tokenId == 0) return 0;
        return loyaltyCards[tokenId].discountPercentage;
    }

    function redeemPoints(address customer, uint256 points) external onlyOwner {
        uint256 tokenId = addressToTokenId[customer];
        require(tokenId > 0, "Customer has no loyalty card");
        require(loyaltyCards[tokenId].points >= points, "Insufficient points");

        loyaltyCards[tokenId].points -= points;
    }

    // Prevenir transferencias (soulbound NFT)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Loyalty cards are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}
