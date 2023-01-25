'use strict'
var server = require("server");

var page = require("app_storefront_base/cartridge/controllers/Checkout");
server.extend(page);

var Transaction = require("dw/system/Transaction");
var Logger = require("dw/system/Logger");
var URLUtils = require("dw/web/URLUtils");
var ProductList = require('dw/customer/ProductList');
var ProductListMgr = require('dw/customer/ProductListMgr');

server.append('Begin',function(req,res,next){
    var id = req.querystring.id;
    var productlist = [];
    var productListData = null;

    Transaction.wrap(function () {
        var productList = ProductListMgr.getProductLists(customer , 100);
        if(productList.length == 0){
            var ProductList = ProductListMgr.createProductList(customer, 100)
            productList = ProductList
        }else
        {
            productList = productList[0];
        }
        productListData = productList.getItems();

        var productList = productList.getItem(id);
        productlist.push(productList);

      });

    res.render('checkout/checkout',{
        id:id,
        productList : productlist,
        productListData: productListData
    });

    next();
})

module.exports= server.exports()