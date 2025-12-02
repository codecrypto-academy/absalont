// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CompanyLib {
    struct Company {
        uint256 companyId;
        string name;
        address companyAddress; // Wallet donde recibe pagos
        string taxId;
        bool isActive;
        uint256 createdAt;
    }

    struct CompanyStorage {
        mapping(uint256 => Company) companies;
        mapping(address => uint256) addressToCompanyId;
        uint256 companyCounter;
    }

    event CompanyRegistered(uint256 indexed companyId, string name, address companyAddress);
    event CompanyUpdated(uint256 indexed companyId);

    function registerCompany(
        CompanyStorage storage self,
        string memory name,
        address companyAddress,
        string memory taxId
    ) internal returns (uint256) {
        require(bytes(name).length > 0, "Company name required");
        require(companyAddress != address(0), "Invalid address");
        require(self.addressToCompanyId[companyAddress] == 0, "Company already registered");

        self.companyCounter++;
        uint256 newCompanyId = self.companyCounter;

        self.companies[newCompanyId] = Company({
            companyId: newCompanyId,
            name: name,
            companyAddress: companyAddress,
            taxId: taxId,
            isActive: true,
            createdAt: block.timestamp
        });

        self.addressToCompanyId[companyAddress] = newCompanyId;

        emit CompanyRegistered(newCompanyId, name, companyAddress);

        return newCompanyId;
    }

    function getCompany(
        CompanyStorage storage self,
        uint256 companyId
    ) internal view returns (Company memory) {
        require(companyId > 0 && companyId <= self.companyCounter, "Invalid company ID");
        return self.companies[companyId];
    }

    function getCompanyByAddress(
        CompanyStorage storage self,
        address companyAddress
    ) internal view returns (Company memory) {
        uint256 companyId = self.addressToCompanyId[companyAddress];
        require(companyId > 0, "Company not found");
        return self.companies[companyId];
    }

    function updateCompany(
        CompanyStorage storage self,
        uint256 companyId,
        string memory name,
        string memory taxId,
        bool isActive
    ) internal {
        require(companyId > 0 && companyId <= self.companyCounter, "Invalid company ID");
        
        Company storage company = self.companies[companyId];
        company.name = name;
        company.taxId = taxId;
        company.isActive = isActive;

        emit CompanyUpdated(companyId);
    }

    function companyExists(
        CompanyStorage storage self,
        uint256 companyId
    ) internal view returns (bool) {
        return companyId > 0 && companyId <= self.companyCounter;
    }

    function isCompanyOwner(
        CompanyStorage storage self,
        uint256 companyId,
        address account
    ) internal view returns (bool) {
        if (!companyExists(self, companyId)) return false;
        return self.companies[companyId].companyAddress == account;
    }
}
