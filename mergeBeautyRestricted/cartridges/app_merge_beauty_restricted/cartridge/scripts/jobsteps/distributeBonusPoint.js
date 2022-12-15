"use strict";
function distributeBonusPoint() {
  var OrderMgr = require("dw/order/OrderMgr");
  var OrderHistory = require("dw/customer/OrderHistory");
  var CustomerMgr = require("dw/customer/CustomerMgr");
  var Site = require("dw/system/Site");
  var Logger = require("dw/system/Logger");
  var bonusLogger = Logger.getLogger("bonus", "bonus");
  try {
    var allOrders = OrderMgr.queryOrders("UUID!=null", null);

    while (allOrders.hasNext()) {
      var Order = allOrders.next();
      if (Order.customer.registered && Order.shippingStatus.value == 2) {
        if (!Order.custom.bonusPointDistributed) {
          var Subtotal = Order.merchandizeTotalPrice.value;
          var bonusPoint = 0.0;
          var bonuPointMultiplier =
            Site.getCurrent().getCustomPreferenceValue(
              "userBonusPointPercent"
            ) / 100;
          var minimumEligibleOrderAmount =
            Site.getCurrent().getCustomPreferenceValue(
              "MinimumOrderPriceForBonusPoint"
            );
          if (minimumEligibleOrderAmount <= Subtotal) {
            bonusPoint = bonuPointMultiplier * Subtotal;
          }
          if (parseInt(Order.customer.profile.custom.userWallet) != NaN) {
            Order.customer.profile.custom.userWallet += Number(
              bonusPoint.toFixed(2)
            );
          } else {
            Order.customer.profile.custom.userWallet = Number(
              bonusPoint.toFixed(2)
            );
          }
          Order.custom.bonusPointDistributed = true;
          bonusLogger.info(
            Order.customer.profile.firstName +
              "get bonus" +
              Number(bonusPoint.toFixed(2))
          );
        }
      }
      bonusLogger.info("not registered and not shipped order--" + Order.orderNo);
    }
  } catch (error) {
    bonusLogger.error("distribution is failed due to--" + error);
  }
}

module.exports = { distributeBonusPoint: distributeBonusPoint };
