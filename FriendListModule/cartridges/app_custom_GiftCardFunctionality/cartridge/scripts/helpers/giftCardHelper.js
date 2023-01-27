'use strict';

// prepare a attributre for checking that total items has only gift card product or others - CUSTOM
function isOnlyGiftCard(items){
    var isOnlyGiftCard = false;
    items.forEach(function(tempItem , count){
        if(count >= 1)
        {
            if(tempItem.isGiftCard === false){
                isOnlyGiftCard = false;
            }
        }
        else
        {
            if(tempItem.isGiftCard === true)
            {
                isOnlyGiftCard = true;
            }
        }
    });
    return isOnlyGiftCard;
}

module.exports = {
    isOnlyGiftCard: isOnlyGiftCard
}