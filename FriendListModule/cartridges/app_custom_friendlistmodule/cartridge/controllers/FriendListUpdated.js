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
    var address = false
    if(customer.addressBook.addresses.length > 0){
        address = true;
    }
    res.render("friendList/friendListEntry", { form: form, address:address });
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
  var product = ProductMgr.getProduct('shampo');
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var CustomObjectMgr = require('dw/object/CustomObjectMgr');
  var collections = require('*/cartridge/scripts/util/collections');

  Transaction.wrap(function () {
    var productList = ProductListMgr.getProductLists(customer , 100);
    if(productList.length == 0){
        var ProductList = ProductListMgr.createProductList(customer, 100)
        productList = ProductList
    }else
    {
        productList = productList[0];
    }
    var returnData = {}
    collections.forEach(productList.items, function (items){
      var a  = 10;
      if(items.custom.emailFriendList == new_Form.email){
        returnData.alreadyFriend = true;
      }
    })

    if(returnData.alreadyFriend == true){
    }
    else{
    var a = customer;
    var id = UUIDUtils.createUUID();
    var customers = CustomerMgr.queryProfiles('firstName != null',null,'asc');
    while(customers.hasNext()){
      var current_customer = customer;
      var list_of_customer = customers.next();
      if(list_of_customer.email ==  new_Form.email){
        returnData.success = true;
        Transaction.wrap(function () {
        var requests = CustomObjectMgr.createCustomObject('Requests',id);
        requests.custom.SenderAddress = a.profile.customerNo;
        requests.custom.SenderName = a.profile.firstName;
        requests.custom.ReceiverAddress = list_of_customer.customerNo;
        requests.custom.SenderEmail =current_customer.profile.email;
        requests.custom.Status = false; 
      });
      }
    }
    if(returnData.success == undefined){
      var mail: Mail = new dw.net.Mail();
      mail.addTo(new_Form.email);
      mail.setFrom(a.profile.email);
      mail.setSubject("Request to Join Website");
      mail.setContent(`Join the Website and Get exclusive discount on fashion products
      link to join : https://bjxc-001.dx.commercecloud.salesforce.com/on/demandware.store/Sites-FriendConnect-Site/default/Login-Show?customerNumber=${customer.profile.customerNo}
      
      <b>Mandatory</b>:
      Note : Points to be Notice after you register yourself in the website:
        1. You should have to add the address first in the My Account Section then only you can send the request to the friend and Accept the request of the friend.
        2. Birthday Field is mandatory to add
        3. Once you added the friend you can remove from the friend list with the help of "Delete" Button. Note: But you are still being the friend of that person only you remove them from your friend list.`);
      mail.send();
    }
  }
    returnData.alreadyMessage = `You both are already friends in this website`
    returnData.message = `Request Send Successfully`;
    returnData.error = `Registration link will be sent to the person you are trying to add as they are not a user of our website currently`;
    var redirectURL = URLUtils.url("FriendListUpdated-FriendDataTable").toString();
    returnData.redirectURL = redirectURL;
    res.json(returnData); 
  
  });
  next();
});


server.get('AcceptedRequestFriends',function(req,res,next){
  // var form = server.forms.getForm("friendList");
  var Transaction = require("dw/system/Transaction");
  var Logger = require("dw/system/Logger");
  var ProductListMgr = require("dw/customer/ProductListMgr");
  var URLUtils = require("dw/web/URLUtils");
  // var new_Form = form.toObject();
  var ProductMgr = require('dw/catalog/ProductMgr');
  var product = ProductMgr.getProduct('shampo');
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var CustomObjectMgr = require('dw/object/CustomObjectMgr');

  Transaction.wrap(function () {
    var myrequests = CustomObjectMgr.getAllCustomObjects('Requests');
    while(myrequests.hasNext()){
      var request = myrequests.next();
      if(request.custom.friend_added != true){
      var senders_customer_number = req.querystring.sender;
      var receiver_customer_number = req.querystring.receiver;

      var sender = CustomerMgr.getCustomerByCustomerNumber(senders_customer_number);
      
      var receiver = CustomerMgr.getCustomerByCustomerNumber(receiver_customer_number);
      
      var productList = ProductListMgr.getProductLists(sender , 100);
      if(productList.length == 0){
          var ProductList = ProductListMgr.createProductList(sender, 100)
          productList = ProductList
      }else
      {
          productList = productList[0];
      }   
            var prroductList = productList.createProductItem(product);
            prroductList.custom.first_name =receiver.profile.firstName;
            prroductList.custom.last_name = receiver.profile.lastName,
            prroductList.custom.friend_birthday = receiver.profile.birthday,
            prroductList.custom.friend_phone = receiver.profile.phoneHome,
            prroductList.custom.emailFriendList = receiver.profile.email
            prroductList.custom.address1 = receiver.profile.addressBook.addresses[0].address1 ? receiver.profile.addressBook.addresses[0].address1: "No address save yet" ,
            prroductList.custom.address2 = receiver.profile.addressBook.addresses[0].address2 ? receiver.profile.addressBook.addresses[0].address2 : "No address save yet",
            prroductList.custom.country = receiver.profile.addressBook.addresses[0].countryCode.displayValue ? receiver.profile.addressBook.addresses[0].countryCode.displayValue: "No country defined yet" ,
            prroductList.custom.city = receiver.profile.addressBook.addresses[0].city ? receiver.profile.addressBook.addresses[0].city: "No city defined yet",
            prroductList.custom.states = receiver.profile.addressBook.addresses[0].stateCode ? receiver.profile.addressBook.addresses[0].stateCode:"No state code defined yet" ,
            prroductList.custom.zip = receiver.profile.addressBook.addresses[0].postalCode ? receiver.profile.addressBook.addresses[0].postalCode: "No postal code added yet" ;           

    var productList = ProductListMgr.getProductLists(receiver , 100);
    if(productList.length == 0){
        var ProductList = ProductListMgr.createProductList(receiver, 100)
        productList = ProductList
    }else
    {
        productList = productList[0];
    }
        var prroductList = productList.createProductItem(product);
            prroductList.custom.first_name =sender.profile.firstName;
            prroductList.custom.last_name = sender.profile.lastName,
            prroductList.custom.friend_birthday = sender.profile.birthday,
            prroductList.custom.friend_phone = sender.profile.phoneHome,
            prroductList.custom.emailFriendList = sender.profile.email
            prroductList.custom.address1 = sender.profile.addressBook.addresses[0].address1 ? sender.profile.addressBook.addresses[0].address1:null,
            prroductList.custom.address2 = sender.profile.addressBook.addresses[0].address2 ? sender.profile.addressBook.addresses[0].address2:null,
            prroductList.custom.country = sender.profile.addressBook.addresses[0].countryCode.displayValue ? sender.profile.addressBook.addresses[0].countryCode.displayValue:null,
            prroductList.custom.city = sender.profile.addressBook.addresses[0].city ? sender.profile.addressBook.addresses[0].city:null,
            prroductList.custom.states = sender.profile.addressBook.addresses[0].stateCode ? sender.profile.addressBook.addresses[0].stateCode:null,
            prroductList.custom.emailFriendList = sender.profile.email ? sender.profile.email:null,
            prroductList.custom.zip = sender.profile.addressBook.addresses[0].postalCode ? sender.profile.addressBook.addresses[0].postalCode:null;
  }
  request.custom.friend_added = true;
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
    mail.setSubject("Your Friend Products Share");
    mail.setContent(" click on the link to redirect to Product"+`
      https://bjxc-001.dx.commercecloud.salesforce.com/s/FriendConnect/${id}.html?customerID=${customer.profile.customerNo}`
      );
      
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
