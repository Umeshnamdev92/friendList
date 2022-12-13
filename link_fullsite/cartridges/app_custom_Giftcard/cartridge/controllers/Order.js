'use strict';

/**
 * @namespace Order
 */

var server = require('server');
var page = module.superModule;        //inherits functionality from next Product.js found to the right on the cartridge path
server.extend(page);      

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Order-Confirm : This endpoint is invoked when the shopper's Order is Placed and Confirmed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with the order
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

        var order;

        if (!req.form.orderToken || !req.form.orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }

        order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);


        

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

        if (order.allGiftCertificateLineItems.length>0) {
            var Transaction = require('dw/system/Transaction');
            var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
            
            var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
            Transaction.wrap(() =>{
                var giftPl = null;
        collections.forEach(order.allGiftCertificateLineItems, function (element) {
            giftPl =  GiftCertificateMgr.createGiftCertificate(element.price.value);
            giftPl.setRecipientEmail(element.recipientEmail);
            giftPl.setRecipientName(element.recipientName);
            giftPl.setSenderName(element.senderName);
            giftPl.setMessage(element.message);
            giftPl.setDescription(element.custom.note);

        })
        })
        }
        req.session.raw.custom.orderID = req.querystring.ID; //eslint-disable-line no-param-reassign
        return next();
    }
);

server.get('sendMailTemplate',function (req, res, next) {
    var HookMgr = require("dw/system/HookMgr");
    var Mail = require('dw/net/Mail');
    // var Transaction = require('dw/system/Transaction');
    // var Site = require('dw/system/Site');
    // var template=Site.getCurrent().getCustomPreferenceValue("giftCertificateEmailTemplate")
    var templateData = {
        name:
        code:"FSFDHFHDFGSHFHG",
        message:"hello",
        amount: 500.00
    }; 
    var success=null;
    var staticTemplate = `Dear `+templateData.name+`,

    A Gift Certificate has been issued to you in the amount of `+templateData.amount+`
    
    Message:
    
    `+templateData.message+`
    
    You can redeem your gift certificate at our online store.
    
    Your gift certificate code is `+templateData.code+`.
    
    Sincerely,
    
    CustomerSupport`;

    var mail=new Mail();
    mail.addTo("gajendra.dubey@codesquaretech.com");
    mail.setFrom('noreply@us01.dx.commercecloud.salesforce.com');
    mail.setSubject('giftEmailTests');
    mail.setContent(staticTemplate,"text/html","UTF-8");
    var status= mail.send();
    if (status.getMessage()=='OK') {
        success= true;
    }
    else{
        success= false;
    }
 

    // var content=null;
            // content = HookMgr.callHook("createEmailTemplate", "createEmailTemplate",templateData)
            // success = HookMgr.callHook("emailSendHook", "SendMailFunction","gajendra.dubey@codesquaretech.com","noreply@us01.dx.commercecloud.salesforce.com","giftcardEmail","hiiii");
       res.json({
        a:"aaa",
        success:success,
        content:staticTemplate
       })
     next()
});


module.exports = server.exports();
