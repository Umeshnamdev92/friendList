'use strict';

var scrollAnimate = require('./scrollAnimate');

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked for email sign-up
 */
function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.email-signup-message').length === 0) {
        $('body').append(
           '<div class="email-signup-message"></div>'
        );
    }
    $('.email-signup-message')
        .append('<div class="email-signup-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.email-signup-message').remove();
        button.removeAttr('disabled');
    }, 3000);
}

module.exports = function () {
    $('.back-to-top').click(function () {
        scrollAnimate();
    });

    $('.subscribe-email').on('click', function (e) {
        e.preventDefault();
        var url = $(this).data('href');
        var button = $(this);
        var emailId = $('input[name=hpEmailSignUp]').val();
        $.spinner().start();
        $(this).attr('disabled', true);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: {
                emailId: emailId
            },
            success: function (data) {
                
                swal({
                    text: data.msg,
                    icon: "success",
                    showCancelButton: false,
                  });
                  $.spinner().stop()
              
            },
            error: function (err) {
                // swal({
                //     title:"sorry"
                //     text: err.msg,
                //     type: "danger",
                //     icon: "warning",
                //     showCancelButton: false,
                //     confirmButtonClass: "btn-danger",
                //     confirmButtonText: "Yes, delete it!",
                //     closeOnConfirm: false,
                //   }),
                  swal({
                    title: "Sorry",
                    text: err.msg,
                    icon: "danger",
                    button: "OK",
                  });
                  $.spinner().stop()
            }
        });
    });
};
