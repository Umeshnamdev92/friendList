
'use strict';

// Function to verify Captcha
function verifyRecaptcha(token) {
    var result = {
        success: false
    };

    if (token) {
        var Site = require('dw/system/Site');
        // Getting Site preference value of 'recaptchaSecreteKey' for secret key
        var secretKey = Site.current.preferences.getCustom()["recaptchaSecreteKey"];
        var recaptchaMiniScore = 0.5;
        var params = {
            secretKey: secretKey,
            token: token
        };
        // Calling service to verify captcha by comparing mini-score
        var recaptchaService = require("*/cartridge/scripts/services/recaptchaService");
        var recaptchaServiceResult = recaptchaService.recaptchaService.call(params);
        if (recaptchaServiceResult.object) {
            result = recaptchaServiceResult.object;
            if (recaptchaServiceResult.object.score < recaptchaMiniScore) {
                result.success = false;
            }
            else
            {
                result.success = true;
            }
        }
        else
        {
            result.success = false;
        }


        if (recaptchaServiceResult.error == 503 || recaptchaServiceResult.error== 404 && empty(recaptchaServiceResult.object)) {
            result.success = false;
        }
    }

    return result;
}

module.exports = {
    verifyRecaptcha: verifyRecaptcha
};