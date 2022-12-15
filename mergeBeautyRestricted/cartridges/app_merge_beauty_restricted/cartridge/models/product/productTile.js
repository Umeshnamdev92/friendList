'use strict';

var base = module.superModule;
var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');


/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */

 module.exports = function productTile(product, apiProduct, productType) {
     base(product, apiProduct, productType)
 // to add all the variables related to restricted products to System objects
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    decorators.promotions(product, promotions);
   // decorators.price(product, apiProduct, options.promotions, false, options.optionModel);

    return product;
 };