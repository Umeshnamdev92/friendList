"use strict";

/**
 * @namespace Default
 */

var server = require("server");
var cache = require("*/cartridge/scripts/middleware/cache");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var pageMetaData = require("*/cartridge/scripts/middleware/pageMetaData");
var page = require("app_storefront_base/cartridge/controllers/Default.js");
var URLUtils = require("dw/web/URLUtils");
server.extend(page);
/** when sitepath is defined in the site aliases from business manager, homepage will be rendered directly */
/**
 * Extend Default-Start : This end point is the root of the site, when opening from the BM this is the end point executed
 * @name Base/Default-Start
 * @function

 * @memberof Default
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - cache.applyDefaultCache
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace(
  "Start",
  consentTracking.consent,
  cache.applyDefaultCache,
  function (req, res, next) {
    var Site = require("dw/system/Site");
    var PageMgr = require("dw/experience/PageMgr");
    var pageMetaHelper = require("*/cartridge/scripts/helpers/pageMetaHelper");
    var Logger = require("dw/system/Logger");
    var Geolocation = require("dw/util/Geolocation");
    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);

    var page = PageMgr.getPage("homepage");
    var locator = req.geolocation.countryCode;
    Logger.error("abcd", locator);
    if (locator == "IN") {
      request.setLocale("en_IN");
    } else {
      request.setLocale("en_US");
    }
    if (page && page.isVisible()) {
      res.page("homepage");
    } else {
      res.render("home/homePage");
    }
    res.redirect(URLUtils.url("Home-Show"));
    next();
  },
  pageMetaData.computedPageMetaData
);
module.exports = server.exports();
