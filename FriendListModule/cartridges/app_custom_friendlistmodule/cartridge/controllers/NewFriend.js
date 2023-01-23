'use strict'

var server = require("server");
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

server.get('getRequest',function(req,res,next){
    var requests = []

    var a = CustomObjectMgr.getAllCustomObjects('Requests');
    while(a.hasNext()){
        var object = a.next();
        if(customer.profile.customerNo == object.custom.ReceiverAddress){
            requests.push({
                object:object,
                customer:customer
            });
        }    
    }

    res.render('friendList/requests',{requests:requests});
    next();
})

server.get('AcceptRequest',function(req,res,next){
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var id = req.querystring.id;
    var status = null;
    var customerNo = null;
    
    var customers = CustomerMgr.queryProfiles('firstName != null',null,'asc');
    while(customers.hasNext()){
        var list_of_customer = customers.next();
    Transaction.wrap(function(){
        var a = CustomObjectMgr.getCustomObject(`Requests`,id);
        if(list_of_customer.customerNo == a.custom.ReceiverAddress){
            customerNo = a.custom.ReceiverAddress;
        }
        a.custom.Status = true;
        status = a.custom.Status;

    })
}

    res.redirect(URLUtils.url('FriendListUpdated-AcceptedRequestFriends','id','status','customer',id,status,customerNo));
})

module.exports = server.exports();