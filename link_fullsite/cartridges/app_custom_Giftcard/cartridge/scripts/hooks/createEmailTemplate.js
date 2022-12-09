function createEmailTemplate(templateData) {
    var Site = require('dw/system/Site');
    var template=Site.getCurrent().getCustomPreferenceValue("giftCertificateEmailTemplate")
    var staticTemplate = `Dear `+templateData.name+`,

    A Gift Certificate has been issued to you in the amount of `+templateData.amount+`
    
    Message:
    
    `+templateData.message+`
    
    You can redeem your gift certificate at our online store.
    
    Your gift certificate code is `+templateData.code+`.
    
    Sincerely,
    
    CustomerSupport`;
    var result = {
      template:template,
      staticTemplate:staticTemplate
    };
    return result;
 }
 module.exports = {
    createEmailTemplate: createEmailTemplate
 };