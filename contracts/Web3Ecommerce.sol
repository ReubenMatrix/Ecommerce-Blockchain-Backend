// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Web3Ecommerce {
    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address seller;
        uint256 rating;
        string imageLink;
    }

    struct EMIPlan {
        uint256 productId;
        uint256 totalAmount;
        uint256 monthlyInstallment;
        uint256 tenure; // in months
        uint256 remainingAmount;
        uint256 nextPaymentDate;
        address buyer;
    }

    mapping(uint256 => Product) public products;
    mapping(address => mapping(uint256 => EMIPlan)) public emiPlans;

    uint256 public productCount;

    event ProductListed(uint256 indexed productId, string name, string description, uint256 price, address seller, uint256 rating, string imageLink);
    event EMIPlanCreated(uint256 indexed productId, address buyer, uint256 monthlyInstallment, uint256 tenure);
    event InstallmentPaid(uint256 indexed productId, address buyer, uint256 amountPaid);

    function listProduct(
        string memory _name,
        string memory _description,
        uint256 _price,
        uint256 _rating,
        string memory _imageLink
    ) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        productCount++;
        products[productCount] = Product(productCount, _name, _description, _price, msg.sender, _rating, _imageLink);
        emit ProductListed(productCount, _name, _description, _price, msg.sender, _rating, _imageLink);
    }

    function createEMIPlan(uint256 _productId, uint256 _tenure) external payable {
        require(products[_productId].price > 0, "Product does not exist");
        require(_tenure > 0, "Invalid tenure");

        uint256 totalAmount = products[_productId].price;
        uint256 monthlyInstallment = totalAmount / _tenure;

        require(msg.value >= monthlyInstallment, "Insufficient down payment");

        emiPlans[msg.sender][_productId] = EMIPlan(
            _productId,
            totalAmount,
            monthlyInstallment,
            _tenure,
            totalAmount - msg.value,
            block.timestamp + 30 days,
            msg.sender
        );

        emit EMIPlanCreated(_productId, msg.sender, monthlyInstallment, _tenure);
    }

    function payInstallment(uint256 _productId) external payable {
        EMIPlan storage plan = emiPlans[msg.sender][_productId];
        require(plan.remainingAmount > 0, "No active EMI plan");
        require(msg.value >= plan.monthlyInstallment, "Insufficient payment");
        require(block.timestamp >= plan.nextPaymentDate, "Payment not due yet");

        uint256 amountPaid = msg.value > plan.remainingAmount ? plan.remainingAmount : msg.value;
        plan.remainingAmount -= amountPaid;
        plan.nextPaymentDate += 30 days;

        emit InstallmentPaid(_productId, msg.sender, amountPaid);

        if (plan.remainingAmount == 0) {
            delete emiPlans[msg.sender][_productId];
        }

        if (msg.value > amountPaid) {
            payable(msg.sender).transfer(msg.value - amountPaid);
        }
    }

    function getProduct(uint256 _productId) external view returns (Product memory) {
        require(products[_productId].id != 0, "Product does not exist");
        return products[_productId];
    }

    function getEMIPlan(address _buyer, uint256 _productId) external view returns (EMIPlan memory) {
        return emiPlans[_buyer][_productId];
    }
}