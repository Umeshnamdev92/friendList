'use strict';

var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');

// Ajax for Register form based on recaptcha token
function registerAjax(form){
    var url = form.attr('action');
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: form.serialize(),
        success: function (data) {
            form.spinner().stop();
            if (data.success == false && data.error == true) {
                createErrorNotification($('.error-messaging'), data.message)
            }
            else
            {
                if (!data.success) {
                    $('form.registration').trigger('login:register:error', data);
                    formValidation(form, data);
                } else {
                    $('form.registration').trigger('login:register:success', data);
                    location.href = data.redirectUrl;
                }
            }
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            } else {
                createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
            }

            form.spinner().stop();
        }
    });
}

module.exports = {
    login: function () {
        $('form.login').submit(function (e) {
            var form = $(this);
            e.preventDefault();
            var url = form.attr('action');
            form.spinner().start();
            $('form.login').trigger('login:submit', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                        $('form.login').trigger('login:error', data);
                    } else {
                        $('form.login').trigger('login:success', data);
                        location.href = data.redirectUrl;
                    }
                },
                error: function (data) {
                    if (data.responseJSON.redirectUrl) {
                        window.location.href = data.responseJSON.redirectUrl;
                    } else {
                        $('form.login').trigger('login:error', data);
                        form.spinner().stop();
                    }
                }
            });
            return false;
        });
    },

    register: function () {
        $('form.registration').submit(function (e) {
            e.preventDefault();
            var form = $(this);
            form.spinner().start();
            $('form.registration').trigger('login:register', e);
            if(typeof window.grecaptcha === 'undefined') // checking for recaptcha exists ?
            {
                registerAjax(form);
            }
            else
            {
                var SiteKey = $('#site-key').val();
                if(SiteKey)
                {
                    window.grecaptcha.ready(function() {
                        window.grecaptcha.execute(SiteKey, {action:"contactUs"}).then(function(token){
                            form.find("#captcha-token").val(token)
                            registerAjax(form);
                        });
                    });
                }
                else
                {
                    registerAjax(form);
                }
            }
            return false;
        });
    },

    resetPassword: function () {
        $('.reset-password-form').submit(function (e) {
            var form = $(this);
            e.preventDefault();
            var url = form.attr('action');
            form.spinner().start();
            $('.reset-password-form').trigger('login:register', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                    } else {
                        $('.request-password-title').text(data.receivedMsgHeading);
                        $('.request-password-body').empty()
                            .append('<p>' + data.receivedMsgBody + '</p>');
                        if (!data.mobile) {
                            $('#submitEmailButton').text(data.buttonText)
                                .attr('data-dismiss', 'modal');
                        } else {
                            $('.send-email-btn').empty()
                                .html('<a href="'
                                    + data.returnUrl
                                    + '" class="btn btn-primary btn-block">'
                                    + data.buttonText + '</a>'
                                );
                        }
                    }
                },
                error: function () {
                    form.spinner().stop();
                }
            });
            return false;
        });
    },

    clearResetForm: function () {
        $('#login .modal').on('hidden.bs.modal', function () {
            $('#reset-password-email').val('');
            $('.modal-dialog .form-control.is-invalid').removeClass('is-invalid');
        });
    }
};
