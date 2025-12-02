// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library ProductLib {
    struct Product {
        uint256 productId;
        uint256 companyId;
        string name;
        string description;
        uint256 price; // En centavos de euro (6 decimals)
        uint256 stock;
        string ipfsImageHash;
        bool isActive;
        uint256 createdAt;
    }

    struct ProductStorage {
        mapping(uint256 => Product) products;
        mapping(uint256 => uint256[]) companyProducts; // companyId => productIds
        uint256 productCounter;
    }

    event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price);
    event ProductUpdated(uint256 indexed productId);
    event StockUpdated(uint256 indexed productId, uint256 newStock);

    function addProduct(
        ProductStorage storage self,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) internal returns (uint256) {
        require(bytes(name).length > 0, "Product name required");
        require(price > 0, "Price must be greater than 0");

        self.productCounter++;
        uint256 newProductId = self.productCounter;

        self.products[newProductId] = Product({
            productId: newProductId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            isActive: true,
            createdAt: block.timestamp
        });

        self.companyProducts[companyId].push(newProductId);

        emit ProductAdded(newProductId, companyId, name, price);

        return newProductId;
    }

    function updateProduct(
        ProductStorage storage self,
        uint256 productId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        bool isActive
    ) internal {
        require(productExists(self, productId), "Product not found");
        
        Product storage product = self.products[productId];
        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.isActive = isActive;

        emit ProductUpdated(productId);
    }

    function updateStock(
        ProductStorage storage self,
        uint256 productId,
        uint256 newStock
    ) internal {
        require(productExists(self, productId), "Product not found");
        
        self.products[productId].stock = newStock;
        emit StockUpdated(productId, newStock);
    }

    function decreaseStock(
        ProductStorage storage self,
        uint256 productId,
        uint256 quantity
    ) internal {
        require(productExists(self, productId), "Product not found");
        Product storage product = self.products[productId];
        require(product.stock >= quantity, "Insufficient stock");
        
        product.stock -= quantity;
        emit StockUpdated(productId, product.stock);
    }

    function getProduct(
        ProductStorage storage self,
        uint256 productId
    ) internal view returns (Product memory) {
        require(productExists(self, productId), "Product not found");
        return self.products[productId];
    }

    function getCompanyProducts(
        ProductStorage storage self,
        uint256 companyId
    ) internal view returns (uint256[] memory) {
        return self.companyProducts[companyId];
    }

    function productExists(
        ProductStorage storage self,
        uint256 productId
    ) internal view returns (bool) {
        return productId > 0 && productId <= self.productCounter;
    }
}
