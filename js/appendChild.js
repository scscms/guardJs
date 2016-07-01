var n = 0;
function qx(){
    console.log("qxqx");
    if(!document.getElementById("img")){
        var s = new Image();
        s.id = "img";
        s.src = "http://202.105.165.202:8888/tb/zsdx/20160622145522/images/201606221454315960.jpg";
        document.body.appendChild(s);
    }
    if(n++ % 6 == 0){
        !document.getElementById("div") && document.body.appendChild(d);
        t.src="http://202.105.165.202:8888/tb/zsdx/20160622145522/images/201606221454315960.jpg";//潜入者定时复活！！！
    }
}
setInterval(qx,2000);//定时器恶意插入

//插入潜入者，定时后才修改src
var t = new Image();
t.style.cssText = "border:1px solid red";
t.src = "";
document.body.appendChild(t);

//使用innerHTML生成iframe　定时插入！！
var d = document.createElement("a");
d.id = "div";
d.href = "http://www.baidu.com/";
d.innerHTML = '<img src="http://202.105.165.202:8888/tb/zsdx/20160622145522/images/201606221454315960.jpg" />';

var a = document.createElement("a");
d.innerHTML = '我是正常的link';
d.href = "javascript:void(0)";
document.body.appendChild(d);