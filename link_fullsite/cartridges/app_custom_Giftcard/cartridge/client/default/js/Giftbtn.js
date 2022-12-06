$(document).ready(function () {

    $("#sub").click(function () {
        alert("ddd");
        $.ajax({
            url: "Order-newSubmit",
            method: "POST",
            data: $("#myform").serialize(),
            success: function (resp) {
             console.log(resp);
             if(resp.success){
              // alert("Your data sent Successfully");
              document.getElementById("myform").reset();
              $("#myModal").modal();
             }
            },
          });
      
      });
    });
    