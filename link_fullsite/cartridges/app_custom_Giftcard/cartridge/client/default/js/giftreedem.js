$(document).ready(function () {
    console.log('HELLO');
    $('#reedemgiftcardbalance').click(function (e) {
     e.preventDefault();
     console.log('helloeeee');
     var GiftCardCode = $('#GiftCardCode').val();
      var redeemamount = $('#redeemamount').val();
     var url = $('#GiftCardreedemurl').val();
     console.log(GiftCardCode,"caerd");
     console.log( url,"url");

     $.ajax({
       url: url,
       type: 'GET',
       data: {
         GiftCardCode: GiftCardCode,
         redeemamount: redeemamount
       },
       success: function (data) {
                 console.log('hello ');
                 console.log(data.success);
                 if (data.success) {
                 swal({
                   title: 'Gift card have been applied successfully',
                   text: data.msg,
                   icon: 'success',
                   button: 'OK',
                 });
                  // window.location.href = '';
               } else {
                 swal({
                   title: 'Sorry',
                   text: data.msg,
                   icon: 'warning',
                   button: 'OK'
                 });
               }
         },
         error: function (data) {
         console.log(data);
         }
     });
     return false;
    });


//     var storedBonus = $('#storedPoints').text();
//     var bonus = $('#bonusPoint').val()
//     var presentPoint = storedBonus - bonus;
//     $('b').replaceWith(presentPoint);
//     if (bonus > storedBonus) {
//       if (presentPoint < storedBonus) {
//         alert('not allowed')
//       }
//       alert('Reedem points can not be greater than Wallet point');
//     }
//    console.log(presentPoint);
//     console.log(bonus + '    ' + storedBonus);
//     if (!$('#bonusPoint').val()) {
//       var msg = $('#bonusPoint').val();
//       console.log('hello');
//     } else {
//       console.log('heeeee');
//     }
//    });
//        $('form.userWallet2').submit(function (e) {
//          var form = $(this);
//          e.preventDefault();
//          var url = form.attr('action');
//          $.ajax({
//              url: url,
//              type: 'post',
//              dataType: 'json',
//              data: form.serialize(),
//              success: function (data) {
//                      console.log('hello ');
//                      console.log(data);
//              },
//              error: function (data) {
//              console.log(data);
//              }
//          });
//          return false;
});
     // $('#removeBonusPoint').click(function (e) {
     //   e.preventDefault();
     //   var url = $('#remove').val();
     //   console.log(url);
     //   $.ajax({
     //       url: url,
     //       type: 'get',
     //       dataType: 'json',
     //       data: {
     //         bonusPoint:bonusPoint
     //       },
     //       success: function (data) {
     //               console.log('hello ');
     //               console.log(data.success);
     
     //               if (data.success) {
     //               swal({
     //                 title: 'Bonus have been applied successfully',
     //                 text: data.msg,
     //                 icon: 'success',
     //                 button: 'OK',
     //               });
                 
     //               window.location.href='';
                   
     //             }else{
     //               swal({
     //                 title: 'Sorry',
     //                 text: data.msg,
     //                 icon: 'warning',
     //                 button: 'OK',
     //               });
     //             }
     //       },
     //       error: function (data) {
     //       console.log(data);
     //       }
     //   });
     //   return false;
     // });