"use strict";

/**
 * @namespace Checkout
 */

var server = require("server");
server.extend(module.superModule);
var COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");

/**
 * Main entry point for Checkout
 */

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - stage - a flag indicates the checkout stage
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */

server.get("Applygiftcard", function (req, res, next) {
  var giftCertificateCode = req.querystring.GiftCardCode;
  var appliedAmount = req.querystring.redeemamount;
  var currentCustomer = req.currentCustomer.raw;
  var GiftCertificate = require("dw/order/GiftCertificate");
  var collections = require("*/cartridge/scripts/util/collections");
  var GiftCertificateMgr = require("dw/order/GiftCertificateMgr");
  var Transaction = require("dw/system/Transaction");
  var GiftCertificateLineItem = require("dw/order/GiftCertificateLineItem");
  var GiftCertificateStatusCodes = require("dw/order/GiftCertificateStatusCodes");
  var LineItemCtnr = require("dw/order/LineItemCtnr");
  var PersistentObject = require("dw/object/PersistentObject");
  var BasketMgr = require("dw/order/BasketMgr");
  var Order = require("dw/order/Order");
  var Money = require("dw/value/Money");
  var Basket = BasketMgr.getCurrentBasket();
  var currencyCode = req.session.currency.currencyCode;
  var giftPaymentInstrument = null;
  var redeemGiftDetail = null;

  if (Basket.totalGrossPrice.value < appliedAmount) {
    var data = {
      msg:"Applied Amount Can not greater than " + Basket.totalGrossPrice.value +"!",
      success: false,
    };
    res.json(data);
    return next();
  }
  try {
    var PriceAdjustment = null;
    var realAppliedAmount = null;
    giftCertificateCode = giftCertificateCode.toString();
    var giftcertificatedetail =
      GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);

    if (currentCustomer.profile.email != giftcertificatedetail.recipientEmail) {
      var data = {
        msg: "You are not authorized owner of this gift code!!",
        success: false,
      };
      res.json(data);
      return next();
    } else {
      if (giftcertificatedetail.balance.value >= appliedAmount) {
        var Money = Money(appliedAmount, currencyCode);
        Transaction.wrap(() => {
          Basket.removeAllPaymentInstruments();
          giftPaymentInstrument = Basket.createGiftCertificatePaymentInstrument(
            giftCertificateCode,
            Money
          );
          redeemGiftDetail = GiftCertificateMgr.redeemGiftCertificate(
            giftPaymentInstrument
          );
        });

        if (!redeemGiftDetail.error) {
          giftcertificatedetail =
            GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);

          var data = {
            msg:"Giftcard code redeemed successfully! Now Available balance is $ " + giftcertificatedetail.balance.value,
            success: true,
            a: Basket.paymentInstruments.length,
          };
          res.json(data);
        }
      } else {
        var data = {
          msg:"insufficient balence! your available balence is" +giftcertificatedetail.balance.value,
          success: false,
        };
        res.json(data);
        return next();
      }
    }
  } catch (error) {
    var data = {
      error: error,
      msg: " Sorry, Something went wrong Try again!",
      success: false,
    };
    res.json(data);
  }
  next();
});

server.get("Removegiftcard", function (req, res, next) {
  var currentCustomer = req.currentCustomer.raw;
  var giftCertificateCode = req.querystring.GiftCardCode;
  var BasketMgr = require("dw/order/BasketMgr");
  var currentBasket = BasketMgr.getCurrentBasket();
  var ProductMgr = require("dw/catalog/ProductMgr");
  var PriceAdjustment = require("dw/order/PriceAdjustment");
  var LineItemCtnr = require("dw/order/LineItemCtnr");
  var Transaction = require("dw/system/Transaction");
  var giftcardDetails =
    GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);
  var promotionID = currentBasket.getPriceAdjustmentByPromotionID(
    "giftPriceAdjustment"
  );
  if (promotionID != null) {
    var price = promotionID.price.value;
    Transaction.wrap(function () {
      currentBasket.removePriceAdjustment(promotionID);

      currentCustomer.profile.custom.userWallet =
        currentCustomer.profile.custom.userWallet - price;
    });
  }

  var presentBonusPoint = currentCustomer.profile.custom.userWallet;
  var data = {
    success: true,
    msg: "Bonus Point Removed Successfully",
    currentWallet: presentBonusPoint,
  };
  res.redirect(URLUtils.url("Checkout-Begin"));
  //    res.json(data);

  next();
});
module.exports = server.exports();
