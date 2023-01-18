'use strict'
var server = require("server");

var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var Transaction = require("dw/system/Transaction");
var Logger = require("dw/system/Logger");
var URLUtils = require("dw/web/URLUtils");
var ProductList = require('dw/customer/ProductList');
var ProductListMgr = require('dw/customer/ProductListMgr');

server.append('Begin',function(req,res,next){
    var id = req.querystring.id;
    var productlist = [];
    Transaction.wrap(function () {
        var productList = ProductListMgr.getProductLists(customer , 100);
        if(productList.length == 0){
            var ProductList = ProductListMgr.createProductList(customer, 100)
            productList = ProductList
        }else
        {
            productList = productList[0];
        }
        var productList = productList.getItem(id);
        productlist.push(productList);
      });

    res.render('checkout/checkout',{
        id:id,
        productList : productlist
    });
    
    next();
})

module.exports= server.exports()