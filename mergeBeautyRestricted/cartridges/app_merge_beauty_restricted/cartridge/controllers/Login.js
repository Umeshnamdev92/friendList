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
 server.replace('Show', consentTracking.consent, server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        var Site = require('dw/system/Site');
        var ArrayList = require('dw/util/ArrayList');
        var target = req.querystring.rurl || 1;

        var siteKey = Site.getCurrent().getPreferences().getCustom()["recaptchaSiteKey"]; // Site key for recaptcha
        var secretKey = Site.getCurrent().getPreferences().getCustom()["recaptchaSecreteKey"]; // Secret Key for recaptcha

        // Prepare ArrayList for dynamic options
        var skintoneAttributes = new ArrayList();
        var skintypeAttributes = new ArrayList();
        var haircolorAttributes = new ArrayList();
        var eyecolorAttributes = new ArrayList();
        var rememberMe = false;
        var userName = '';
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
        var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
        var navTabValue = req.querystring.action;

        if (req.currentCustomer.credentials) {
            rememberMe = true;
            userName = req.currentCustomer.credentials.username;
        }
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ];

        // taking value of beauty attributes from site preference
        var beautyAttributes = Site.current.preferences.getCustom()["BeautyAttributeOptions"];
        var beautyAttributesObj = JSON.parse(beautyAttributes);

        // Adding options in array list
        beautyAttributesObj.skintone.forEach(element => {
            skintoneAttributes.add({ key: element, value: element });
        });
        beautyAttributesObj.skintype.forEach(element => {
            skintypeAttributes.add({ key: element, value: element });
        });
        beautyAttributesObj.haircolor.forEach(element => {
            haircolorAttributes.add({ key: element, value: element });
        });
        beautyAttributesObj.eyecolor.forEach(element => {
            eyecolorAttributes.add({ key: element, value: element });
        });

        // Setting options dynamically in XML Form
        session.forms.profile.customer.skintone.setOptions(skintoneAttributes.iterator());
        session.forms.profile.customer.eyecolor.setOptions(eyecolorAttributes.iterator());
        session.forms.profile.customer.haircolor.setOptions(haircolorAttributes.iterator());
        session.forms.profile.customer.skintype.setOptions(skintypeAttributes.iterator());
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();

        res.render('/account/login', {
            navTabValue: navTabValue || 'login',
            rememberMe: rememberMe,
            userName: userName,
            actionUrl: actionUrl,
            profileForm: profileForm,
            breadcrumbs: breadcrumbs,
            oAuthReentryEndpoint: 1,
            createAccountUrl: createAccountUrl,
            siteKey: siteKey,
            secretKey: secretKey
        });

        next();
    }
);

module.exports = server.exports();