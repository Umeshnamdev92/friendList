
$(document).ready(function () {
  // Apply gift certificate click event - CUSTOM
  $('#reedemgiftcardbalance').click(function (e) {
    e.preventDefault();
    var GiftCardCode = $('#GiftCardCode').val();
    var redeemamount = $('#redeemamount').val();
    var url = $('#GiftCardreedemurl').val();

    $.ajax({
      url: url,
      type: 'GET',
      data: {
        GiftCardCode: GiftCardCode,
        redeemamount: redeemamount
      },
      success: function (data) {
        if (data.success) {
          swal({
            title: 'Gift card have been applied successfully',
            text: data.msg,
            icon: 'success',
            button: 'OK',
          });
          $('#RedeemGiftCertificate').html("<p>you have applied gift certificate for amount:" + redeemamount + "</p>");
        } else {
          swal({
            title: 'Sorry',
            text: data.msg,
            icon: 'warning',
            button: 'OK'
          });
        }
      },
      error: function (data) {
        swal({
          title: 'Sorry',
          text: data,
          icon: 'warning',
          button: 'OK'
        });
      }
    });
    return false;
  });
});