'use strict'
var base =  module.superModule;

module.exports = function fullProduct(product, apiProduct, options) {
    base(product, apiProduct, options);

    // Get Recommandations Products
    product.recommendation =  apiProduct.orderableRecommendations;
    product.isPersonalizable =  apiProduct.custom.isPersonalizable;

    return product;
}
