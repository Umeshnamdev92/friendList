'use strict';
// var base = module.superModule;

/**
 * Account class that represents the current customer's profile dashboard
 * @param {Object} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
// function getAddresses(addressBook) {	
//      var result = [];	
//      if (addressBook) {	
//        for (var i = 0, ii = addressBook.addresses.length; i < ii; i++) {	
//          var tempAddress = new AddressModel(addressBook.addresses[i]).address;	
//          if (tempAddress.title == "Home") {	
//            result.push(tempAddress);	
//          }	
//        }	
//      }	
//      return result;	
//    }	


function account(currentCustomer, addressModel, orderModel) {
    
    // To show beauty fields on my account page
    module.superModule.call(this, currentCustomer, addressModel, orderModel);

   if (currentCustomer.raw.profile) {
    this.profile.haircolor = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.customerHairColor : '';
    this.profile.eyecolor = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.customerEyeColor : '';
    this.profile.skintone = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.customerSkinTone : '';
    this.profile.skintype = currentCustomer.raw.profile ? currentCustomer.raw.profile.custom.customerSkinType : '';
   }
   if (currentCustomer) {
    try {
         if (currentCustomer.raw.profile.custom.userWallet!=null) {
              
              this.profile.userWallet = currentCustomer.raw.profile.custom.userWallet;
         }
         else{
              this.profile.userWallet = 0.00;
         }
    } catch (error) {
         if (this.profile) {
              this.profile.userWallet = 0.00;
         }
    }
}
}




module.exports = account;