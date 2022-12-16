'use strict'

function OrderModel(lineItemContainer, options) {
    module.superModule.call(this,lineItemContainer, options);
       this.giftCardTotal = lineItemContainer.giftCertificateTotalPrice ? lineItemContainer.giftCertificateTotalPrice.value :null;
}

module.exports = OrderModel;