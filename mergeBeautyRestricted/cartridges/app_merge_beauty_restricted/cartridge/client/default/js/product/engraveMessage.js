$(document).ready(function(){

  var base = require('./base')

  // Event for validating the engraving message field
  $(document).on('keyup' , '#engraving-message' , function(){
    var engravingText = $('#engraving-message').val();
    engravingText = engravingText.trim();
    if(engravingText.length > 0)
    {
      $('#engraving-message').attr('maxlength' ,'')
      if (engravingText.length > 50) {
        $('#engraving-message').attr('maxlength' , '50')
        $('#invalid-feedback-message').empty();
        $('#invalid-feedback-message').append(`<span class = "text-danger" >Only 50 characters are allowed</span>`)
        $('button.add-to-cart').attr('disabled', true);
      }
      else
      {
        const regax = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        if (regax.test(engravingText)) {
              $('button.add-to-cart').attr('disabled', true);
              $('#invalid-feedback-message').empty();
              $('#invalid-feedback-message').append(`<span class = "text-danger" >Special Characters are not allowed </span>`)
          }
          else
          {
            $('button.add-to-cart').attr('disabled', false);
            $('#invalid-feedback-message').empty();
          }
      }
    }
    else
    {
      $('button.add-to-cart').attr('disabled', true);
      $('#invalid-feedback-message').empty();
      $('#invalid-feedback-message').append(`<span class = "text-danger" >Please enter engraving text </span>`)
    }
  })

  // Event for add the engraving option
  $(document).on('click' , '#add-engraving-btn' , function(){
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
          base.updateQuantities(data.product.quantities, $productContainer);
            $('body').trigger('product:afterAttributeSelect',
                { data: data, container: $productContainer });
            $.spinner().stop();
          $('#engraving').show();
          $('#add-engraving-btn').attr('disabled', true);
          $('.add-to-cart').attr('disabled', true);
          $('#cancal-engraving').attr('disabled', false);
          $('#cancal-engraving').show()
          $('#add-engraving-btn').hide()
        },
        error: function () {
            $.spinner().stop();
        }
    });
  })

  // Event for cancel the engraving option
  $(document).on('click' ,'#cancal-engraving' , function(){
    $('#engraving-message').val('');
    $('#invalid-feedback-message').empty();
    var btnUrl = $(this).val()
    $('#add-engraving-btn').attr('disabled', false);
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
          base.updateQuantities(data.product.quantities, $productContainer);
            $('body').trigger('product:afterAttributeSelect',
                { data: data, container: $productContainer });
            $.spinner().stop();
            $('#cancal-engraving').attr('disabled', true);
            $('#engraving').hide();
            $('#cancal-engraving').hide()
            $('#add-engraving-btn').show()
        },
        error: function () {
            $.spinner().stop();
        }
    });
  });

})


