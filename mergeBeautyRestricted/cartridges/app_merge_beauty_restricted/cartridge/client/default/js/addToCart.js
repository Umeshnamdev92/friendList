$(document).ready(function(){
//add recommended product to cart
    $('.recommended-add-to-cart').on('click', function(){
        var btn = $(this);
        var pid = btn.attr('data-pid');
        var url = $('.add-to-cart-url').val();

        var form = {
            pid: pid,
            pidsObj: [],
            quantity: 1
        };
        $.ajax({
            url: url,
            method: 'POST',
            data: form,
            success: function (data) {
                handlePostCartAdd(data);
                $('body').trigger('product:afterAddToCart', data);
                $.spinner().stop();
                miniCartReportingUrl(data.reportingURL);
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });



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
            }, 5000);
        }
    }

    function miniCartReportingUrl(url) {
        if (url) {
            $.ajax({
                url: url,
                method: 'GET',
                success: function () {
                    // reporting urls hit on the server
                },
                error: function () {
                    // no reporting urls hit on the server
                }
            });
        }
    }

    function chooseBonusProducts(data) {
        $('.modal-body').spinner().start();
    
        if ($('#chooseBonusProductModal').length !== 0) {
            $('#chooseBonusProductModal').remove();
        }
        var bonusUrl;
        if (data.bonusChoiceRuleBased) {
            bonusUrl = data.showProductsUrlRuleBased;
        } else {
            bonusUrl = data.showProductsUrlListBased;
        }
    
        var htmlString = '<!-- Modal -->'
            + '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">'
            + '<span class="enter-message sr-only" ></span>'
            + '<div class="modal-dialog choose-bonus-product-dialog" '
            + 'data-total-qty="' + data.maxBonusItems + '"'
            + 'data-UUID="' + data.uuid + '"'
            + 'data-pliUUID="' + data.pliUUID + '"'
            + 'data-addToCartUrl="' + data.addToCartUrl + '"'
            + 'data-pageStart="0"'
            + 'data-pageSize="' + data.pageSize + '"'
            + 'data-moreURL="' + data.showProductsUrlRuleBased + '"'
            + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">'
            + '<!-- Modal content-->'
            + '<div class="modal-content">'
            + '<div class="modal-header">'
            + '    <span class="">' + data.labels.selectprods + '</span>'
            + '    <button type="button" class="close pull-right" data-dismiss="modal">'
            + '        <span aria-hidden="true">&times;</span>'
            + '        <span class="sr-only"> </span>'
            + '    </button>'
            + '</div>'
            + '<div class="modal-body"></div>'
            + '<div class="modal-footer"></div>'
            + '</div>'
            + '</div>'
            + '</div>';
        $('body').append(htmlString);
        $('.modal-body').spinner().start();
    
        $.ajax({
            url: bonusUrl,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                var parsedHtml = parseHtml(response.renderedTemplate);
                $('#chooseBonusProductModal .modal-body').empty();
                $('#chooseBonusProductModal .enter-message').text(response.enterDialogMessage);
                $('#chooseBonusProductModal .modal-header .close .sr-only').text(response.closeButtonText);
                $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
                $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
                $('#chooseBonusProductModal').modal('show');
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
});