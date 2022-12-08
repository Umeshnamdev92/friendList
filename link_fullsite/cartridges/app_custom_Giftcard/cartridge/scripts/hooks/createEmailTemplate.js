function createEmailTemplate(templateData) {
    var Site = require('dw/system/Site');
    var template=Site.getCurrent().getCustomPreferenceValue("giftCertificateEmailTemplate")
    
 }
 module.exports = {
    createEmailTemplate: createEmailTemplate
 };