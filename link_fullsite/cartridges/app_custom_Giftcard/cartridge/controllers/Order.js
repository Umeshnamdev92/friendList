'use strict';

/**
 * @namespace Order
 */

var server = require('server');
var page = module.superModule; //inherits functionality from next Product.js found to the right on the cartridge path
server.extend(page);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections');
var Mail = require('dw/net/Mail');
/**
 * Order-Confirm : This endpoint is invoked when the shopper's Order is Placed and Confirmed
 * @name mergeBeautyRestricted/Order-Confirm
 * @function
 * @memberof Order
 * @param {category} - sensitive
 * @param {serverfunction} - append
 */
server.append(
    'Confirm',
    function (req, res, next) {
        // var data = res.getViewData();
        var OrderMgr = require('dw/order/OrderMgr');

        var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        if (order.allGiftCertificateLineItems.length > 0) {
            var Transaction = require('dw/system/Transaction');
            var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
            var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
            var mail = new Mail();
            Transaction.wrap(() => {
                var giftPl = null;
                collections.forEach(order.allGiftCertificateLineItems, function (element) {
                    giftPl = GiftCertificateMgr.createGiftCertificate(element.price.value);
                    giftPl.setRecipientEmail(element.recipientEmail);
                    giftPl.setRecipientName(element.recipientName);
                    giftPl.setSenderName(element.senderName);
                    giftPl.setMessage(element.message);
                    giftPl.setDescription(element.custom.note);

                    var giftSendEmail = GiftCertificateMgr.getGiftCertificateByCode(giftPl.giftCertificateCode)
                    var templateData = {
                        name: giftSendEmail.recipientName,
                        code: giftSendEmail.ID,
                        message: giftSendEmail.message,
                        amount: giftSendEmail.amount.value
                    };
                    var success = null;
                    var staticTemplate =`<p>Dear `+templateData.name+`,</p>

                    <p>A Gift Certificate has been issued to you in the amount of `+templateData.amount+`</p>
                    
                    <p>Message:</p>
                    <p>`+templateData.amount+`</p>
                    <p>You can redeem your gift certificate at our online store.</p>
                    <p>Your gift certificate code is `+templateData.code+`</p>
                    <p>Sincerely,</p>
                    <p>CustomerSupport</p>
                    `;
                    mail.addTo(giftSendEmail.recipientEmail);
                    mail.setFrom('noreply@us01.dx.commercecloud.salesforce.com');
                    mail.setSubject('you have received giftCard');
                    mail.setContent(staticTemplate, "text/html", "UTF-8");
                    
                })
                mail.send();
            })
        }
        next();
    }
);



module.exports = server.exports();