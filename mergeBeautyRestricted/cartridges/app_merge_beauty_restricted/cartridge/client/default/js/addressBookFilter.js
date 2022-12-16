$(function(){
        $('.homeAddressCardDiv').css('display',"flex");
        $('.officeAddressCardDiv').css('display',"none");
        $('.otherAddressCardDiv').css('display',"none");
})

$('input[type=radio][name=title]').change(function(e) {
  e.preventDefault();
  $.spinner().start();

  if(this.id == "Home"){
    $('.homeAddressCardDiv').css('display',"flex");
    $('.officeAddressCardDiv').css('display',"none");
    $('.otherAddressCardDiv').css('display',"none");
  }
  if(this.id == "Office"){
    $('.homeAddressCardDiv').css('display',"none");
    $('.officeAddressCardDiv').css('display',"flex");
    $('.otherAddressCardDiv').css('display',"none");
  }
  if(this.id == "Other"){
    $('.homeAddressCardDiv').css('display',"none");
    $('.officeAddressCardDiv').css('display',"none");
    $('.otherAddressCardDiv').css('display',"flex");
  }
   $.spinner().stop();
// console.log(div,"div")
// // var div2 = div.getAttribute('title')
// // console.log(div2,"div2")

// var frnd = $('.addressCardDiv').data("title");
// console.log(frnd,"frnd")

//   $.ajax({
//     url: $(".addressFilter").val(),
//     method: "POST",
//     dataType: "json",
//     data: {
//       title: this.id,
//     },
//     success: function (response) {
//         console.log(response,"resp")
//         $('.addressBookFiltered').html('')
//         response.addressBook.map((address)=>{
//             if(address.address){
//            return $('.addressBookFiltered').append(`<div class="row justify-content-center" id="uuid-${address.address.UUID}">
//            <div class="col-sm-8 col-md-6">
//                <div class="card">
//                    <div class="card-header">
//                        <h2 class="address-heading pull-left">${address.default ? address.address.ID+' ('+response.resource.defaultaddress+')' : address.address.ID}</h2>
//                        <a href="${response.urlUtils.EditAddress+'?addressId='+address.address.ID}" class="pull-right" aria-label="${response.resource.editaddress} : ${address.default ? address.address.ID+' ('+response.resource.defaultaddress+')' : address.address.ID}">${response.resource.linkEdit}</a>
//                    </div>
//                    <div class="card-body card-body-positioning">
//                        <div>${address.address.firstName} ${address.address.lastName}</div>
//                        <div>${address.address.address1}</div>
//                            ${address.address.address2 !== null ?`<div>${address.address.address2}</div> `:null }
//                        <div>${address.address.city}, ${address.address.stateCode} ${address.address.postalCode}</div>
//                        <div>${address.address.phone}</div>
//                        ${!address.default ? ` <div class="card-make-default-link">
//                        <a href="${response.urlUtils.SetDefault+"?addressId="+address.address.ID}" class="normal" aria-label="${response.resource.makedefaultaddress}">${response.resource.makedefault}</a>
//                    </div>`: ''}
//                        <button
//                            type="button"
//                            class="remove-btn remove-address btn-light"
//                            data-toggle="modal"
//                            data-target="#deleteAddressModal"
//                            data-id="${address.address.ID}"
//                            data-url="${response.urlUtils.DeleteAddress+"?addressId="+address.address.ID+'?isDefault='+address.default}"
//                            aria-label="${response.resource.deleteaddress}"
//                            ${address.default ? 'data-default="true"' : 'data-default="true"' }>
//                            &times;
//                        </button>
//                    </div>
//                </div>
//            </div>
//        </div>`)}
//         })
//         // $('.addressBookFiltered').html(addressList)
//       $.spinner().stop();
//     },
//     error: function () {
//       $.spinner().stop();
//     },
//   });
});