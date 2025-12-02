// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library InvoiceLib {
    struct InvoiceItem {
        uint256 productId;
        string productName;
        uint256 quantity;
        uint256 price;
    }

    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address customerAddress;
        InvoiceItem[] items;
        uint256 totalAmount;
        uint256 timestamp;
        bool isPaid;
        bytes32 paymentTxHash;
    }

    struct InvoiceStorage {
        mapping(uint256 => Invoice) invoices;
        mapping(address => uint256[]) customerInvoices;
        mapping(uint256 => uint256[]) companyInvoices;
        uint256 invoiceCounter;
    }

    event InvoiceCreated(
        uint256 indexed invoiceId,
        uint256 indexed companyId,
        address indexed customer,
        uint256 totalAmount
    );
    event InvoicePaid(uint256 indexed invoiceId, bytes32 paymentTxHash);

    function createInvoice(
        InvoiceStorage storage self,
        uint256 companyId,
        address customer,
        uint256 totalAmount
    ) internal returns (uint256) {
        require(customer != address(0), "Invalid customer address");
        require(totalAmount > 0, "Total amount must be greater than 0");

        self.invoiceCounter++;
        uint256 newInvoiceId = self.invoiceCounter;

        Invoice storage newInvoice = self.invoices[newInvoiceId];
        newInvoice.invoiceId = newInvoiceId;
        newInvoice.companyId = companyId;
        newInvoice.customerAddress = customer;
        newInvoice.totalAmount = totalAmount;
        newInvoice.timestamp = block.timestamp;
        newInvoice.isPaid = false;

        self.customerInvoices[customer].push(newInvoiceId);
        self.companyInvoices[companyId].push(newInvoiceId);

        emit InvoiceCreated(newInvoiceId, companyId, customer, totalAmount);

        return newInvoiceId;
    }

    function addInvoiceItem(
        InvoiceStorage storage self,
        uint256 invoiceId,
        uint256 productId,
        string memory productName,
        uint256 quantity,
        uint256 price
    ) internal {
        require(invoiceExists(self, invoiceId), "Invoice not found");

        Invoice storage invoice = self.invoices[invoiceId];
        invoice.items.push(InvoiceItem({
            productId: productId,
            productName: productName,
            quantity: quantity,
            price: price
        }));
    }

    function markAsPaid(
        InvoiceStorage storage self,
        uint256 invoiceId,
        bytes32 txHash
    ) internal {
        require(invoiceExists(self, invoiceId), "Invoice not found");
        require(!self.invoices[invoiceId].isPaid, "Invoice already paid");

        self.invoices[invoiceId].isPaid = true;
        self.invoices[invoiceId].paymentTxHash = txHash;

        emit InvoicePaid(invoiceId, txHash);
    }

    function getInvoice(
        InvoiceStorage storage self,
        uint256 invoiceId
    ) internal view returns (Invoice storage) {
        require(invoiceExists(self, invoiceId), "Invoice not found");
        return self.invoices[invoiceId];
    }

    function getCustomerInvoices(
        InvoiceStorage storage self,
        address customer
    ) internal view returns (uint256[] memory) {
        return self.customerInvoices[customer];
    }

    function getCompanyInvoices(
        InvoiceStorage storage self,
        uint256 companyId
    ) internal view returns (uint256[] memory) {
        return self.companyInvoices[companyId];
    }

    function invoiceExists(
        InvoiceStorage storage self,
        uint256 invoiceId
    ) internal view returns (bool) {
        return invoiceId > 0 && invoiceId <= self.invoiceCounter;
    }
}
