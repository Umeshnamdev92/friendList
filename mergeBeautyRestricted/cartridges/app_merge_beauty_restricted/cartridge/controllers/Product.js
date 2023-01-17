'use strict';

// Extending The controller
var server = require('server');
var page = module.superModule;
server.extend(page);

// Requiring API
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var URLUtils = require('dw/web/URLUtils');

/**
 * Product-Show : This endpoint is called to show the details of the selected product
 * @name app_merge_beauty_restricted/Product-Show
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var Site = require('dw/system/Site');

    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;

    // recommendation
    var recommendationArr = [];
    // taking site preference value for tilecount
    var tileCount = Site.current.preferences.custom.numberOfProductTiles; // Value for showing tile in one row
    var recommendationIterator = showProductPageHelperResult.product.orderableRecommendations ? showProductPageHelperResult.product.orderableRecommendations.iterator() : null;
    if(recommendationIterator)
    {
        while (recommendationIterator.hasNext()) {
            var tempRecommendation = recommendationIterator.next();
            recommendationArr.push({ product: tempRecommendation.recommendedItem }) // adding recommended product in Array
        }
    }

    //validate restrited product
    if ((showProductPageHelperResult.product.isWineOrNot == true && !customer.isAuthenticated()) || (customer.isAuthenticated() && customer.isMemberOfCustomerGroup('age-less-18') && showProductPageHelperResult.product.isWineOrNot == true)) {
        res.redirect(URLUtils.url('Product-RestrictedResult'));
    }
    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        var pageLookupResult = productHelper.getPageDesignerProductPage(showProductPageHelperResult.product);
        if ((pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) || pageLookupResult.invisiblePage) {
            // the result may be different for another user, do not cache on this level
            // the page itself is a remote include and can still be cached
            res.cachePeriod = 0;
        }
        if (pageLookupResult.page) {
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        } else {
            res.render(showProductPageHelperResult.template, {
                product: showProductPageHelperResult.product,
                addToCartUrl: showProductPageHelperResult.addToCartUrl,
                resources: showProductPageHelperResult.resources,
                breadcrumbs: showProductPageHelperResult.breadcrumbs,
                canonicalUrl: showProductPageHelperResult.canonicalUrl,
                schemaData: showProductPageHelperResult.schemaData,
                recommendations: recommendationArr,
                tileCount: Math.round(70 / tileCount)
            });
        }
    }

    next();
}, pageMetaData.computedPageMetaData);

/**
 * Product-RestrictedResult : Redirect to the error page if product is Restricted
 * @name app_merge_beauty_restricted/Product-RestrictedResult
 * @function
 */
server.get('RestrictedResult', function (req, res, next) {
    res.render('restrictedError');
    next();
});

module.exports = server.exports();