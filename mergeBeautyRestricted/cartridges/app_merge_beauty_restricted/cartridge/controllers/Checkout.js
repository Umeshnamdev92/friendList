'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
var cache = require("*/cartridge/scripts/middleware/cache");
server.extend(module.superModule)
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require("dw/system/Transaction");

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
server.replace(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    cache.applyDefaultCache,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');

        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var Locale = require('dw/util/Locale');
        var collections = require('*/cartridge/scripts/util/collections');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();

        var data = res.getViewData();
        var Site = require("dw/system/Site");
        var selectedAddress = req.querystring.selectedAddress;
        var mySitePrefValue =
          Site.getCurrent().getCustomPreferenceValue("addressType");
        var addresstypes = JSON.parse(mySitePrefValue);
        data.addresstypes = addresstypes;
        data.selectedAddress = selectedAddress
        res.setViewData(data);

        if (!currentBasket) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var requestStage = req.querystring.stage;
        var currentStage = requestStage || 'customer';
        var billingAddress = currentBasket.billingAddress;

        var currentCustomer = req.currentCustomer.raw;
        var currentLocale = Locale.getLocale(req.locale.id);
        var preferredAddress;

        // only true if customer is registered
        if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            var shipments = currentBasket.shipments;
            preferredAddress = req.currentCustomer.addressBook.preferredAddress;

            collections.forEach(shipments, function (shipment) {
                if (!shipment.shippingAddress) {
                    COHelpers.copyCustomerAddressToShipment(preferredAddress, shipment);
                }
            });

            if (!billingAddress) {
                COHelpers.copyCustomerAddressToBilling(preferredAddress);
            }
        }

        // Calculate the basket
        Transaction.wrap(function () {
            COHelpers.ensureNoEmptyShipments(req);
        });

        var currentWallet = 0;
        try {
            currentWallet = currentCustomer.profile.custom.userWallet
        } catch (error) {
            currentWallet = 0
        }
        var showLine = false;
        var appliedBonusPoint=null;
        var promotionID = currentBasket.getPriceAdjustmentByPromotionID("bonusPointUses")
        if (promotionID != null) {
            showLine = true;
            appliedBonusPoint = (-promotionID.price.value);

        }
        if (currentBasket.shipments.length <= 1) {
            req.session.privacyCache.set('usingMultiShipping', false);
        }

        if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
            Transaction.wrap(function () {
                currentBasket.updateCurrency();
            });
        }
        COHelpers.recalculateBasket(currentBasket);

        var guestCustomerForm = COHelpers.prepareCustomerForm('coCustomer');
        var registeredCustomerForm = COHelpers.prepareCustomerForm('coRegisteredCustomer');
        var shippingForm = COHelpers.prepareShippingForm();
        var billingForm = COHelpers.prepareBillingForm();
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

        if (preferredAddress) {
            shippingForm.copyFrom(preferredAddress);
            billingForm.copyFrom(preferredAddress);
        }

        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);

        var orderModel = new OrderModel(
            currentBasket, {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );

        // Get rid of this from top-level ... should be part of OrderModel???
        var currentYear = new Date().getFullYear();
        var creditCardExpirationYears = [];

        for (var j = 0; j < 10; j++) {
            creditCardExpirationYears.push(currentYear + j);
        }

        var accountModel = new AccountModel(req.currentCustomer);

        var reportingURLs;
        reportingURLs = reportingUrlsHelper.getCheckoutReportingURLs(
            currentBasket.UUID,
            2,
            'Shipping'
        );

        if (currentStage === 'customer') {
            if (accountModel.registeredUser) {
                // Since the shopper already login upon starting checkout, fast forward to shipping stage
                currentStage = 'shipping';

                // Only need to update email address in basket if start checkout from other page like cart or mini-cart
                // and not on checkout page reload.
                if (!requestStage) {
                    Transaction.wrap(function () {
                        currentBasket.customerEmail = accountModel.profile.email;
                        orderModel.orderEmail = accountModel.profile.email;
                    });
                }
            } else if (currentBasket.customerEmail) {
                // Email address has already collected so fast forward to shipping stage
                currentStage = 'shipping';
            }
        }

        res.render('checkout/checkout', {
            order: orderModel,
            customer: accountModel,
            forms: {
                guestCustomerForm: guestCustomerForm,
                registeredCustomerForm: registeredCustomerForm,
                shippingForm: shippingForm,
                billingForm: billingForm
            },
            expirationYears: creditCardExpirationYears,
            currentStage: currentStage,
            reportingURLs: reportingURLs,
            oAuthReentryEndpoint: 2,
            showLine: showLine,
            currentWallet: currentWallet,
            appliedBonusPoint: appliedBonusPoint
        });

        return next();
    }
);

server.get("selectSingleAddress", (req, res, next) => {
  var AddressModel = require("*/cartridge/models/address");
  var selectedAddress = req.querystring.selectedAddress;
  var currentCustomer = req.currentCustomer;
  var result = [];
  if (currentCustomer.addressBook) {
    for (var i = 0, ii = currentCustomer.addressBook.addresses.length; i < ii; i++) {
      var tempAddress = new AddressModel(currentCustomer.addressBook.addresses[i]).address;
      if (tempAddress.title == selectedAddress) {
        result.push(tempAddress);

      }
    }
  }
  res.json(result);
  next();
});


/**
 * Checkout-UpdateBonus :This is the method to update Bonus via productLine Item
 * @name Checkout-UpdateBonus
 * @function
 * @memberof Checkout
 * @param {serverfunction} - post
 */

server.post("UpdateBonus", function (req, res, next) {
    var bPoint = req.form.bonusPoint;
    var currentCustomer = req.currentCustomer.raw;
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    // bonusPercentOfTotal is a custom preference which shows how many percent customer wants to give discount on base.
    var bonusPercentOfTotal = dw.system.Site.current.preferences.custom.bonusPercentOfTotal
    var LineItemCtnr = require('dw/order/LineItemCtnr');
    var totalNetPrice = currentBasket.totalNetPrice.value;
    var toPercent = totalNetPrice * (bonusPercentOfTotal / 100);

    if (currentCustomer.profile.custom.userWallet < bPoint || currentCustomer.profile.custom.userWallet==0) {
        var data = {
            appliedPoint: bPoint,
            msg: "Applied bonus cannot be greater than wallet bonus",
            success: false
        };

        res.json(data);
        return next();
    }
    if (Number(bPoint) > toPercent) {
        var data = {
            appliedPoint: bPoint,
            msg: "Applied Bonus Point cannot be greater the " + bonusPercentOfTotal + " % of total",
            success: false
        };
        res.json(data)
        return next();
    }

    try {
        Transaction.wrap(function () {
            //from the current basket creating price adjustment  with promotion ID statically passing as :bonusPointUses
            var PriceAdjustment = currentBasket.createPriceAdjustment("bonusPointUses", new dw.campaign.AmountDiscount(bPoint));
            currentCustomer.profile.custom.userWallet = currentCustomer.profile.custom.userWallet - Number(bPoint);
            //   var promotionID = currentBasket.getPriceAdjustmentByPromotionID("bonusPointUses")
            //     Transaction.wrap(function () {
            //         promotionID.taxRate-=taxRate;
            //     });

            var nowPoint = currentCustomer.profile.custom.userWallet;
            var data = {
                appliedPoint: bPoint,
                nowPoint: nowPoint,
                msg: "Bonus Point applied successfully",
                success: true
            };
            
            res.json(data)
        })

    } catch (error) {
        //for already bonus getting price adjustment bonusPointUses
        var promotionID = currentBasket.getPriceAdjustmentByPromotionID("bonusPointUses")
        var data = {
            appliedPoint: bPoint,
            promotionID: JSON.stringify(promotionID),
            msg: " Sorry, You have already applied bonus points",
            success: false
        };
        res.json(data)
        return next();
    }

    next();
});


/**
 * Checkout-removeBonus :Method to remove Bonus applied bonus, control comes via ajax here.
 * @name Checkout-removeBonus
 * @function
 * @memberof Checkout
 * @param {serverfunction} - get
 */
server.get("removeBonus", function (req, res, next) {
    var currentCustomer = req.currentCustomer.raw;
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var ProductMgr = require('dw/catalog/ProductMgr');
    var PriceAdjustment = require('dw/order/PriceAdjustment');
    var LineItemCtnr = require('dw/order/LineItemCtnr');
    var Transaction = require('dw/system/Transaction');
    //Via price adjustment getting promotion via Statically passing PromotionID

    var promotionID = currentBasket.getPriceAdjustmentByPromotionID("bonusPointUses")

    //if promotionID exists then removing and updating its value.
    if (promotionID != null) {
        var price = promotionID.price.value;
        Transaction.wrap(function () {
            currentBasket.removePriceAdjustment(promotionID);
            currentCustomer.profile.custom.userWallet = currentCustomer.profile.custom.userWallet - price
        })
    }

    var presentBonusPoint = currentCustomer.profile.custom.userWallet;
    var data = {
        success: true,
        msg: "Bonus Point Removed Successfully",
        currentWallet: presentBonusPoint,
    }   
    res.redirect(URLUtils.url('Checkout-Begin'))

    next();

})
/**
 * Checkout-Applygiftcard :Method to Apply giftcard,control comes via ajax here.
 * @name Checkout-Applygiftcard
 * @function
 * @memberof Checkout
 * @param {serverfunction} - get
 */
server.get("Applygiftcard", function (req, res, next) {
    var giftCertificateCode = req.querystring.GiftCardCode;
    var appliedAmount = req.querystring.redeemamount;
    var currentCustomer = req.currentCustomer.raw;
    var GiftCertificate = require("dw/order/GiftCertificate");
    var collections = require("*/cartridge/scripts/util/collections");
    var GiftCertificateMgr = require("dw/order/GiftCertificateMgr");
    var GiftCertificateLineItem = require("dw/order/GiftCertificateLineItem");
    var GiftCertificateStatusCodes = require("dw/order/GiftCertificateStatusCodes");
    var LineItemCtnr = require("dw/order/LineItemCtnr");
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
module.exports = server.exports();