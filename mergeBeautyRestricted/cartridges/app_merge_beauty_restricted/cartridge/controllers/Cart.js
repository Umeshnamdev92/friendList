"use strict";
/**
 * @namespace Cart
 */

var server = require("server");
var Base = module.superModule;
server.extend(Base);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var validAddToCart = require('*/cartridge/scripts/middleware/validAddToCart');

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name app_merge_beauty_restricted/Cart-AddProduct
 * @function
 * @memberof Cart
 * @param {httpparameter} - pid - product ID
 * @param {httpparameter} - quantity - quantity of product
 * @param {httpparameter} - options - list of product options
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('AddProduct', validAddToCart.validateRestrictedProduct ,function (req, res, next) {
  var BasketMgr = require('dw/order/BasketMgr');
  var Resource = require('dw/web/Resource');
  var URLUtils = require('dw/web/URLUtils');
  var Transaction = require('dw/system/Transaction');
  var CartModel = require('*/cartridge/models/cart');
  var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
  var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
  var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  var restrictedDetails = res.getViewData();
  var data;
  if(restrictedDetails.validateRestrictedProduct == false)
  {
    res.json(restrictedDetails)
  }
  else
  {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
  var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
  var productId = req.form.pid;
  
  if(req.form.giftdetail){
    var giftdetailData =JSON.parse(req.form.giftdetail);
    data = giftdetailData[0]
  }
  var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
      ? JSON.parse(req.form.childProducts)
      : [];
  var options = req.form.options ? JSON.parse(req.form.options) : [];
  var quantity;
  var result;
  var pidsObj;
  var text;

//   var sitePref = dw.system.Site.current.preferences.custom.stopWords;
//   var siteArr = JSON.parse(sitePref);
//   var msg = options.engravingMessage;
  
   
//   siteArr.map((item)=>{
//     msg.map((item2)=>{
//         if (item == item2){
//             res.setStatusCode(400)
//             res.json({error:true,errorMessage:"Message is Not Allowed Please change it"})
//         }
//     })
//   })
//   var sitePref = dw.system.Site.current.preferences.custom.stopWords;
// //   var siteArr = JSON.parse(sitePref);
//   var msg = options[1].engravingMessage;
//   var result = false;
//   for(let i=0; i<sitePref.length ; i++){
//       if(msg.includes(sitePref[i])){
//            result = true;
//       }
//     }
// let msg = "Hello world, welcome to the universe.";
// let arr = ["bc","mc","god"];
// let result = false;
// for(let i=0; i<arr.length ; i++){
//   if(msg.includes(arr[i])){
//       result = true;

//   }
// }

  if (currentBasket) {
      Transaction.wrap(function () {
         text= productId.toString();
            if (text.includes("Gift_Card")) {
                var tocreategiftcertificatelineitem = currentBasket.createGiftCertificateLineItem(parseInt(options[0].selectedValueId), "aamir.bohra@codesquaretech.com");
                tocreategiftcertificatelineitem.setRecipientEmail(data.recipientEmail);
                tocreategiftcertificatelineitem.setMessage(data.message);
                tocreategiftcertificatelineitem.setSenderName(data.senderName);
                tocreategiftcertificatelineitem.custom.note = data.note;
                tocreategiftcertificatelineitem.setRecipientName(data.recipientName);
                }
          if (!req.form.pidsObj) {
              quantity = parseInt(req.form.quantity, 10);
              result = cartHelper.addProductToCart(
                  currentBasket,
                  productId,
                  quantity,
                  childProducts,
                  options
              );
          } else {
              // product set
              pidsObj = JSON.parse(req.form.pidsObj);
              result = {
                  error: false,
                  message: Resource.msg('text.alert.addedtobasket', 'product', null)
              };

              pidsObj.forEach(function (PIDObj) {
                  quantity = parseInt(PIDObj.qty, 10);
                  var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                  var PIDObjResult = cartHelper.addProductToCart(
                      currentBasket,
                      PIDObj.pid,
                      quantity,
                      childProducts,
                      pidOptions
                  );
                  if (PIDObjResult.error) {
                      result.error = PIDObjResult.error;
                      result.message = PIDObjResult.message;
                  }
              });
          }
          if (!result.error) {
              cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
              basketCalculationHelpers.calculateTotals(currentBasket);
          }
      });
  }

  var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
  var cartModel = new CartModel(currentBasket);

  var urlObject = {
      url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
      configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
      addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
  };

  var newBonusDiscountLineItem =
      cartHelper.getNewBonusDiscountLineItem(
          currentBasket,
          previousBonusDiscountLineItems,
          urlObject,
          result.uuid
      );
  if (newBonusDiscountLineItem) {
      var allLineItems = currentBasket.allProductLineItems;
      var collections = require('*/cartridge/scripts/util/collections');
      collections.forEach(allLineItems, function (pli) {
          if (pli.UUID === result.uuid) {
              Transaction.wrap(function () {
                  pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                  pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
              });
          }
      });
  }

  var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, result.error);

  res.json({
      reportingURL: reportingURL,
      quantityTotal: quantityTotal,
      message: result.message,
      cart: cartModel,
      newBonusDiscountLineItem: newBonusDiscountLineItem || {},
      error: result.error,
      pliUUID: result.uuid,
      minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
  });

  }

  next();
});
module.exports = server.exports();