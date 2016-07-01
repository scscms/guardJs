# javascript防劫持<sup>shine</sup>
## 什么是javascript劫持
javascript劫持属于HTTP劫持中的一种，主要是劫持js文件，然后在网页中通过js脚本往网页中注入图片和链接或者框架广告，也叫流量劫持。
文明一点的劫持只是右下角放一个固定广告，不文明的就自动弹出新广告窗口（一般会被浏览器拦截）或者给整个网页添加点击事件弹出新广告页面。
## javascript劫持套路
### 1、document.write注入
假如页面中正常请求的是a.js，a.js请求被劫持后返回的脚本就可能是这样的：
```JavaScript
document.writeln('<script type="text/javascript" src="http://www.xxx.com/a.js?tcdsp=true"><\/script>');
document.write('<script type="text/javascript" src="http://www.bbb.com/ad.js"><\/script>');
document.write('其他脚本标签或字符');
```
因为要保证页面正常，所以劫持者会还原a.js请求，为了避免死循环，所以在被劫持的js请求里添加特定的参数作区别，同时插入自己的js广告文件链接。
案例查看[01_write.html](https://rawgit.com/scscms/guardJs/master/01_write.html)

#### 对策：过滤document.write,document.writeln字符
>重写这两个方法，并在字符串中正则匹配完整script标签，并提取scr对比白名单，符合的就写入script标签。其他文本或标签全部忽略。
缺点：杀伤力过强。如果document.write把字符分开多次写入会漏检查或者说绕过检查。
注意：文档中尽量不要使用document.write\writeln形式插入标签！
保护文件[01_write_guard.html](https://rawgit.com/scscms/guardJs/master/01_write_guard.html)

### 2、HTMLElement.innerHTML注入
通过innerHTML可以注入各种标签。
案例查看[02_innerHTML.html](https://rawgit.com/scscms/guardJs/master/02_innerHTML.html)
#### 对策：过滤innerHTML注入标签不能是框架和script。
>重写HTMLElement.innerHTML方法，并在字符串中正则匹配`/<(i?frame|script).+?<\/\1>/gi`并过滤掉。
缺点：非法的图片和链接等没有过滤。也不能简单提取字符中的链接地址比较，因为很可能会误杀。所以其他标签等其生成后再逐个逐个检查。
注意：建议iframe不要通过innerHTML生成！
保护文件[02_innerHTML_guard.html](https://rawgit.com/scscms/guardJs/master/02_innerHTML_guard.html)

### 3、HTMLElement.appendChild、HTMLElement.insertBefore注入
通过appendChild、insertBefore可以注入各种标签。
案例查看[03_appendChild.html](https://rawgit.com/scscms/guardJs/master/03_appendChild.html)
#### 对策：限制appendChild、insertBefore插入某些标签，比如iframe|frame|link|style|audio|video|embed|object按实际情况调整。
>重写HTMLElement.appendChild、insertBefore方法，检查到指定的标签禁止插入。并改写HTMLElement.replaceChild方法转到insertBefore方法上检查。插入的标签并检查其style是否含有非法连接。
缺点：无法检查其绑定事件是否非法，这是防劫持最难的部分。
注意：建议iframe|frame|link|style严禁创建这些标签，禁用link|style的目的是避免注入者使用背景图片来显示广告内容！
保护文件[03_appendChild_guard.html](https://rawgit.com/scscms/guardJs/master/03_appendChild_guard.html)

### 4、修改src或href劫持现有标签
因禁止直接插入firame，那么劫持者可能会通过修改现有iframe或img或a的href达到劫持目的。
案例查看[03_appendChild.html](https://rawgit.com/scscms/guardJs/master/03_appendChild.html)
#### 对策：针对img|script|iframe|frame|a标签修改src或href的值进行过滤。
>这些标签在节点生成前需要检查其src值是否合法。或者是已经存在的节点需要修改src也需要检查其合法，不合法将还原其赋值。
缺点：部分src、href值是否合法比较难界定，如href="javascript:..."或者图片src="data:images/..."等。
注意：script必须赋值前就过滤，赋值后再删除已经没有意义了，代码已经存入内容并已经执行了。img,a标签事后删除倒没影响。
保护文件[03_appendChild_guard.html](https://rawgit.com/scscms/guardJs/master/03_appendChild_guard.html)

### 5、修改现有标签style和绑定事件弹出窗口
形成广告还有一种另类的方法，就是使用div等块标签通过样式使用背景图片来实现。并添加点击事件使用window.open弹出窗口。
案例查看[05_modifyStyle.html](https://rawgit.com/scscms/guardJs/master/05_modifyStyle.html)
#### 对策：监听属性修改，重写window.open方法。
>对所有标签监听style,href,src属性的修改，发现非法链接地址将还原属性。并对window.open方法重写，阻止非法链接弹出。
缺点：因location.href,location.replace,location.assign方法都是只读，不能进行重写来排除非法链接。不过劫持者如果非要替换本页面来达到广告目的也失去了原来的意义。
注意：如果自己也有广告弹出，必须非常小心过滤规则。
保护文件[05_modifyStyle_guard.html](https://rawgit.com/scscms/guardJs/master/05_modifyStyle_guard.html)

### 6、文档末内注入广告脚本
html文件同样会被劫持，所以源代码被注入广告脚本也是很正常，虽然超出js劫持范围。
案例查看[06_html.html](https://rawgit.com/scscms/guardJs/master/06_html.html)
#### 对策：如果注入的广告元素在本防劫持脚本之后，还是有点希望可删除的。通过window.MutationObserver监视DOM变动事件，逐个节点判断是否合法。
>window.MutationObserver是监视DOM变动完成后执行的方法，包括节点元素属性变化。如果有多次变化会等所有变化完成后再执行，从性能上保证节点变化中途不影响。
缺点：大部注入节点都可顺利删除，但script标签一旦加载完成再删除节点是没有任何意义。还有无法阻止iframe被赋值到非法网站中。
注意：尽量不要在页面中使用iframe框架。
保护文件[06_html_guard.html](https://rawgit.com/scscms/guardJs/master/06_html_guard.html)

## 防劫持难题
html,css文件被劫持且修改，js爱莫能助。对节点绑定一些恶意函数无法鉴别和清理。