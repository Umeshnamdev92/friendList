"use strict";

importPackage(dw.net);
importPackage(dw.system);
var server = require("server");

var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var Transaction = require("dw/system/Transaction");
var Logger = require("dw/system/Logger");
var URLUtils = require("dw/web/URLUtils");
var ProductList = require("dw/customer/ProductList");
var ProductListMgr = require("dw/customer/ProductListMgr");
var UUIDUtils = require("dw/util/UUIDUtils");

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
  var ProductMgr = require("dw/catalog/ProductMgr");
  var CustomerMgr = require("dw/customer/CustomerMgr");
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");

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
    var a = customer;
    var id = UUIDUtils.createUUID();
    var customers = CustomerMgr.queryProfiles("firstName != null", null, "asc");
    while (customers.hasNext()) {
      var list_of_customer = customers.next();
      if (list_of_customer.email == formData.email) {
        Transaction.wrap(function () {
          var requests = CustomObjectMgr.createCustomObject("Requests", id);
          requests.custom.SenderName = a.profile.firstName;
          requests.custom.ReceiverAddress = list_of_customer.customerNo;
          requests.custom.SenderEmail = list_of_customer.email;
          requests.custom.Status = false;
        });
      }
    }
    if (ListItem.custom.first_name == null) {
      var mail: Mail = new dw.net.Mail();
      mail.addTo(formData.email);
      mail.setFrom(a.profile.email);
      mail.setSubject("Request to Join Website");
      mail.setContent(`Join the Website and Get exclusive discount on fashion products
      <a href="https://bjxc-001.dx.commercecloud.salesforce.com/on/demandware.store/Sites-FriendConnect-Site/default/Login-Show#register">`);
      mail.send();
    }
    res.redirect(URLUtils.url("FriendListUpdated-FriendDataTable"));
  });
  next();
});

server.get("AcceptedRequestFriends", function (req, res, next) {
  var friendList = null;
  var ListItem = null;
  var data = res.getViewData();
  var ListItemId = data.queryString.split("=")[1];
  var friendForm = server.forms.getForm("friendList");
  var formData = friendForm.toObject();
  var ProductMgr = require("dw/catalog/ProductMgr");
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");

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

    var myrequests = CustomObjectMgr.getAllCustomObjects("Requests");
    while (myrequests.hasNext()) {
      // var current_customer = customer;
      var request = myrequests.next();
      if (request.custom.SenderEmail == customer.profile.email) {
        var customers = CustomerMgr.queryProfiles(
          "firstName != null",
          null,
          "asc"
        );
        while (customers.hasNext()) {
          var list_of_customer = customers.next();
          if (
            list_of_customer.customerNo == request.custom.ReceiverAddress &&
            request.custom.Status == true
          ) {
            (ListItem.custom.first_name = list_of_customer.firstName),
              (ListItem.custom.last_name = list_of_customer.lastName),
              (ListItem.custom.friend_birthday = list_of_customer.birthday),
              (ListItem.custom.friend_phone = list_of_customer.phoneHome),
              (ListItem.custom.address1 =
                list_of_customer.addressBook.addresses[0].address1),
              (ListItem.custom.address2 =
                list_of_customer.addressBook.addresses[0].address2),
              (ListItem.custom.country =
                list_of_customer.addressBook.addresses[0].countryCode.displayValue),
              (ListItem.custom.city =
                list_of_customer.addressBook.addresses[0].city),
              (ListItem.custom.states =
                list_of_customer.addressBook.addresses[0].stateCode),
              (ListItem.custom.emailFriendList = list_of_customer.email),
              (ListItem.custom.zip =
                list_of_customer.addressBook.addresses[0].postalCode);
          }
        }
      }
      // var status = req.querystring.status;
      // var Customer = req.querystring.customer;
      // if(status == true){
      //   var customers = CustomerMgr.queryProfiles('firstName != null',null,'asc');
      //   while(customers.hasNext()){
      //       var list_of_customer = customers.next();
      //       if(list_of_customer.customerNo == Customer){
      //         ListItem.custom.first_name =list_of_customer.firstName ,
      //         ListItem.custom.last_name = list_of_customer.lastName,
      //         ListItem.custom.friend_birthday = list_of_customer.birthday,
      //         ListItem.custom.friend_phone = list_of_customer.phoneHome,
      //         ListItem.custom.address1 = list_of_customer.addressBook.addresses[0].address1,
      //         ListItem.custom.address2 = list_of_customer.addressBook.addresses[0].address2,
      //         ListItem.custom.country = list_of_customer.addressBook.addresses[0].countryCode.displayValue,
      //         ListItem.custom.city = list_of_customer.addressBook.addresses[0].city,
      //         ListItem.custom.states = list_of_customer.addressBook.addresses[0].stateCode,
      //         ListItem.custom.emailFriendList = list_of_customer.email,
      //         ListItem.custom.zip = list_of_customer.addressBook.addresses[0].postalCode;
      //       }
      //     }
      // }
    }
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
    var a = 10;
  });
  res.render("friendList/friendListShow", { productList: productListData });
  next();
});

server.get("FriendModel", function (req, res, next) {
  var id = req.querystring.id;
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
    var a = 10;
  });
  res.render("friendListShowModal", {
    productListData: productListData,
    id: id,
  });
  next();
});

server.get("sendMailToFriend", function (req, res, next) {
  var id = req.querystring.productID;
  var friend_id = req.querystring.friendid;
  var sendTo;

  Transaction.wrap(function () {
    var productList = ProductListMgr.getProductLists(customer, 100);
    if (productList.length == 0) {
      var ProductList = ProductListMgr.createProductList(customer, 100);
      productList = ProductList;
    } else {
      productList = productList[0];
    }
    // productListData = productList.getItems();

    var productList = productList.getItem(friend_id);
    sendTo = productList.custom.emailFriendList;

    var status;
    var mail = new Mail();
    mail.addTo(sendTo);
    mail.setFrom("from@example.org");
    mail.setSubject("Products Share");
    mail.setContent(`
      'Your Friend Share this Product . Click on link to see Product'+
      'https://bjxc-001.dx.commercecloud.salesforce.com/s/FriendConnect/'+${id}+'.html'+'customerNumber='${customer.profile.customerNo}
      `);
    status = mail.send();
    if (status.getMessage() !== "OK") {
      return false;
    } else {
      return true;
    }
  });
  res.redirect(URLUtils.url("FriendListUpdated-FriendDataTable"));

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
