
$( document ).ready(function() {
    $(document).on('change' , 'input:radio[name="selectShippingAddress"]' , function(){
        $('.addressSelector').empty();

        var selectedType = $(this).val();
        var url = $('#selectAddressAjax').val();
        url +=  `?selectedAddress=`+selectedType;
        $.ajax({
            url: url,
            type: 'POST',
            success: function(data)
            {
               console.log(data.order.shipping)
               $(".addressSelector").append("<option>"+'New Address'+
               "</option>");
               $.each(data.customer, function(data, data) {
                if(data.address1){

            $(".addressSelector").append("<option value="+'ab_'+data.ID+" data-first-name="+data.firstName+" data-last-name="+data.lastName+" data-address1="+data.address1+" data-address2="+data.address2+"  data-city="+data.city+" data-state-code="+data.stateCode+" data-country-code="+data.countryCode.value+" data-postal-code="+data.postalCode+" data-phone="+data.phone+">"+ data.ID+
            '  ' + data.firstName+ '  '+ data.lastName + '  '+ data.address1 + '  ' + data.address2+ '  ' + data.city+'  ' + data.city+
            "</option>");
                }
              });
            }
        })
    });
});

$( document ).ready(function() {
    $(document).on('change' , 'input:radio[name="selectShippingAddress"]' , function(){
        $('.addressSelector').empty();

        var selectedType = $(this).val();
        var url = $('#selectAddress').val();
        url +=  `?selectedAddress=`+selectedType;
        $.ajax({
            url: url,
            type: 'GET',
            success: function(data)
            {
               console.log(data)
            }
        })
    });
});