

'use strict';
/**
 * @namespace Login
 */

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections')
server.get(
    'Show',
    function (req, res, next) {
        var GiftCertificate = require('dw/order/GiftCertificate');
        var GiftCertificate;
        var test;
        var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var GiftCertificateLineItem = require('dw/order/GiftCertificateLineItem');
var GiftCertificateStatusCodes = require('dw/order/GiftCertificateStatusCodes');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var PersistentObject = require('dw/object/PersistentObject');
var BasketMgr = require('dw/order/BasketMgr');
var Basket = BasketMgr.getCurrentBasket();
var Order = require('dw/order/Order');
var GiftCert;
var Logger = require('dw/system/Logger');
var a;
var b;
var c;
var d;
var Money = require('dw/value/Money');
var M = Money(100,"USD");
// Transaction.wrap(()=>{
//     GiftCert =  GiftCertificateMgr.createGiftCertificate(600);
//     GiftCert.setRecipientEmail('amber.dube@codesquaretech.com');
//     GiftCert.setRecipientName('takkar'); 
//     GiftCert.setSenderName('amber');
//     GiftCert.setMessage('hey');
//     GiftCert.setDescription('dwadwadwa');
//     // GiftCert.getGiftCertificateCode(''); 
//     // c=Basket.createGiftCertificatePaymentInstrument(a,M);
// })
//  a=GiftCert.getGiftCertificateCode();
  a='VHOPRHTYKKGDAMSV';
Transaction.wrap(()=>{
    // GiftCert.getGiftCertificateCode(''); 
    c=Basket.createGiftCertificatePaymentInstrument(a,M);
    d=GiftCertificateMgr.redeemGiftCertificate(c);
})


// var removepaymentinst = Basket.getGiftCertificatePaymentInstruments();
// collections.forEach(removepaymentinst,(element) => {
//     Basket.removePaymentInstrument(element);
// });


b=GiftCertificateMgr.getGiftCertificateByCode(a);
Logger.debug('wdaw',b);
// c=Basket.createGiftCertificatePaymentInstrument(a,502);
        res.json({GiftCertificate:"GiftCertificate",test:test,a:a,b:b,c:c,d:d});
        next();
    }
);

server.get('sendMailTemplate',function (req, res, next) {
    var HookMgr = require("dw/system/HookMgr");
    var templateData = {
        name:"gajendra",
        code:"asdggfsdghds",
        message:"hello",
        amount: 500.00
    };
    var content = HookMgr.callHook("createEmailTemplate", "createEmailTemplate",templateData)
    var success = HookMgr.callHook("emailSendHook", "SendMailFunction","gajendra.dubey@codesquaretech.com","noreply@us01.dx.commercecloud.salesforce.com","subject",content.staticTemplate);
      
       res.json({
        success:success,
        content:content
       })
     next()
});
module.exports = server.exports();