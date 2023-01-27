'use strict'

var server = require("server");
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

server.get('getRequest',function(req,res,next){
    var requests = []
    var address = false
    if(customer.addressBook.addresses.length > 0){
        address = true;
    }
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

    res.render('friendList/requests',{requests:requests,address:address});
    next();
})

server.get('AcceptRequest',function(req,res,next){
    var CustomerMgr = require('dw/customer/CustomerMgr');

    var id = req.querystring.id;
    var status = null;
    var sender_customerNo = null;
    var receiver_customerNo = null;
    if(id != null){
    var customers = CustomerMgr.queryProfiles('firstName != null',null,'asc');
    while(customers.hasNext()){
        var list_of_customer = customers.next();
    Transaction.wrap(function(){
        var a = CustomObjectMgr.getCustomObject(`Requests`,id);
        if(list_of_customer.customerNo == a.custom.ReceiverAddress){
            receiver_customerNo = a.custom.ReceiverAddress;
            sender_customerNo = a.custom.SenderAddress;
        }
        a.custom.Status = true;
        status = a.custom.Status;
        })
    }
}
    res.redirect(URLUtils.url('FriendListUpdated-AcceptedRequestFriends','sender',sender_customerNo,'receiver',receiver_customerNo));
    next()
})

server.get('DeclineRequest',function(req,res,next){
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var id = req.querystring.id;
    var friend_request = CustomObjectMgr.getCustomObject(`Requests`,id);
    CustomObjectMgr.remove(friend_request);
    res.redirect(URLUtils.url('FriendListUpdated-AcceptedRequestFriends'));
    next();
})

module.exports = server.exports();