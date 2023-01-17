$( document ).ready(function() {

    //Adding items to wishlist
    $(document).on('click','.custombtn-wishlist',function(){
        var url = $(this).attr("data-url");
        var count = $("#wishListCount").text();
        if(url){
            $.ajax({
                url: url,
                method: 'POST',
                success: function (data) {
                    // reporting urls hit on the server
                    if(data.success === true){
                    swal({
                        title: "SuccessFully",
                        text: "Product added to wishlist",
                        icon: "success",
                        button: "OK",
                      });
                      $("#wishListCount").text(parseInt(count)+1);
                    }
                    else{
                    swal({
                        title: "Sorry",
                        text: "Product already in wishlist!",
                        icon: "warning",
                        button: "OK",
                      });
                    }
                },
                error: function(error){
                    console.log(error.responseJSON)
                    var errorResult = error.responseJSON;
                    if (errorResult.loggedin === false) {
                        window.location.href = errorResult.redirectUrl
                    }
                }
            });
        }
    });

    //Deleting items from wishlist
    $(".removeItemBtn").click(function(){
        var url = $(this).attr("data-url");
        var count = $("#wishListCount").text();
        // if(count<=0){
        //     $('.emptyWishlist').append('<h1 class="empty-wishlisterror text-center">Empty Wishlist</h1>');
        // }
        $.ajax({
            url: url,
            method: 'POST',
            success: function (data) {
                // reporting urls hit on the server
                $("#wishListCount").text(parseInt(count)-1);
                $("#deletedMsg").append(`<div class="alert alert-success" role="alert">
                    Product Removed Successfully
                </div>`);

                var removedId = data.deleteId;
                $(`#${removedId}`).remove();

                setTimeout(()=>{
                    $(".alert").remove();
                },2000);
            },
            error: function () {
                // no reporting urls hit on the server
                $("#deletedMsg").append(`<div class="alert alert-success" role="alert">
                    Some Error Occured
                </div>`);
                setTimeout(()=>{
                    $(".alert").remove();
                },3000);
            }
        });
    });

    //Get Variants
    $('.getSize').click(function(){
        var url = $(this).attr('data-url');
        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                // reporting urls hit on the server
                $("#variantProductId").attr('value',`${data.variationId}`);
                if(data.pid){
                    $(`#${data.pid}`).prop('disabled',false);
                }
            },
            error: function () {
                // no reporting urls hit on the server
            }
        });
    })
    //Add to Cart
    $(".addToCart").click(function(){
        var url = $("#addToCartUrl").val();
        var newVal = $(this).attr('id');
        var productID = $("#variantProductId").val();
        if(productID == ''){
            productID = newVal;
        }
        else{
            productID = productID
        }

        var productData = {
            pid : productID,
            quantity : 1,
            options : []
        }

        $.ajax({
            url: url,
            method: 'POST',
            data : productData,
            success: function (data) {
                // reporting urls hit on the server
                handlePostCartAdd(data);
                $('body').trigger('product:afterAddToCart', data);
                $.spinner().stop();
                if(data.error === true){
                    swal("This size is out of stock", {
                        buttons: ["Go Back"],
                      });
                }
            },
            error: function () {
                // no reporting urls hit on the server
            }
        });
    });



    // handeling the message after product added to cart
    function handlePostCartAdd(response) {
        $('.minicart').trigger('count:update', response);
        var messageType = response.error ? 'alert-danger' : 'alert-success';
        // show add to cart toast
        if (response.newBonusDiscountLineItem
            && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
            chooseBonusProducts(response.newBonusDiscountLineItem);
        } else {
            if ($('.add-to-cart-messages').length === 0) {
                $('body').append(
                    '<div class="add-to-cart-messages"></div>'
                );
            }

            $('.add-to-cart-messages').append(
                '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">'
                + response.message
                + '</div>'
            );

            setTimeout(function () {
                $('.add-to-basket-alert').remove();
            }, 2000);
        }
    }

    //Add product from product description page
    $(".wishlist-pdp").click(function(){
        var pid = $('.product-id').text();
        var count = $("#wishListCount").text();
        var url = $(this).attr('data-url');
        var baseUrl = url+'?pid='+pid;
        console.log(baseUrl)
        if(baseUrl){
            $.ajax({
                url: baseUrl,
                method: 'POST',
                success: function (data) {
                   if(data.success === true){
                        swal({
                            title: "SuccessFully",
                            text: "Product added to wishlist",
                            icon: "success",
                            button: "OK",
                          });
                          $("#wishListCount").text(parseInt(count)+1);
                        }
                        else{
                            swal({
                                title: "Sorry",
                                text: "Product already in wishlist!",
                                icon: "warning",
                                button: "OK",
                              });
                            }
                },
                error: function(error){
                    console.log(error.responseJSON)
                    var errorResult = error.responseJSON;
                    if (errorResult.loggedin === false) {
                        window.location.href = errorResult.redirectUrl
                    }
                }
            })
        }
    })

});
