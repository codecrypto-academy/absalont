// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CartLib {
    struct CartItem {
        uint256 productId;
        uint256 quantity;
        uint256 price; // Precio al momento de agregar al carrito
    }

    struct CartStorage {
        mapping(address => CartItem[]) carts;
    }

    event ItemAddedToCart(address indexed customer, uint256 indexed productId, uint256 quantity);
    event ItemRemovedFromCart(address indexed customer, uint256 indexed productId);
    event CartCleared(address indexed customer);

    function addToCart(
        CartStorage storage self,
        address customer,
        uint256 productId,
        uint256 quantity,
        uint256 price
    ) internal {
        require(quantity > 0, "Quantity must be greater than 0");

        CartItem[] storage cart = self.carts[customer];

        // Verificar si el producto ya está en el carrito
        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity += quantity;
                emit ItemAddedToCart(customer, productId, quantity);
                return;
            }
        }

        // Si no está, agregarlo
        cart.push(CartItem({
            productId: productId,
            quantity: quantity,
            price: price
        }));

        emit ItemAddedToCart(customer, productId, quantity);
    }

    function removeFromCart(
        CartStorage storage self,
        address customer,
        uint256 productId
    ) internal {
        CartItem[] storage cart = self.carts[customer];

        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                // Mover el último elemento a la posición actual y eliminar el último
                cart[i] = cart[cart.length - 1];
                cart.pop();
                emit ItemRemovedFromCart(customer, productId);
                return;
            }
        }

        revert("Product not in cart");
    }

    function updateQuantity(
        CartStorage storage self,
        address customer,
        uint256 productId,
        uint256 newQuantity
    ) internal {
        require(newQuantity > 0, "Quantity must be greater than 0");

        CartItem[] storage cart = self.carts[customer];

        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity = newQuantity;
                return;
            }
        }

        revert("Product not in cart");
    }

    function getCart(
        CartStorage storage self,
        address customer
    ) internal view returns (CartItem[] memory) {
        return self.carts[customer];
    }

    function clearCart(
        CartStorage storage self,
        address customer
    ) internal {
        delete self.carts[customer];
        emit CartCleared(customer);
    }

    function calculateTotal(
        CartStorage storage self,
        address customer
    ) internal view returns (uint256) {
        CartItem[] memory cart = self.carts[customer];
        uint256 total = 0;

        for (uint256 i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].quantity;
        }

        return total;
    }

    function getCartItemCount(
        CartStorage storage self,
        address customer
    ) internal view returns (uint256) {
        return self.carts[customer].length;
    }
}
