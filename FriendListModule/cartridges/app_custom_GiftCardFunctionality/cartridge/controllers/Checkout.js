'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
var page = module.superModule; //inherits functionality from next Product.js found to the right on the cartridge path
server.extend(page);
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
        var GiftCardHelper = require('*/cartridge/scripts/helpers/giftCardHelper');
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
        var isOnlyGiftCard = GiftCardHelper.isOnlyGiftCard(orderModel.items.items);

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
            appliedBonusPoint: appliedBonusPoint,
            isOnlyGiftCard: isOnlyGiftCard
        });

        return next();
    }
);

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
    var Resource = require('dw/web/Resource');
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
        msg:Resource.msgf('error.InvalidAppliedAmount', 'giftCard', null, Basket.totalGrossPrice.value),
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
          msg: Resource.msg('error.InvalidRecipient', 'giftCard', null),
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
              msg:Resource.msgf('success.giftRedeemSuccess', 'giftCard', null, giftcertificatedetail.balance.value) ,
              success: true,
            };
            res.json(data);
          }
        } else {
          var data = {
            msg:Resource.msgf('error.giftInsufficientbalance', 'giftCard', null, giftcertificatedetail.balance.value),
            success: false,
          };
          res.json(data);
          return next();
        }
      }
    } catch (error) {
      var data = {
        error: error,
        msg: Resource.msg('error.technicalCatch', 'giftCard', null),
        success: false,
      };
      res.json(data);
    }
    next();
  });
module.exports = server.exports();