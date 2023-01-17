'use strict';

/**
 * @namespace Login
 */

var server = require('server');
var page = module.superModule;
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Login-Show : This endpoint is called to load the login page
 * @name app_merge_beauty_restricted/Login-Show
 * @function
 * @memberof Login
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - rurl - Redirect URL
 * @param {querystringparameter} - action - Action on submit of Login Form
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Show', consentTracking.consent, server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var beautyHelper = require('*/cartridge/scripts/helpers/beautyPreferenceHelper');
    var responseData = res.getViewData();

    var target = req.querystring.rurl || 1;

    var siteKey = Site.getCurrent().getPreferences().getCustom()["recaptchaSiteKey"]; // Site key for recaptcha
    var secretKey = Site.getCurrent().getPreferences().getCustom()["recaptchaSecreteKey"]; // Secret Key for recaptcha

    beautyHelper.getPreferences(); 
    var profileForm = server.forms.getForm('profile');
    profileForm.clear();
    responseData.siteKey = siteKey;
    responseData.secretKey = secretKey;
    responseData.profileForm = profileForm;

    res.setViewData(responseData);

    next();
}
);


module.exports = server.exports();