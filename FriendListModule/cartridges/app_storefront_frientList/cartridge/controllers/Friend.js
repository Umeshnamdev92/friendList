"use strict";

var Logger = require("dw/system/Logger");
var ProductListMgr = require("dw/customer/ProductListMgr");
var server = require("server");
var Resource = require("dw/web/Resource");
var URLUtils = require("dw/web/URLUtils");
var Transaction = require("dw/system/Transaction");
var friendForm = server.forms.getForm("friend");
var formData = friendForm.toObject();
var ProductMgr = require("dw/catalog/ProductMgr");


server.get('Show', function (req, res, next) {
   if(customer.isAuthenticated())
   {
    res.render('account/editAddFriend');
   }
   else
   {
     res.render('account/LoginFeature');
   }
    return next();
});

server.get("AddFriend",function (req, res, next) {
    res.render("account/editAddFriend", {
      friendForm: friendForm,
    });
    next();
  }
);

server.post("SaveAddress",function (req, res, next) {
  var friendList = null;
  var ListItem = null;
  var data = res.getViewData();
  var ListItemId = data.queryString.split("=")[1];
  var friendForm = server.forms.getForm("friend");
  var formData = friendForm.toObject();

  Transaction.wrap(function(){
    var AllFriendList = ProductListMgr.getProductLists(customer,100);
    if(AllFriendList.length == 0)
    {
      var newfriendList = ProductListMgr.createProductList(customer,100);
      friendList = newfriendList;
      Logger.info(friendList);
    }
    else
    {
      friendList = AllFriendList[0];
      Logger.info(friendList);
    }

      Transaction.wrap(function(){
        if(ListItemId != "")
        {
          var friendId = ListItemId;
          ListItem = friendList.getItem(friendId);
        }
        else
        {
          var product = ProductMgr.getProduct('shampo');
           ListItem  = friendList.createProductItem(product);
        }

      });

    ListItem.custom.name11 = formData.name;
    ListItem.custom.nickname11 = formData.nickname;
    ListItem.custom.birth11 = new Date(formData.birth);
    ListItem.custom.phoneNumber11 = formData.phone;

   res.redirect(URLUtils.url('Friend-List'));
  });
   next();
 }
);

server.get("List",function (req, res, next) {
   var friendList = null;
   friendForm.clear();

    Transaction.wrap(function () {
     var AllfriendList = ProductListMgr.getProductLists(customer, 100);
      if(AllfriendList.length != 0)
      {
        friendList = AllfriendList[0].getItems();
        Logger.info(friendList);
      }
    });

    res.render("account/friendBook", {
      sallo: friendList,
      friendForm :friendForm,
    });
    next();
  }
);


server.get("DeleteFriend",function (req, res, next) {

   var ListItemId = req.querystring.Id;


     Transaction.wrap(function(){
      var AllFriendList = ProductListMgr.getProductLists(customer,100);
      if(AllFriendList.length != 0)
      {
        var DeleteItem = AllFriendList[0].getItem(ListItemId);
        AllFriendList[0].removeItem( DeleteItem );
      }
     })

 res.redirect(URLUtils.url('Friend-List'));
  // res.json({success : true,UUID :ListItemId });
  next();
});

server.get("EditFriend",function (req, res, next) {

     var data = res.getViewData();
     var ListItemId = data.queryString.split("=")[1];
    var myData = null;
    var editItem = null;

    if(ListItemId){
    Transaction.wrap(function () {
     myData = ProductListMgr.getProductLists(customer,100);
     editItem = myData[0].getItem(ListItemId);

   });

   var date = editItem.custom.birth11;
   var ashu = (date.getDate()).length
   date = `${date.getYear()}-${(date.getMonth()+1) > 9 ? date.getMonth()+1 : `0${date.getMonth()+1}`}-${date.getDate() > 9 ? date.getDate() :`0${date.getDate()}`}`

    var obj = {
      name: editItem.custom.name11,
      nickname:editItem.custom.nickname11,
      birth: date,
      phone:editItem.custom.phoneNumber11
    }
    friendForm.clear();
    friendForm.copyFrom(obj);

    res.render("account/editAddFriend", { friendForm: friendForm,id:ListItemId });

}
    return next();
  }
);


module.exports = server.exports();