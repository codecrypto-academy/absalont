// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library AnalyticsLib {
    struct SalesData {
        uint256 totalSales;
        uint256 totalRevenue;
        uint256 totalOrders;
        mapping(uint256 => uint256) productSales; // productId => quantity sold
        mapping(uint256 => uint256) dailySales; // day timestamp => revenue
        mapping(address => uint256) customerSpending; // customer => total spent
    }

    struct CompanyAnalytics {
        mapping(uint256 => SalesData) companySales; // companyId => SalesData
    }

    event SaleRecorded(
        uint256 indexed companyId,
        uint256 indexed productId,
        uint256 quantity,
        uint256 revenue,
        uint256 timestamp
    );

    function recordSale(
        CompanyAnalytics storage self,
        uint256 companyId,
        uint256 productId,
        uint256 quantity,
        uint256 price,
        address customer
    ) internal {
        SalesData storage sales = self.companySales[companyId];
        
        uint256 revenue = quantity * price;
        
        sales.totalSales += quantity;
        sales.totalRevenue += revenue;
        sales.totalOrders += 1;
        sales.productSales[productId] += quantity;
        
        // Registro diario (timestamp del día)
        uint256 dayTimestamp = (block.timestamp / 1 days) * 1 days;
        sales.dailySales[dayTimestamp] += revenue;
        
        sales.customerSpending[customer] += revenue;

        emit SaleRecorded(companyId, productId, quantity, revenue, block.timestamp);
    }

    function getCompanySales(
        CompanyAnalytics storage self,
        uint256 companyId
    ) internal view returns (uint256 totalSales, uint256 totalRevenue, uint256 totalOrders) {
        SalesData storage sales = self.companySales[companyId];
        return (sales.totalSales, sales.totalRevenue, sales.totalOrders);
    }

    function getProductSales(
        CompanyAnalytics storage self,
        uint256 companyId,
        uint256 productId
    ) internal view returns (uint256) {
        return self.companySales[companyId].productSales[productId];
    }

    function getDailySales(
        CompanyAnalytics storage self,
        uint256 companyId,
        uint256 dayTimestamp
    ) internal view returns (uint256) {
        return self.companySales[companyId].dailySales[dayTimestamp];
    }

    function getCustomerSpending(
        CompanyAnalytics storage self,
        uint256 companyId,
        address customer
    ) internal view returns (uint256) {
        return self.companySales[companyId].customerSpending[customer];
    }
}
