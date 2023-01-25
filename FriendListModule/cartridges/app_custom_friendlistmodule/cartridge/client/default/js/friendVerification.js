$(document).ready(function () {
    $('#friend_founded').on('submit', function (e){
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');

        $.ajax({
            url:url,
            type:'POST',
            data:form.serialize(),
            success: function(response){
                if(response.success == true){
                    alert(response.message);
                }
                else if(response.alreadyFriend == true){
                    alert(response.alreadyMessage);
                }
                else{
                    alert(response.error);
                }
                window.location.href = response.redirectURL;
            }

        })
    })
})