$( document ).ready(function() {
    var ratingVal = ($("#productRating").val()/5)*100;
    $(".progress-bar").css("width",`${ratingVal}%`);

    $(".star").append(`<i class="fa fa-star" id="starIcon"></i>`);

    if(ratingVal >= 78 && ratingVal <= 100){
        $(".progress-bar").css("background-color","#33d6ff");
    }
    else if(ratingVal >= 60 && ratingVal < 78){
        $(".progress-bar").css("background-color","#ffcc00");
    }
    else{
        $(".progress-bar").attr("background-color","red");
    }
});