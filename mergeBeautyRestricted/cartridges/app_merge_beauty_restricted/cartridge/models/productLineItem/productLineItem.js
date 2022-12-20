'use strict'
var base =  module.superModule;


module.exports = function productLineItem(product, apiProduct, options) {
    base(product, apiProduct, options);
// to send data of engravingmessage variable to Product System object
    product.engravingMessage = options.lineItem.custom.engravingMessage;
    product.isGiftCard = apiProduct.custom.isGiftCard; // update giftcard attributr for product line item

    return product
}

