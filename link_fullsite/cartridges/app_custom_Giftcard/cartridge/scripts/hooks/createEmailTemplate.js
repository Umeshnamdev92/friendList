function createEmailTemplate(templateData) {
    var Site = require('dw/system/Site');
    var template=Site.getCurrent().getCustomPreferenceValue("giftCertificateEmailTemplate")
    return 
 }
 module.exports = {
    createEmailTemplate: createEmailTemplate
 };