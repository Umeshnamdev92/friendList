$(document).ready(function(){
 console.log('HELLO');
 $('#minusPoint').click(function (e) {
  var form = $("#userWallet");
  e.preventDefault();
  console.log("helloeeee");

  var bonusPoint = $('#bonusPoint').val();
  var url = $("#Bonusurl").val();
  console.log(url);
  console.log(bonusPoint);

  $.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      data: {
        bonusPoint:bonusPoint
      },
      success: function (data) {
              console.log("hello ");
              console.log(data.success);

              if (data.success) {
              swal({
                title: "Bonus have been applied successfully",
                text: data.msg,
                icon: "success",
                button: "OK",
              });

              window.location.href="";

            }else{
              swal({
                title: "Sorry",
                text: data.msg,
                icon: "warning",
                button: "OK",
              });
            }
      },
      error: function (data) {
      console.log(data);
      }
  });
  return false;
});



 var storedBonus = $("#storedPoints").text();
 var bonus = $('#bonusPoint').val()

 var presentPoint = storedBonus - bonus;
 $("b").replaceWith(presentPoint);


 if (bonus > storedBonus) {
   if (presentPoint < storedBonus) {
     alert("not allowed")
   }
   alert("Reedem points can not be greater than Wallet point");
 }

console.log(presentPoint);
 console.log(bonus + "    " + storedBonus);


 if (!$('#bonusPoint').val()) {
   var msg = $('#bonusPoint').val();
   console.log("hello");
 } else {
   console.log("heeeee");
 }

});
