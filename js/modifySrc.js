setTimeout(function(){
    var iframe = document.querySelector("iframe");
    iframe.src = "http://www.kugou.com/";

    var a = document.querySelector("a");
    a.href = "http://www.kugou.com/";

    var img = document.querySelector("img");
    img.src = "http://www.kugou.com/common/images/default.png";

    var pic = new Image();
    pic.src = "http://www.kugou.com/common/images/default.png";//非法赋值不成功
    pic.style.cssText = "border:1px solid red";
    document.body.appendChild(pic);
},2000);