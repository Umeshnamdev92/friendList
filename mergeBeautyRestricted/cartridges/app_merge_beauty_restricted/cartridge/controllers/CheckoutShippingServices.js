"use strict";

/**
 * @namespace Address
 */

// Exteding the base controller
var server = require("server");
var page = module.superModule;
server.extend(page);

/**
 * Address-AddAddress : added title field using append
 * @name address_Categories_Bifercation/Address-AddAddress
 * @function
 * @memberof Address
 * @param {serverfunction} - get
 */

// server.append("SubmitShipping", function (req, res, next) {
//   var data = res.getViewData();
//   var form = server.forms.getForm('shipping');
//     data.address.title = form.shippingAddress.addressFields.title.value,
//   res.setViewData(data);
//   next();
// });

server.append("UpdateShippingMethodsList",(req,res,next)=>{
  var data = res.getViewData();
  var AddressModel = require("*/cartridge/models/address");
  var selectedAddress = req.querystring.selectedAddress;
  var currentCustomer = req.currentCustomer;
  var result = [];
  if (currentCustomer.addressBook) {
    for (var i = 0, ii = currentCustomer.addressBook.addresses.length; i < ii; i++) {
      var tempAddress = new AddressModel(currentCustomer.addressBook.addresses[i]).address;
      if (tempAddress.title == selectedAddress) {
        result.push(tempAddress);

      }
    }
  }
 data.customer = result;
 res.setViewData(data)

  next();
})

// server.append("SubmitShipping",(req,res,next)=>{
//   var data = res.getViewData();
//   var AddressModel = require("*/cartridge/models/address");
//   var selectedAddress = req.querystring.selectedAddress;
//   var currentCustomer = req.currentCustomer;
//   var result = [];
//   if (currentCustomer.addressBook) {
//     for (var i = 0, ii = currentCustomer.addressBook.addresses.length; i < ii; i++) {
//       var tempAddress = new AddressModel(currentCustomer.addressBook.addresses[i]).address;
//       if (tempAddress.title == selectedAddress) {
//         result.push(tempAddress);

//       }
//     }
//   }
//  data.customer = result;
//  data.order.shipping[0].shippingAddress = result[0]
//  res.setViewData(data)

//   next();
// })

module.exports = server.exports();

