// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library ReviewLib {
    struct Review {
        uint256 reviewId;
        uint256 productId;
        address customerAddress;
        uint8 rating; // 1-5 estrellas
        string comment;
        uint256 timestamp;
        bool isActive;
    }

    struct ReviewStorage {
        mapping(uint256 => Review) reviews;
        mapping(uint256 => uint256[]) productReviews; // productId => reviewIds
        mapping(address => mapping(uint256 => bool)) hasReviewed; // customer => productId => hasReviewed
        uint256 reviewCounter;
    }

    event ReviewAdded(
        uint256 indexed reviewId,
        uint256 indexed productId,
        address indexed customer,
        uint8 rating
    );
    event ReviewUpdated(uint256 indexed reviewId);
    event ReviewRemoved(uint256 indexed reviewId);

    function addReview(
        ReviewStorage storage self,
        uint256 productId,
        address customer,
        uint8 rating,
        string memory comment
    ) internal returns (uint256) {
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(!self.hasReviewed[customer][productId], "Already reviewed this product");
        require(bytes(comment).length <= 500, "Comment too long");

        self.reviewCounter++;
        uint256 newReviewId = self.reviewCounter;

        self.reviews[newReviewId] = Review({
            reviewId: newReviewId,
            productId: productId,
            customerAddress: customer,
            rating: rating,
            comment: comment,
            timestamp: block.timestamp,
            isActive: true
        });

        self.productReviews[productId].push(newReviewId);
        self.hasReviewed[customer][productId] = true;

        emit ReviewAdded(newReviewId, productId, customer, rating);

        return newReviewId;
    }

    function updateReview(
        ReviewStorage storage self,
        uint256 reviewId,
        uint8 rating,
        string memory comment
    ) internal {
        require(reviewExists(self, reviewId), "Review not found");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(bytes(comment).length <= 500, "Comment too long");

        Review storage review = self.reviews[reviewId];
        review.rating = rating;
        review.comment = comment;

        emit ReviewUpdated(reviewId);
    }

    function removeReview(
        ReviewStorage storage self,
        uint256 reviewId
    ) internal {
        require(reviewExists(self, reviewId), "Review not found");
        
        self.reviews[reviewId].isActive = false;
        emit ReviewRemoved(reviewId);
    }

    function getReview(
        ReviewStorage storage self,
        uint256 reviewId
    ) internal view returns (Review memory) {
        require(reviewExists(self, reviewId), "Review not found");
        return self.reviews[reviewId];
    }

    function getProductReviews(
        ReviewStorage storage self,
        uint256 productId
    ) internal view returns (uint256[] memory) {
        return self.productReviews[productId];
    }

    function getAverageRating(
        ReviewStorage storage self,
        uint256 productId
    ) internal view returns (uint256, uint256) {
        uint256[] memory reviewIds = self.productReviews[productId];
        
        if (reviewIds.length == 0) {
            return (0, 0);
        }

        uint256 totalRating = 0;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review memory review = self.reviews[reviewIds[i]];
            if (review.isActive) {
                totalRating += review.rating;
                activeCount++;
            }
        }

        if (activeCount == 0) {
            return (0, 0);
        }

        // Retornar promedio * 100 para mantener 2 decimales (ej: 450 = 4.50 estrellas)
        uint256 average = (totalRating * 100) / activeCount;
        return (average, activeCount);
    }

    function reviewExists(
        ReviewStorage storage self,
        uint256 reviewId
    ) internal view returns (bool) {
        return reviewId > 0 && reviewId <= self.reviewCounter;
    }

    function hasUserReviewed(
        ReviewStorage storage self,
        address customer,
        uint256 productId
    ) internal view returns (bool) {
        return self.hasReviewed[customer][productId];
    }
}
