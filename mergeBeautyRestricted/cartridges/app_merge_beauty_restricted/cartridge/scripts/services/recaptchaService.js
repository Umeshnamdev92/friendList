'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var staticServiceName = require('*/cartridge/static/staticValues/staticServiceName');

var recaptchaService  = LocalServiceRegistry.createService(staticServiceName.recaptchaService , {
    // Service to get response from recaptcha 
    createRequest: function(svc , params){
        svc.setRequestMethod('POST');
        svc.addHeader("Content-Type", "application/x-wwwform-urlencoded");
        svc.addParam("secret", params.secretKey);
        svc.addParam("response", params.token);
        return params;
    },

    parseResponse: function(svc , httpClint){
        var result;
        try
        {
            result = JSON.parse(httpClint.text);
        }
        catch (error)
        {
            result = httpClint.text;
        }
        return result;
    }
});

module.exports = {
    recaptchaService : recaptchaService
}