/**
 * ABI centralizado para el contrato Ecommerce
 * Los nombres de los campos en las tuplas deben coincidir EXACTAMENTE con los del struct en Solidity
 */

export const ECOMMERCE_ABI = [
  // Company functions
  'function registerCompany(string name, string description, string taxId) external returns (uint256)',
  'function registerCompanyFor(string name, string description, string taxId, address owner) external returns (uint256)',
  'function getCompanyCount() external view returns (uint256)',
  'function getCompany(uint256 companyId) external view returns (tuple(uint256 companyId, string name, string description, address companyAddress, string taxId, bool isActive, uint256 createdAt))',
  'function getCompanyByAddress(address companyAddress) external view returns (tuple(uint256 companyId, string name, string description, address companyAddress, string taxId, bool isActive, uint256 createdAt))',
  'function updateCompany(uint256 companyId, string memory name, string memory description, string memory taxId, bool isActive) external',

  // Product functions
  'function addProduct(uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash) external returns (uint256)',
  'function addProductUnsafe(uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash) external returns (uint256)',
  'function updateProduct(uint256 productId, string memory name, string memory description, uint256 price, uint256 stock, bool isActive) external',
  'function updateProductUnsafe(uint256 productId, string memory name, string memory description, uint256 price, uint256 stock, bool isActive) external',
  'function getProduct(uint256 productId) external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive, uint256 createdAt))',
  'function getProductCount() external view returns (uint256)',
  'function getAllProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive, uint256 createdAt)[])',
  'function getCompanyProducts(uint256 companyId) external view returns (uint256[])',

  // Cart functions
  'function addToCart(uint256 productId, uint256 quantity) external',
  'function removeFromCart(uint256 productId) external',
  'function updateCartQuantity(uint256 productId, uint256 newQuantity) external',
  'function getCart(address customer) external view returns (tuple(uint256 productId, uint256 quantity, uint256 price)[])',
  'function clearCart() external',
  'function getCartTotal() external view returns (uint256)',

  // Invoice functions
  'function createInvoiceFromCart(uint256 companyId) external returns (uint256)',
  'function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 id, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid))',
  'function getInvoiceItems(uint256 invoiceId) external view returns (tuple(uint256 productId, string productName, uint256 quantity, uint256 price)[])',
  'function getCustomerInvoices(address customer) external view returns (uint256[])',
  'function getCompanyInvoices(uint256 companyId) external view returns (uint256[])',
  'function getInvoiceCount() external view returns (uint256)',

  // Payment functions
  'function processPayment(address customer, uint256 amount, uint256 invoiceId) external',

  // Platform functions
  'function owner() external view returns (address)'
]
