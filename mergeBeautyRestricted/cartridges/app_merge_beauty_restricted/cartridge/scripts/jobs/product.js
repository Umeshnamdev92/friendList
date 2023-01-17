"use strict";

var Transaction = require("dw/system/Transaction");
var ProductMgr = require("dw/catalog/ProductMgr");
var ProductInventoryMgr = require("dw/catalog/ProductInventoryMgr");
var Site = require("dw/system/Site");

// To fetch all the Products come under stock clearance sale criteria.
function stockClearProduct() {

  // Site preferance to get time-period and sale percantage values from BM
  var StockClearanceDays = Site.getCurrent().getPreferences().getCustom()["StockClearanceDays"];
  var stockClearDiscountPercent = Site.getCurrent().getPreferences().getCustom()["StockClearanceLessSoldPercent"];


  Transaction.wrap(function () {4
    var allProduct = ProductMgr.queryAllSiteProducts();
    var inventory;
    var Allocation;
    var Ats;
    var stockAvailable;
    var sellOfProduct;
    var newItem;
    var lastModifiedDate;
    var currentDate;
    var diffDay;
    var diffTime;
    var discountPercentage;
    var newArrival;
    var category;

    // Get all Products
    while (allProduct.hasNext()) {
      newItem = allProduct.next();
      var cat = newItem.getCategories();
      inventory = ProductInventoryMgr.inventoryList.getRecord(newItem.ID);
      if (inventory != null) {
        Allocation = inventory.allocation;
        Ats = inventory.ATS;
        stockAvailable = inventory.stockLevel.available;
        sellOfProduct = inventory.turnover;
        lastModifiedDate = inventory.lastModified;
        currentDate = new Date();

        diffTime = currentDate.getTime() - lastModifiedDate.getTime();
        let diffDay = Math.ceil(diffTime / (1000 * 3600 * 24));


        discountPercentage = (stockClearDiscountPercent / 100) * Allocation;

        // Filter Product on the basis of time-period and sale percentage of Product

         if (stockAvailable && Allocation != null && Ats != null) {
          newItem.custom.lessSold = (sellOfProduct <= discountPercentage ||  (diffDay >= StockClearanceDays) ? true : false) ? true : false;
        }
      }
      else {
        newItem.custom.lessSold = false;
      }
      }
    }
  );
}

module.exports = {
  stockClearProduct: stockClearProduct,
}