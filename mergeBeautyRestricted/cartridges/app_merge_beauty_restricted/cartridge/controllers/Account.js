'use strict';

/**
 * @namespace Account
 */

// Extending the Controller
var server = require('server');
var page = module.superModule;
server.extend(page);

// Requiring APIs
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Logger = require('dw/system/Logger');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

/**
 * Account-SubmitRegistration : The Account-SubmitRegistration endpoint is the endpoint that gets hit when a shopper submits their registration for a new account
 * @name app_merge_beauty_restricted/Account-SubmitRegistration
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - rurl - redirect url. The value of this is a number. This number then gets mapped to an endpoint set up in oAuthRenentryRedirectEndpoints.js
 * @param {httpparameter} - dwfrm_profile_customer_firstname - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_profile_customer_lastname - Input field for the shopper's last name
 * @param {httpparameter} - dwfrm_profile_customer_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_profile_customer_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_customer_emailconfirm - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_login_password - Input field for the shopper's password
 * @param {httpparameter} - dwfrm_profile_login_passwordconfirm: - Input field for the shopper's password to confirm
 * @param {httpparameter} - dwfrm_profile_customer_addtoemaillist - Checkbox for whether or not a shopper wants to be added to the mailing list
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
 server.replace('SubmitRegistration', server.middleware.https, csrfProtection.validateAjaxRequest , function (req, res, next) {
    const CustomerMgr = require('dw/customer/CustomerMgr');
    const Resource = require('dw/web/Resource');
    const formErrors = require('*/cartridge/scripts/formErrors');
    const recaptchaHelper = require('*/cartridge/scripts/helpers/recaptchaHelper');

    var registrationForm = server.forms.getForm('profile');
    var myForm = req.form;
    if(myForm.recaptchToken)
    {
        var recaptchaResult = recaptchaHelper.verifyRecaptcha(myForm.recaptchToken);
        if(!recaptchaResult.success)
        {
            res.json({success: false, message: 'You are a boat !' , error: true});
            next();
        }
        else
        {
            if (registrationForm.customer.email.value.toLowerCase()
            !== registrationForm.customer.emailconfirm.value.toLowerCase()
        ) {
            registrationForm.customer.email.valid = false;
            registrationForm.customer.emailconfirm.valid = false;
            registrationForm.customer.emailconfirm.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
            registrationForm.valid = false;
        }

        // Date validation if birthday will be greater than current date
        if ((new Date(registrationForm.customer.date.value) > (new Date()))) {
            registrationForm.customer.date.error =
                Resource.msg('error.message.date.inavlid', 'forms', null);
            registrationForm.valid = false;
        }

        if (registrationForm.login.password.value
            !== registrationForm.login.passwordconfirm.value
        ) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.mismatch.password', 'forms', null);
            registrationForm.valid = false;
        }

        if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
            registrationForm.valid = false;
        }

        // Prepare beauty attributes object for setting in profile
        var beautyFieldObj = {
            eyecolor: registrationForm.customer.eyecolor.value,
            haircolor: registrationForm.customer.haircolor.value,
            skintone: registrationForm.customer.skintone.value,
            skintype: registrationForm.customer.skintype.value,
        };

        // setting variables for the BeforeComplete function
        var registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            phone: registrationForm.customer.phone.value,
            email: registrationForm.customer.email.value,
            emailConfirm: registrationForm.customer.emailconfirm.value,
            password: registrationForm.login.password.value,
            passwordConfirm: registrationForm.login.passwordconfirm.value,
            validForm: registrationForm.valid,
            date: registrationForm.customer.date.value,
            beautyFieldObj: !empty(beautyFieldObj) ? beautyFieldObj : null, // setting beauty attributes
            form: registrationForm
        };
        if (registrationForm.valid) {
            res.setViewData(registrationFormObj);
            this.on('route:BeforeComplete', function (req, res) {
                var Transaction = require('dw/system/Transaction');
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var authenticatedCustomer;
                var serverError;
                // getting variables for the BeforeComplete function
                var registrationForm = res.getViewData();
                if (registrationForm.validForm) {
                    var login = registrationForm.email;
                    var password = registrationForm.password;
                    // attempt to create a new user and log that user in.
                    try {
                        var age = Math.floor((new Date() - new Date(registrationForm.date.toString()).getTime()) / 3.15576e+10)
                        Transaction.wrap(function () {
                            var error = {};
                            var newCustomer = CustomerMgr.createCustomer(login, password);
                            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                                error = { authError: true, status: authenticateCustomerResult.status };
                                throw error;
                            }
                            authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);
                            if (!authenticatedCustomer) {
                                error = { authError: true, status: authenticateCustomerResult.status };
                                throw error;
                            } else {
                                // assign values to the profile
                                var newCustomerProfile = newCustomer.getProfile();
                                newCustomerProfile.birthday = new Date(registrationForm.date.toString());
                                newCustomerProfile.firstName = registrationForm.firstName;
                                newCustomerProfile.lastName = registrationForm.lastName;
                                newCustomerProfile.phoneHome = registrationForm.phone;
                                newCustomerProfile.email = registrationForm.email;
                                newCustomerProfile.custom.customerEyeColor = registrationForm.beautyFieldObj.eyecolor;
                                newCustomerProfile.custom.customerSkinTone = registrationForm.beautyFieldObj.skintone;
                                newCustomerProfile.custom.customerSkinType = registrationForm.beautyFieldObj.skintype;
                                newCustomerProfile.custom.customerHairColor = registrationForm.beautyFieldObj.haircolor;
                            }
                        });
                    } catch (e) {
                        Logger.debug(e);
                        if (e.authError) {
                            serverError = true;
                        } else {
                            registrationForm.validForm = false;
                            registrationForm.form.customer.email.valid = false;
                            registrationForm.form.customer.emailconfirm.valid = false;
                            registrationForm.form.customer.email.error =
                            Resource.msg('error.message.username.invalid', 'forms', null);
                        }
                    }
                }
                delete registrationForm.password;
                delete registrationForm.passwordConfirm;
                formErrors.removeFormValues(registrationForm.form);
                if (serverError) {
                    res.setStatusCode(500);
                    res.json({
                        success: false,
                        errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
                    });

                    return;
                }
                if (registrationForm.validForm) {
                    // send a registration email
                    accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);
                    res.setViewData({ authenticatedCustomer: authenticatedCustomer });
                    res.json({
                        success: true,
                        redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
                    });
                    req.session.privacyCache.set('args', null);
                } else {
                    res.json({
                        fields: formErrors.getFormErrors(registrationForm)
                    });
                }
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(registrationForm)
            });
        }
        return next();
        }
    }
}
);

/**
 * Account-EditProfile : The Account-EditProfile endpoint renders the page that allows a shopper to edit their profile. The edit profile form is prefilled with the shopper's first name, last name, phone number and email
 * @name app_merge_beauty_restricted/Account-EditProfile
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append(
    "EditProfile",
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
      var data = res.getViewData();
      var Site = require("dw/system/Site");
      var beautyHelper = require('*/cartridge/scripts/helpers/beautyPreferenceHelper');
      beautyHelper.getPreferences();
      // taking value of beauty attributes from site preference
      var isBeautyFieldsEditable = Site.current.preferences.getCustom()["isBeautyFeildsEnable"];
      var profile = req.currentCustomer.raw.profile;
      var profileForm = server.forms.getForm("profile");
      profileForm.clear();
  
      // Setting form values for prepopulate
      profileForm.customer.firstname.value = profile.firstName;
      profileForm.customer.lastname.value = profile.lastName;
      profileForm.customer.phone.value = profile.phoneHome;
      profileForm.customer.email.value = profile.email;
      profileForm.customer.skintype.value = profile.custom.customerSkinType;
      profileForm.customer.skintone.value = profile.custom.customerSkinTone;
      profileForm.customer.eyecolor.value = profile.custom.customerEyeColor;
      profileForm.customer.haircolor.value = profile.custom.customerHairColor;
      data.profileForm = profileForm;
      data.isBeautyFieldsEditable = isBeautyFieldsEditable;
      res.setViewData(data);
      next();
    }
  );

/**
 * Account-SaveProfile : The Account-SaveProfile endpoint is the endpoint that gets hit when a shopper has edited their profile
 * @name app_merge_beauty_restricted/Account-SaveProfile
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - dwfrm_profile_customer_firstname - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_profile_customer_lastname - Input field for the shopper's last name
 * @param {httpparameter} - dwfrm_profile_customer_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_profile_customer_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_customer_emailconfirm - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_login_password  - Input field for the shopper's password
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensititve
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.append("SaveProfile", function (req, res, next) {
    var Transaction = require("dw/system/Transaction");
    var CustomerMgr = require("dw/customer/CustomerMgr");
    var Resource = require("dw/web/Resource");
    var URLUtils = require("dw/web/URLUtils");
    var accountHelpers = require("*/cartridge/scripts/helpers/accountHelpers");
    var formErrors = require("*/cartridge/scripts/formErrors");
    var profileForm = server.forms.getForm("profile");
    var Site = require("dw/system/Site");

    var responseData = res.getViewData();
    if (responseData.success != false) {
      // Booleant site preference value for checking beauty fields are editable or not
      var isBeautyFieldsEditable = Site.current.preferences.getCustom()["isBeautyFeildsEnable"];

      // Beauty Profile attributes
      if (isBeautyFieldsEditable) {
        var profileUpdate = responseData.profileForm.customer;
        Transaction.wrap(function () {
          var profile = customer.getProfile();
          if (profileUpdate.eyecolor) {
            profile.custom.customerEyeColor = profileUpdate.eyecolor.htmlValue;
          }
          if (profileUpdate.haircolor) {
            profile.custom.customerHairColor = profileUpdate.haircolor.htmlValue;
          }
          if (profileUpdate.skintype) {
            profile.custom.customerSkinType = profileUpdate.skintype.htmlValue;
          }
          if (profileUpdate.skintone) {
            profile.custom.customerSkinTone = profileUpdate.skintone.htmlValue;
          }
        });
        res.setViewData(responseData);
      }
    } else {
      res.setViewData(responseData);
  
    }
  
    return next();
  });
  



module.exports = server.exports();