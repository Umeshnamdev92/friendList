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
  var ProductMgr = require('dw/catalog/ProductMgr');
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
            var tempProduct = ProductMgr.getProduct(productId);
                if (tempProduct.custom.isGiftCard) {
                var imgUrl = tempProduct.getImages('medium')[0].url
                var giftLineItem = currentBasket.createGiftCertificateLineItem(parseFloat(options[0].selectedValueId), data.recipientEmail);
               giftLineItem.setRecipientEmail(data.recipientEmail);
               giftLineItem.setMessage(data.message);
               giftLineItem.setSenderName(data.senderName);
               giftLineItem.setRecipientName(data.recipientName);
               giftLineItem.custom.productLineItemUUID = result.uuid ;
               giftLineItem.custom.imgUrl = URLUtils.home().toString().split(".com/")[0]+".com"+imgUrl;
               
                }
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


server.replace('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isProductLineItemFound = false;
    var bonusProductsUUIDs = [];

    Transaction.wrap(function () {
        if (req.querystring.pid && req.querystring.uuid) {
            var productId=req.querystring.pid;
            var productLineItems = currentBasket.getAllProductLineItems(req.querystring.pid);
            var bonusProductLineItems = currentBasket.bonusLineItems;
            var mainProdItem;
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if ((item.UUID === req.querystring.uuid)) {
                    if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                        for (var j = 0; j < bonusProductLineItems.length; j++) {
                            var bonusItem = bonusProductLineItems[j];
                            mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                            if (mainProdItem !== null
                                && (mainProdItem.productID === item.productID)) {
                                bonusProductsUUIDs.push(bonusItem.UUID);
                            }
                        }
                    }
                    // ........................gift line item remove..........................
                    var tempProduct = ProductMgr.getProduct(productId);
                    if (tempProduct.custom.isGiftCard) {
                       
                        var allGiftLineItems=currentBasket.getGiftCertificateLineItems()
                        
                        for (let i = 0; i < allGiftLineItems.length; i++) {
                            var giftLineItemId=allGiftLineItems[i].custom.productLineItemUUID;
                            if(item.UUID==giftLineItemId){
                            currentBasket.removeGiftCertificateLineItem(allGiftLineItems[i])
                            }
                        }
                    }
        


                    //..........................gift line item remove...................
                    var shipmentToRemove = item.shipment;
                    currentBasket.removeProductLineItem(item);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isProductLineItemFound = true;
                    break;
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (isProductLineItemFound) {
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel,
            toBeDeletedUUIDs: bonusProductsUUIDs
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});


/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name Base/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Show', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, function (req, res, next) {
    var GiftCardHelper = require('*/cartridge/scripts/helpers/giftCardHelper');
    var responseData = res.getViewData();
    var isOnlyGiftCard = GiftCardHelper.isOnlyGiftCard(responseData.items)
    responseData.isOnlyGiftCard = isOnlyGiftCard;
    res.setViewData(responseData);
    next();
}
);
module.exports = server.exports();