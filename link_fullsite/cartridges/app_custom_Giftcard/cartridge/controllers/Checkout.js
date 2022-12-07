'use strict';

/**
 * @namespace Checkout
 */

var server = require('server');
server.extend(module.superModule);
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

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
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var URLUtils = require('dw/web/URLUtils');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var Locale = require('dw/util/Locale');
        var collections = require('*/cartridge/scripts/util/collections');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();
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
            currentBasket,
            {
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
            oAuthReentryEndpoint: 2
        });

        return next();
    }
);

server.get("Applygiftcard1", function (req, res, next) {
    var giftCertificateCode = req.querystring.GiftCardCode;
    var appliedAmount = req.querystring.redeemamount;
    giftCertificateCode=giftCertificateCode.toString();
    var currentCustomer = req.currentCustomer.raw;
    var GiftCertificate = require('dw/order/GiftCertificate');
    var collections = require('*/cartridge/scripts/util/collections')
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
var GiftCertificateStatusCodes = require('dw/order/GiftCertificateStatusCodes');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var PersistentObject = require('dw/object/PersistentObject');
var BasketMgr = require('dw/order/BasketMgr');
var Order = require('dw/order/Order');
var Money = require('dw/value/Money');   
var Basket = BasketMgr.getCurrentBasket();
var currencyCode= req.session.currency.currencyCode
var giftPaymentInstrument=null;
var redeemGiftDetail=null;
try {
    var PriceAdjustment=null;
var realAppliedAmount=null;
var d=GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);
var Money = Money(appliedAmount,currencyCode);
Basket.removeAllPaymentInstruments();
if (Basket.paymentInstruments.length<=1) {
    Transaction.wrap(()=>{
        // var paymentInstrumentAlreadyExist=false;
        // for (let i = 0; i < Basket.paymentInstruments.length; i++) {
        //     if (Basket.paymentInstruments[i].giftCertificateCode==giftCertificateCode) {
        //         paymentInstrumentAlreadyExist=true;
        //     }
        // }
        giftPaymentInstrument=Basket.createGiftCertificatePaymentInstrument(giftCertificateCode,Money);
        redeemGiftDetail=GiftCertificateMgr.redeemGiftCertificate(giftPaymentInstrument);
    })

if (!redeemGiftDetail.error) {
    Transaction.wrap(()=>{
        // var priceAdjustment=Basket.getPriceAdjustmentByPromotionID(giftCertificateCode);
        // Basket.removePriceAdjustment(priceAdjustment);
    realAppliedAmount=giftPaymentInstrument.paymentTransaction.amount.value
    PriceAdjustment = Basket.createPriceAdjustment("giftPriceAdjustment", new dw.campaign.AmountDiscount(realAppliedAmount));
    })
    var data = {
        msg: "Giftcard code redeemed successfully!",
        success: true,
        a:Basket.paymentInstruments.length
    };
    res.json(data);
}
else{
    var data = {
        msg: "insufficient balence!",
        success: false
    };
    res.json(data);
}
}else{
    // var removepaymentinst = Basket.getGiftCertificatePaymentInstruments();
  Basket.removeAllPaymentInstruments();
var data = {
    msg: "all paymentInstrument deleted successfully!",
    success: false,
    length:Basket.paymentInstruments.length
};
res.json(data);
}
    // var SitePreferences = require('dw/system/SitePreferences');
    } catch (error) {
        // var promotionID = currentBasket.getPriceAdjustmentByPromotionID("bonusPointUses")
        var data = {
           error:error,
            msg: " Sorry, Something went wrong Try again!",
            success: false
        };
        res.json(data)
        
    }

    next();
});

server.get("Applygiftcard", function (req, res, next) {
    var giftCertificateCode = req.querystring.GiftCardCode;
    var appliedAmount = req.querystring.redeemamount;
    giftCertificateCode=giftCertificateCode.toString();
    var currentCustomer = req.currentCustomer.raw;
    var GiftCertificate = require('dw/order/GiftCertificate');
    var collections = require('*/cartridge/scripts/util/collections')
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
var GiftCertificateStatusCodes = require('dw/order/GiftCertificateStatusCodes');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var PersistentObject = require('dw/object/PersistentObject');
var BasketMgr = require('dw/order/BasketMgr');
var Order = require('dw/order/Order');
var Money = require('dw/value/Money');   
var Basket = BasketMgr.getCurrentBasket();
var currencyCode= req.session.currency.currencyCode
var giftPaymentInstrument=null;
var redeemGiftDetail=null;
try {
    var PriceAdjustment=null;
var realAppliedAmount=null;
var d=GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);
var Money = Money(appliedAmount,currencyCode);

    Transaction.wrap(()=>{
        // if (Basket.) {
            
        // }
        Basket.removeAllPaymentInstruments();
        giftPaymentInstrument=Basket.createGiftCertificatePaymentInstrument(giftCertificateCode,Money);
        redeemGiftDetail=GiftCertificateMgr.redeemGiftCertificate(giftPaymentInstrument);
    })

if (!redeemGiftDetail.error) {
    // Transaction.wrap(()=>{
    //     var priceAdjustment=Basket.getPriceAdjustmentByPromotionID("giftPriceAdjustment");
    //     if (priceAdjustment!=null) {
            
    //         Basket.removePriceAdjustment(priceAdjustment);
    //     }
    // realAppliedAmount=giftPaymentInstrument.paymentTransaction.amount.value
    // PriceAdjustment = Basket.createPriceAdjustment("giftPriceAdjustment", new dw.campaign.AmountDiscount(realAppliedAmount));
    // })
    var data = {
        msg: "Giftcard code redeemed successfully!",
        success: true,
        a:Basket.paymentInstruments.length
    };
    res.json(data);
}
else{
    var data = {
        msg: "insufficient balence!",
        success: false
    };
    res.json(data);
}

    // var SitePreferences = require('dw/system/SitePreferences');
    } catch (error) {
        // var promotionID = currentBasket.getPriceAdjustmentByPromotionID("bonusPointUses")
        var data = {
           error:error,
            msg: " Sorry, Something went wrong Try again!",
            success: false
        };
        res.json(data)
        
    }

    next();
});

server.get("Removegiftcard",function (req,res,next) {
    var currentCustomer = req.currentCustomer.raw;
    var giftCertificateCode = req.querystring.GiftCardCode;
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var ProductMgr = require('dw/catalog/ProductMgr');
    var PriceAdjustment = require('dw/order/PriceAdjustment');
    var LineItemCtnr = require('dw/order/LineItemCtnr');
    var Transaction = require('dw/system/Transaction');
    var giftcardDetails=GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);
    var promotionID = currentBasket.getPriceAdjustmentByPromotionID("giftPriceAdjustment")
    if (promotionID!=null) {
        var price=promotionID.price.value;
        Transaction.wrap(function () {
            currentBasket.removePriceAdjustment(promotionID);

            currentCustomer.profile.custom.userWallet=currentCustomer.profile.custom.userWallet - price
        })
    }
   
    var presentBonusPoint=currentCustomer.profile.custom.userWallet;
    var data={
        success:true,
        msg:"Bonus Point Removed Successfully",
        currentWallet:presentBonusPoint,
    }
    res.redirect(URLUtils.url('Checkout-Begin'))
//    res.json(data);

next();

})
module.exports = server.exports();
