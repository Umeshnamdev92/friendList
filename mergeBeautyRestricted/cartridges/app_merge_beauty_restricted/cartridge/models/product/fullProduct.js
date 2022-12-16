"use strict";

var base = module.superModule;

module.exports = function fullProduct(product, apiProduct, options) {
    base(product, apiProduct, options)
// to add all the variables related to restricted products to System objects
    product.isPersonalizable = apiProduct.custom.isPersonalizable;
    product.isWineOrNot = apiProduct.custom.isWineOrNot;
    product.orderableRecommendations = apiProduct.orderableRecommendations;
    product.isGiftCard = apiProduct.custom.isGiftCard;

    return product;
};

