"use strict";

var server = require("server");

var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var Transaction = require("dw/system/Transaction");
var Logger = require("dw/system/Logger");
var URLUtils = require("dw/web/URLUtils");
var ProductList = require("dw/customer/ProductList");
var ProductListMgr = require("dw/customer/ProductListMgr");

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
  var friendList = null;
  var ListItem = null;
  var data = res.getViewData();
  var ListItemId = data.queryString.split("=")[1];
  var friendForm = server.forms.getForm("friendList");
  var formData = friendForm.toObject();
  var ProductMgr = require('dw/catalog/ProductMgr');


  Transaction.wrap(function () {
    var AllFriendList = ProductListMgr.getProductLists(customer, 100);
    if (AllFriendList.length == 0) {
      var newfriendList = ProductListMgr.createProductList(customer, 100);
      friendList = newfriendList;
      Logger.info(friendList);
    } else {
      friendList = AllFriendList[0];
      Logger.info(friendList);
    }

    Transaction.wrap(function () {
      if (ListItemId != "") {
        var friendId = ListItemId;
        ListItem = friendList.getItem(friendId);
      } else {
        var product = ProductMgr.getProduct("shampo");
        ListItem = friendList.createProductItem(product);
      }
    });

    ListItem.custom.first_name = formData.firstName,
    ListItem.custom.last_name = formData.lastName,
    ListItem.custom.friend_birthday = formData.date,
    ListItem.custom.friend_phone = formData.phone,
    ListItem.custom.address1 = formData.address1,
    ListItem.custom.address2 = formData.address2,
    ListItem.custom.country = formData.country,
    ListItem.custom.city = formData.city,
    ListItem.custom.states = formData.states.stateCode,
    ListItem.custom.emailFriendList = formData.email,
    ListItem.custom.zip = formData.zip;

    res.redirect(URLUtils.url("FriendListUpdated-FriendDataTable"));
  });
  next();
});

server.get("FriendDataTable", function (req, res, next) {
  var productListData = null;
  Transaction.wrap(function () {
    var productList = ProductListMgr.getProductLists(customer, 100);
    if (productList.length == 0) {
      var ProductList = ProductListMgr.createProductList(customer, 100);
      productList = ProductList;
    } else {
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
    var productList = ProductListMgr.getProductLists(customer, 100);
    if (productList.length == 0) {
      var ProductList = ProductListMgr.createProductList(customer, 100);
      productList = ProductList;
    } else {
      productList = productList[0];
    }
    var reproductList = productList.getItem(id);
    var ad = productList.removeItem(reproductList);
  });
  res.redirect(URLUtils.url("FriendListUpdated-FriendDataTable"));
  next();
});

server.get("EditList", function (req, res, next) {
  var id = req.querystring.id;
  var form = server.forms.getForm("friendList");
  var new_Form = {};
  Transaction.wrap(function () {
    var productList = ProductListMgr.getProductLists(customer, 100);
    if (productList.length == 0) {
      var ProductList = ProductListMgr.createProductList(customer, 100);
      productList = ProductList;
    } else {
      productList = productList[0];
    }
    var productList = productList.getItem(id);
    (new_Form.firstName = productList.custom.first_name),
      (new_Form.lastName = productList.custom.last_name),
      (new_Form.date = productList.custom.friend_birthday),
      (new_Form.phone = productList.custom.friend_phone),
      (new_Form.address1 = productList.custom.address1),
      (new_Form.address2 = productList.custom.address2),
      (new_Form.country = productList.custom.country),
      (new_Form.city = productList.custom.city),
      (new_Form.states = productList.custom.states),
      (new_Form.email = productList.custom.emailFriendList),
      (new_Form.zip = productList.custom.zip);
  });
  form.copyFrom(new_Form);
  res.render("friendList/editFriendForm", { form: form, Id: id });
  next();
});

module.exports = server.exports();
