const Web3Ecommerce = artifacts.require("Web3Ecommerce");

module.exports = function(deployer) {
  deployer.deploy(Web3Ecommerce);
};