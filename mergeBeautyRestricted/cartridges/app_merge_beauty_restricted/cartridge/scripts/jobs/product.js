function getMonthDifference(allocationResetDate, currentDate) {
  var month = currentDate.getMonth() - allocationResetDate.getMonth() + 12 * (currentDate.getFullYear() - allocationResetDate.getFullYear());
  return month;
}

function stockClearProduct() {
  var Transaction = require("dw/system/Transaction");
  var ProductMgr = require("dw/catalog/ProductMgr");
  var ProductInventoryMgr = require("dw/catalog/ProductInventoryMgr");
  var Site = require('dw/system/Site');

  var stockClearDiscountPercent = Site.current.preferences.custom.stockClearDiscountPercent;
  var stockClearMonth = Site.current.preferences.custom.StockClearMonth;
  Transaction.wrap(function () {
    var allProduct = ProductMgr.queryAllSiteProducts();
    var inventory;
    var Allocation;
    var Ats;
    var stockAvailable;
    var sellOfProduct;
    var newItem;
    let allocationResetDate;
    let monthDiff;
    let currentDate;

    while (allProduct.hasNext()) {
      newItem = allProduct.next();
      inventory = ProductInventoryMgr.inventoryList.getRecord(newItem.ID);
      if (inventory != null) {
        Allocation = inventory.allocation;
        Ats = inventory.ATS;
        stockAvailable = inventory.stockLevel.available;
        sellOfProduct = inventory.turnover;
        allocationResetDate = inventory.allocationResetDate;
        currentDate = new Date();
        monthDiff = getMonthDifference(allocationResetDate, currentDate);
        stockClearDiscountPercent = stockClearDiscountPercent ? Number(Allocation * (stockClearDiscountPercent / 100)) : 0;
        stockClearMonth = stockClearMonth ? stockClearMonth : 0;
        if (stockAvailable && Allocation != null && Ats != null) {
          newItem.custom.lessSold = (sellOfProduct <= stockClearDiscountPercent || monthDiff <= stockClearMonth) ? true : false;
        }
      }
      else {
        newItem.custom.lessSold = false;
      }
    }
  });
}

module.exports = {
  stockClearProduct: stockClearProduct,
};