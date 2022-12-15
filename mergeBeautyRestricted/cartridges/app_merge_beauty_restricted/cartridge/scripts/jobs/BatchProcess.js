//function for Editing the check wine attribute to false
function editWineAttribute() {
   var ProductMgr = require('dw/catalog/ProductMgr');
   var Transaction = require('dw/system/Transaction');
   Transaction.wrap(function () {
      var productList = ProductMgr.queryAllSiteProducts()
      while (productList.hasNext()) {
         var product = productList.next();
         if (product.custom.isWineOrNot != true) {
            product.custom.isWineOrNot = false;
         }
      }
   })
}
module.exports = {
   editWineAttribute: editWineAttribute
};