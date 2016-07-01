var div = document.querySelector("div");
div.style.cssText = "border:1px solid red;height:200px;";
div.onclick = function(){
    window.open("http://www.kugou.com/","_blank");
};
setTimeout(function(){
    div.style.background = "url(http://www.kugou.com/common/images/default.png)";
},500);