'use strict'

var server = require('server');
var ProductListMgr = require('dw/customer/ProductListMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var Logger = require('dw/system/Logger');


/*
* WishList-Addwishlist : The Addwishlist function will be called when user click on wishlist button
* @param {serverfunction} - post
* @param {querystringparameter} - productID -string is used identify a particular product
* @param {returns} - json
* createProductList - used to create a list.
* getProductLists - used to get a list.
*/
server.post("Addwishlist",userLoggedIn.validateLoggedInAjax, function (req, res, next) {

    var responseData = res.getViewData()
    if(responseData.loggedin == true)
    {
    var Transaction = require('dw/system/Transaction');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var pid = req.querystring.pid;
    var product = ProductMgr.getProduct(pid);

    Transaction.wrap(function(){
        var flag = false;
        var Data = ProductListMgr.getProductLists(customer,101);
        if(Data.length == 0){
            var data = ProductListMgr.createProductList(customer,101);
            Data = data;
        }
        else{
            Data = Data[0];
        }
        var newProductList = Data.getItems();

        for(var i=0; i< newProductList.length; i++){
            if(newProductList[i].productID === pid){
                flag = true;
                break;
            }
        }

        if(flag == false){
            var productList = Data.createProductItem(product);
            res.json({
                success : true
            });
        }
        else{
            res.json({
                success : false
            })
        }
    });
    }
    else{
        res.json(responseData);
    }


    next();
});


/*
* Wishlist-WishlistCount : The WishlistCount function is used to count the number of products into a wishlist cart.
*/
server.get('WishlistCount', function(req, res, next){
    var count = null
    var Data = ProductListMgr.getProductLists(customer,101);
    try {
        count = (Data[0].items.length).toFixed();
    } catch (error) {
        count = Data.length.toFixed();
    }

    res.render('/wishlist/wishlistcart',{
        count : count
    });
    next();
})


/*
* Wishlist-Show : The Show function is used to show those products which are added into the wishlist cart.
* @param {renders} - isml
* @param {returns} - json
*/
server.get('Show', function(req, res, next){
    var Data = ProductListMgr.getProductLists(customer,101);
    if(Data.length == 0){
        res.json({to:"error"})
    }
    else{
        var productList = Data[0].getItems();
    }
    res.render('wishList',{
        productList : productList
    })
    next();
});


/*
* Wishlist-GetSize : These end point is  called to get the wishlist product size
* @param {querystringparameter} - optionID - string is used identify a particular product
* @param{serverfunction} - get
*  @param {renders} - isml
*/
server.get('GetSize', function(req, res, next){
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var Data = ProductListMgr.getProductLists(customer,101);
    var optionId = req.querystring.optionID;
    var disableOption = false;
    var isVariant = req.querystring.isVarient;
    var params = {
        pid: optionId
    };
    var fatctoryValues = ProductFactory.get(params);
    var size = fatctoryValues.variationAttributes[1].values;
    var sizeID = fatctoryValues.variationAttributes[1].values.id;
    if(fatctoryValues.variationAttributes[1].values){
        disableOption = true
    }
    else{
        disableOption = false
    }
    res.render('/wishlist/size/size',{
        sizes:size,
        optionId:optionId,
        sizeID:sizeID,
        disableOption:disableOption,
        isVariant:isVariant
    });
    next();
});


/**
 *Wishlist-Variation : This endpoint is called when user select any of the size using various size button on show wishlist page 
 * @param {querystringparameter} - pid - Product ID
 * @param {querystringparameter} - sizeID - Size Attribute ID
 *@param {serverfunction} - get
 *@param {returns} - json
 */
server.get('Variation', function(req, res, next){
    var Logger = require('dw/system/Logger');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var data = req.querystring;
    var params = {
        pid: data.pid,
        quantity: 1,
        variables : {
            size : {
                id: data.pid,
                value: data.sizeID
            }
        }
    }
    var product = ProductFactory.get(params);
    var variationId = product.id;
    res.json({
        success : true,
        variationId: variationId,
        pid: data.pid,
        sizeId : data.sizeID,
        disableOption : data.disableOption
    });
    next();
});

/**
 *Wishlist-Delete : This endpoint is called when user click on the delete button
 * @param {querystringparameter} - pid - Product ID
 * @param {List} - get a list of objects whose wishlist product is to be deleted
 * @param {serverfunction} - post
 * @param {returns} - json
 */

server.post("Delete", function(req, res, next){
    var Transaction = require('dw/system/Transaction');
    var deleteId = req.querystring.pid;
    var list = ProductListMgr.getProductLists(customer,101);
    Transaction.wrap(function(){
        var item = list[0].getItem(deleteId);
        list[0].removeItem(item);
    })

    var length = list[0].items.length;

    res.json({
        success : true,
        deleteId: deleteId,
        length: length
    });

    next();
});

module.exports = server.exports();