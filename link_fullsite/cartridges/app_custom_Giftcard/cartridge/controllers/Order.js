'use strict';

/**
 * @namespace Order
 */

var server = require('server');
server.extend(module.superModule);
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Order-Confirm : This endpoint is invoked when the shopper's Order is Placed and Confirmed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with tlhe order
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.replace(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        //custom code for creation of gift card
        var GiftCertificate = require('dw/order/GiftCertificate');
        var GiftCertificate;
        var GiftCert;
        // var test;
        var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        var Transaction = require('dw/system/Transaction');
        var BasketMgr = require('dw/order/BasketMgr');
        var Basket = BasketMgr.getCurrentBasket();
        var Order = require('dw/order/Order');
        var order;
        
        if (!req.form.orderToken || !req.form.orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        // order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }
        var c=order.productLineItems[0].product.name;
        if (c == 'GiftCard') {
            res.redirect(URLUtils.url('Order-test'))
        }
        var b = GiftCert;

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
        

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        }
        req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
        return next();
    }
);

server.get('new', function (req, res, next) {
        var new_Data = server.forms.getForm('Certificate');

        res.render('GiftCertificate', {
            drx : new_Data

        });
        next();
    });


    server.post('newSubmit', function (req, res, next) {
        var a = req.form;
        var formData = a;

        
        // var Transaction = require('dw/system/Transaction');
        // var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        // var GiftCert;
        // Transaction.wrap(()=>{
        //     GiftCert =  GiftCertificateMgr.createGiftCertificate(1102);
        //     GiftCert.setRecipientEmail(a.email);
        //     GiftCert.setRecipientName(a.email1);
        //     GiftCert.setSenderName(a.email2);
        //     GiftCert.setMessage(a.email3);
        //     GiftCert.setDescription(a.email4);

    

        var ProductList = require('dw/customer/ProductList');
        var ProductListMgr = require('dw/customer/ProductListMgr');
        var Transaction = require('dw/system/Transaction');
        var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        var GiftCert;
        Transaction.wrap(()=>{
            GiftCert =  GiftCertificateMgr.createGiftCertificate(115);
            GiftCert.setRecipientEmail(new_Data.email);
            GiftCert.setRecipientName(new_Data.email1);
            GiftCert.setSenderName(new_Data.email2);
            GiftCert.setMessage(new_Data.email3);
            GiftCert.setDescription(new_Data.desc);
            // GiftCert.getGiftCertificateCode(''); 
            // c=Basket.createGiftCertificatePaymentInstrument(a,M);
        })
        // var new_Data = server.forms.getForm('Certificate').toObject();
        // var Transaction = require('dw/system/Transaction');
        // var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        // var GiftCert;
        // Transaction.wrap(()=>{
        //     GiftCert =  GiftCertificateMgr.createGiftCertificate(1100);
        //     GiftCert.setRecipientEmail(new_Data.email);
        //     GiftCert.setRecipientName(new_Data.email1);
        //     GiftCert.setSenderName(new_Data.email2);
        //     GiftCert.setMessage(new_Data.email3);
        //     GiftCert.setDescription(new_Data.email4);
        //     // GiftCert.getGiftCertificateCode(''); 
        //     // c=Basket.createGiftCertificatePaymentInstrument(a,M);
        // })
        res.json({
            success : "true"
        });
        next();
    });
module.exports = server.exports();
