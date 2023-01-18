'use strict';

/**
 * @namespace CheckoutShippingServices
 */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Handle Ajax shipping form submit
 */
/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @name Base/CheckoutShippingServices-SubmitShipping
 * @function
 * @memberof CheckoutShippingServices
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - shipmentUUID - The universally unique identifier of the shipment
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_shippingMethodID - The selected shipping method id
 * @param {httpparameter} - shipmentSelector - For Guest shopper: A shipment UUID that contains address that matches the selected address, For returning shopper: ab_<address-name-from-address-book>" of the selected address. For both type of shoppers: "new" if a brand new address is entered
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_firstName - shipping address input field, shopper's shipping first name
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_lastName - shipping address input field, shopper's last name
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_address1 - shipping address input field, address line 1
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_address2 - shipping address nput field address line 2
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_country - shipping address input field, country
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_states_stateCode - shipping address input field, state code (Not all locales have state code)
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_city - shipping address input field, city
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_postalCode - shipping address input field, postal code (or zipcode)
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_addressFields_phone - shipping address input field, shopper's phone number
 * @param {httpparameter} - dwfrm_shipping_shippingAddress_giftMessage - text area for gift message
 * @param {httpparameter} - csrf_token - Hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var form = server.forms.getForm('shipping');
        var result = {};

        // verify shipping form data
        var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);

        if (Object.keys(shippingFormErrors).length > 0) {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');

            res.json({
                form: form,
                fieldErrors: [shippingFormErrors],
                serverErrors: [],
                error: true
            });
        } else {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');

            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2.value,
                city: form.shippingAddress.addressFields.city.value,
                postalCode: form.shippingAddress.addressFields.postalCode.value,
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: form.shippingAddress.addressFields.phone.value
            };
            if (Object.prototype.hasOwnProperty
                .call(form.shippingAddress.addressFields, 'states')) {
                result.address.stateCode =
                    form.shippingAddress.addressFields.states.stateCode.value;
            }

            result.shippingBillingSame =
                form.shippingAddress.shippingAddressUseAsBillingAddress.value;

            result.shippingMethod = form.shippingAddress.shippingMethodID.value
                ? form.shippingAddress.shippingMethodID.value.toString()
                : null;

            result.isGift = form.shippingAddress.isGift.checked;

            result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;

            res.setViewData(result);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var Locale = require('dw/util/Locale');

                var shippingData = res.getViewData();

                COHelpers.copyShippingAddressToShipment(
                    shippingData,
                    currentBasket.defaultShipment
                );

                var giftResult = COHelpers.setGift(
                    currentBasket.defaultShipment,
                    shippingData.isGift,
                    shippingData.giftMessage
                );

                if (giftResult.error) {
                    res.json({
                        error: giftResult.error,
                        fieldErrors: [],
                        serverErrors: [giftResult.errorMessage]
                    });
                    return;
                }

                if (!currentBasket.billingAddress) {
                    if (req.currentCustomer.addressBook
                        && req.currentCustomer.addressBook.preferredAddress) {
                        // Copy over preferredAddress (use addressUUID for matching)
                        COHelpers.copyBillingAddressToBasket(
                            req.currentCustomer.addressBook.preferredAddress, currentBasket);
                    } else {
                        // Copy over first shipping address (use shipmentUUID for matching)
                        COHelpers.copyBillingAddressToBasket(
                            currentBasket.defaultShipment.shippingAddress, currentBasket);
                    }
                }
                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                COHelpers.recalculateBasket(currentBasket);

                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
                    currentBasket,
                    {
                        usingMultiShipping: usingMultiShipping,
                        shippable: true,
                        countryCode: currentLocale.country,
                        containerView: 'basket'
                    }
                );

                res.json({
                    customer: new AccountModel(req.currentCustomer),
                    order: basketModel,
                    form: server.forms.getForm('shipping')
                });
            });
        }

        return next();
    }
);


module.exports = server.exports();
