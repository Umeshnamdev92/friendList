var base = module.superModule;

module.exports = function  productLineItem(product, apiProduct, options) {
    base(product, apiProduct, options)
// to add all the variables related to restricted products to System objects
    product.isGiftCard = apiProduct.custom.isGiftCard;
    return product;
};