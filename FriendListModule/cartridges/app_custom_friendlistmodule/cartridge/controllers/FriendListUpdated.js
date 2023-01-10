"use strict";

var server = require("server");

var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var Transaction = require("dw/system/Transaction");
var Logger = require("dw/system/Logger");
var URLUtils = require("dw/web/URLUtils");
var ProductList = require('dw/customer/ProductList');
var ProductListMgr = require('dw/customer/ProductListMgr');

server.get(
  "MahChild",
  server.middleware.https,
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  function (req, res, next) {
    var form = server.forms.getForm("friendList");
    form.clear();
    res.render("friendList/friendListEntry", { form: form });
    next();
  }
);

server.post("Save", function (req, res, next) {
  var form = server.forms.getForm("friendList");
  var Transaction = require("dw/system/Transaction");
  var Logger = require("dw/system/Logger");
  var ProductListMgr = require("dw/customer/ProductListMgr");
  var URLUtils = require("dw/web/URLUtils");
  var new_Form = form.toObject();
  var ProductMgr = require('dw/catalog/ProductMgr');
  var product = ProductMgr.getProduct('FakeProduct');
  var id = req.querystring.Id;
    if(id != ''){
        Transaction.wrap(function () {
            var productLists = ProductListMgr.getProductLists(customer , 100);
           
            var productList = productLists[0];
            
            var productListt = productList.getItem(id);
                productListt.custom.first_name = new_Form.firstName,
                productListt.custom.last_name = new_Form.lastName,
                productListt.custom.pet_name = new_Form.nickName,
                productListt.custom.friend_birthday = new_Form.date,
                productListt.custom.friend_phone = new_Form.phone     
          });
        
    }

else{
    Transaction.wrap(function () {
        var productList = ProductListMgr.getProductLists(customer , 100);
        if(productList.length == 0){
            var ProductList = ProductListMgr.createProductList(customer, 100)
            productList = ProductList
        }else
        {
            productList = productList[0];
        }

        var productList = productList.createProductItem(product);
            productList.custom.first_name = new_Form.firstName,
            productList.custom.last_name = new_Form.lastName,
            productList.custom.pet_name = new_Form.nickName,
            productList.custom.friend_birthday = new_Form.date,
            productList.custom.friend_phone = new_Form.phone     
      });
    }
  res.redirect(URLUtils.url("FriendListUpdated-FriendDataTable"));
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
  res.render("friendList/friendListShow", { productList: productListData });
  next();
});

server.get("DeleteList", function (req, res, next) {
  var id = req.querystring.id;
  Transaction.wrap(function () {
    var productList = ProductListMgr.getProductLists(customer , 100);
    if(productList.length == 0){
        var ProductList = ProductListMgr.createProductList(customer, 100)
        productList = ProductList
    }else
    {
        productList = productList[0];
    }
    var reproductList = productList.getItem(id);
    var ad = productList.removeItem(reproductList);
  });
  res.redirect(URLUtils.url("FriendListUpdated-FriendDataTable"));
  next();
});

server.get('EditList',function(req,res,next){
    var id = req.querystring.id;
    var form = server.forms.getForm("friendList");
    var new_Form = {};
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
        new_Form.firstName= productList.custom.first_name,
        new_Form.lastName= productList.custom.last_name,
        new_Form.nickName= productList.custom.pet_name,
        new_Form.date= productList.custom.friend_birthday,
        new_Form.phone= productList.custom.friend_phone
  });
  form.copyFrom(new_Form);
  res.render('friendList/editFriendForm' , {form: form , Id: id});
  next();
    
})

module.exports = server.exports();
