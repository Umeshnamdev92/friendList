'use strict'
var server = require("server");

var page = require("app_storefront_base/cartridge/controllers/Checkout");
server.extend(page);

var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var Transaction = require("dw/system/Transaction");
var Logger = require("dw/system/Logger");
var URLUtils = require("dw/web/URLUtils");
var ProductList = require('dw/customer/ProductList');
var ProductListMgr = require('dw/customer/ProductListMgr');

var page = require("app_storefront_base/cartridge/controllers/Checkout");
server.extend(page);

server.replace('Begin',function(req,res,next){
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
    var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
    var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
    var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
    var Transaction = require("dw/system/Transaction");
    var Logger = require("dw/system/Logger");
    var URLUtils = require("dw/web/URLUtils");
    var ProductList = require('dw/customer/ProductList');
    var ProductListMgr = require('dw/customer/ProductListMgr');

            var id = req.querystring.id;
            var productlist = [];
            Transaction.wrap(function () {
                var productList = ProductListMgr.getProductLists(customer , 100);
                if(productList.length == 0){
                    var ProductList = ProductListMgr.createProductList(customer, 100)
                    productList = ProductList
                }else
                {
                    productList = productList[0];
                }
                var productList = productList.getItem(id);
                productlist.push(productList);
            
            });
        
    
    res.render('checkout/checkout', {
        id:id,
        productList:productlist,
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
})

module.exports= server.exports()