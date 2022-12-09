$(document).ready(function () {
  var base = require('./base')

  $(document).on('click' , '#other-amount' , function(){
    $('#other-input').show();
  })

  $(document).on('click' , '.gift-amount' , function(){
    $('#engraving-message').val('');
      var btnUrl = $(this).val()
      var $productContainer = $(this).closest('.set-item');
      if (!$productContainer.length) {
          $productContainer = $(this).closest('.product-detail');
      }
      $.spinner().start();
      // Ajax for setup the option selection and update price based on the selection
    $.ajax({
        url: btnUrl,
        method: 'GET',
        success: function (data) {
          base.handleVariantResponse(data, $productContainer);
          base.updateOptions(data.product.optionsHtml, $productContainer);
          base.updateQuantities(data.product.quantities, $productContainer);
            $('body').trigger('product:afterAttributeSelect',
                { data: data, container: $productContainer });
            $.spinner().stop();
            // $('.gift-amount').attr('disabled' , false);
            // $(this).attr('disabled' , true);
        },
        error: function () {
            $.spinner().stop();
        }
    });
  })

});


