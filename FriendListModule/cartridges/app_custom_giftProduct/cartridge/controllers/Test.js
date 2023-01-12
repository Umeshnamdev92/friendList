'use strict'
var server = require("server");
server.get('giftFriend', function (req,res,next) {
var Transaction = require('dw/system/Transaction');
var ProductListMgr = require('dw/customer/ProductListMgr');
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
    });

    res.render('friendPopUpModal', { productList: productListData });
    next();
});


server.get("FriendDataTable", function (req, res, next) {
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
    });
    res.render("friendListShowModal", { productList: productListData });
    next();
  });


server.get('Show',function(req,res,next){
    res.render('test')
})
module.exports = server.exports();
