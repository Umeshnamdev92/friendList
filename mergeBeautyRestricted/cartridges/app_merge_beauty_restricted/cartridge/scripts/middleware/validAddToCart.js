'use strict';

// function to prevent unauthorised BOT access from add to cart.
function validateRestrictedProduct(req , res , next)
{
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productId = req.form.pid;
    var product = ProductMgr.getProduct(productId);
    if((product.custom.isWineOrNot == true && !customer.isAuthenticated()) || (customer.isAuthenticated() && customer.isMemberOfCustomerGroup('age-less-18') && product.custom.isWineOrNot == true)){
        res.setViewData({
            validateRestrictedProduct: false,
            error: true ,
            message: Resource.msg('error.message.for.minor', 'forms', null)});
    }
    next();
}

module.exports = {
    validateRestrictedProduct: validateRestrictedProduct
}