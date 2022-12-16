'use strict'
var base =  module.superModule;


module.exports = function orderLineItem(product, apiProduct, options) {
    base(product, apiProduct, options);
// to send data of engravingmessage variable to Order System object
    product.engravingMessage = options.lineItem.custom.engravingMessage;
    return product
}

