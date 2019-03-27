function goTop() {
    var
        animationTime = 300,
        framesCount = 30;
    scroller = setInterval(function () {
        let scrollBy = window.pageYOffset / framesCount;
        if(window.pageYOffset > 0) {
            window.scrollBy(0, -scrollBy);
        } else {
            clearInterval(scroller);
        }
    }, animationTime / framesCount);

    window.onwheel = function() {
        clearInterval(scroller);
    };
}
