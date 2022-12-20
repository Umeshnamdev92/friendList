'use strict'

function OrderModel(lineItemContainer, options) {
    module.superModule.call(this,lineItemContainer, options);
    // adding gift card attribute for calculating gift card total - CUSTOM
       this.giftCardTotal = lineItemContainer.giftCertificateTotalPrice ? lineItemContainer.giftCertificateTotalPrice.value :null;
}

module.exports = OrderModel;