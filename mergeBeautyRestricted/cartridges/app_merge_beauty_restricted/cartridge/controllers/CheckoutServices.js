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

server.append("PlaceOrder", function (req, res, next) {
  var data = res.getViewData();
  var Site = require('dw/system/Site');

  var mySitePrefValue = Site.getCurrent().getCustomPreferenceValue('addressType')
  var addresstypes = JSON.parse(mySitePrefValue);
  data.addresstypes = addresstypes;
  res.setViewData(data);
  next();
});
module.exports = server.exports();

