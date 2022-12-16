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
 server.append('EditProfile', server.middleware.https, csrfProtection.generateToken, userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
        var data = res.getViewData();
        var ArrayList = require('dw/util/ArrayList');
        var Site = require('dw/system/Site');
        var Site = require('dw/system/Site');
        // taking value of beauty attributes from site preference
        var isBeautyFieldsEditable = Site.current.preferences.getCustom()["isBeautyFeildsEnable"];

        // Arraylist for updating options in XML Form
        var skintoneAttributes = new ArrayList();
        var skintypeAttributes = new ArrayList();
        var haircolorAttributes = new ArrayList();
        var eyecolorAttributes = new ArrayList();

        // Dyanamic Beauty attributes by Site preference
        var beautyAttributes = Site.current.preferences.getCustom()["BeautyAttributeOptions"];
        var beautyAttributesObj = JSON.parse(beautyAttributes);

        // Prepare array List for dynamic options
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

        // Setting optons dynamically in form
        session.forms.profile.customer.skintone.setOptions(skintoneAttributes.iterator());
        session.forms.profile.customer.eyecolor.setOptions(eyecolorAttributes.iterator());
        session.forms.profile.customer.haircolor.setOptions(haircolorAttributes.iterator());
        session.forms.profile.customer.skintype.setOptions(skintypeAttributes.iterator());

        var profile = req.currentCustomer.raw.profile;
        var profileForm = server.forms.getForm('profile');
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
 server.replace(
    'SaveProfile',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var profileForm = server.forms.getForm('profile');
        var Site = require('dw/system/Site');

        // Booleant site preference value for checking beauty fields are editable or not
        var isBeautyFieldsEditable = Site.current.preferences.getCustom()["isBeautyFeildsEnable"];
        // form validation
        if (profileForm.customer.email.value.toLowerCase()
            !== profileForm.customer.emailconfirm.value.toLowerCase()) {
            profileForm.valid = false;
            profileForm.customer.email.valid = false;
            profileForm.customer.emailconfirm.valid = false;
            profileForm.customer.emailconfirm.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
        }

        var result = {
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phone.value,
            email: profileForm.customer.email.value,
            confirmEmail: profileForm.customer.emailconfirm.value,
            password: profileForm.login.password.value,
            profileForm: profileForm
        };

        // Beauty Profile attributes
        if (isBeautyFieldsEditable) {
            result.skintone = profileForm.customer.skintone.value,
            result.skintype = profileForm.customer.skintype.value,
            result.eyecolor = profileForm.customer.eyecolor.value,
            result.haircolor = profileForm.customer.haircolor.value
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();
                var customerLogin;
                var status;

                Transaction.wrap(function () {
                    status = profile.credentials.setPassword(
                        formInfo.password,
                        formInfo.password,
                        true
                    );

                    if (status.error) {
                        formInfo.profileForm.login.password.valid = false;
                        formInfo.profileForm.login.password.error =
                            Resource.msg('error.message.currentpasswordnomatch', 'forms', null);
                    } else {
                        customerLogin = profile.credentials.setLogin(
                            formInfo.email,
                            formInfo.password
                        );
                    }
                });

                delete formInfo.password;
                delete formInfo.confirmEmail;

                if (customerLogin) {
                    Transaction.wrap(function () {
                        profile.setFirstName(formInfo.firstName);
                        profile.setLastName(formInfo.lastName);
                        profile.setEmail(formInfo.email);
                        profile.setPhoneHome(formInfo.phone);

                        // Setting beauty attributes
                        if (isBeautyFieldsEditable) {
                            profile.custom.customerSkinTone = formInfo.skintone;
                            profile.custom.customerEyeColor = formInfo.eyecolor;
                            profile.custom.customerSkinType = formInfo.skintype;
                            profile.custom.customerHairColor = formInfo.haircolor;
                        }
                    });

                    // Send account edited email
                    accountHelpers.sendAccountEditedEmail(customer.profile);

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                } else {
                    if (!status.error) {
                        formInfo.profileForm.customer.email.valid = false;
                        formInfo.profileForm.customer.email.error =
                            Resource.msg('error.message.username.invalid', 'forms', null);
                    }

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);



module.exports = server.exports();