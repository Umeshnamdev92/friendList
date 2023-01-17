'use strict'
function getPreferences(){
    var Site = require("dw/system/Site");
    var ArrayList = require('dw/util/ArrayList');
    // Arraylist for updating options in XML Form
    var skintoneAttributes = new ArrayList();
    var skintypeAttributes = new ArrayList();
    var haircolorAttributes = new ArrayList();
    var eyecolorAttributes = new ArrayList();

    // Dyanamic Beauty attributes by Site preference
    var beautyAttributes =
      Site.current.preferences.getCustom()["BeautyAttributeOptions"];
    var beautyAttributesObj = JSON.parse(beautyAttributes);

    // Prepare array List for dynamic options
    beautyAttributesObj.skintone.forEach((element) => {
      skintoneAttributes.add({ key: element, value: element });
    });
    beautyAttributesObj.skintype.forEach((element) => {
      skintypeAttributes.add({ key: element, value: element });
    });
    beautyAttributesObj.haircolor.forEach((element) => {
      haircolorAttributes.add({ key: element, value: element });
    });
    beautyAttributesObj.eyecolor.forEach((element) => {
      eyecolorAttributes.add({ key: element, value: element });
    });

    // Setting optons dynamically in form
    session.forms.profile.customer.skintone.setOptions(
      skintoneAttributes.iterator()
    );
    session.forms.profile.customer.eyecolor.setOptions(
      eyecolorAttributes.iterator()
    );
    session.forms.profile.customer.haircolor.setOptions(
      haircolorAttributes.iterator()
    );
    session.forms.profile.customer.skintype.setOptions(
      skintypeAttributes.iterator()
    );
}


module.exports = {
    getPreferences: getPreferences
};