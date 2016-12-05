/*
 * 功能：js防挟持
 * 作者：shine
 * 日期：2016-06-21
 * */
//http://www.cnblogs.com/coco1s/p/5777260.html
!function (d,w,r) {
    "use strict";//此文件以script代码块放到文档脚部，其他任何js代码之前，并非使用外链引入（以防反劫持反而被劫持）！！！
    self != top && (top.location = location.href);//解决html被iframe。
    if(Object.defineProperty){
        Object.defineProperty(Function.prototype, "call", {
            value: Function.prototype.call,writable: false,configurable: false,enumerable: true// 锁住 call
        });
        Object.defineProperty(Function.prototype, "apply", {
            value: Function.prototype.apply,writable: false,configurable: false,enumerable: true// 锁住 apply
        });
    }
    var _wr = d.write,//备用方法
        wo = w.open,//备用方法
        h = w.HTMLElement,
        MutationObserver = w.MutationObserver || w.WebKitMutationObserver || w.MozMutationObserver,//变动观察器,监视DOM变动的接口
        reg = /(https?:)?\/\/([\w\-]+\.)+[\w\-]+/ig;//正则提取英文域名地址
    //判断是否合法链接
    function checkUrl(e) {
        for (var s; s = e.shift();) {
            s = s.toLowerCase();//data:image无法检测
            if(/^(http|\/\/)/.test(s)){
                s = s.split("/").slice(0, 3).join("/");//截取链接前半部分
                for (var i = r.length; i-- && -1 == s.indexOf(r[i]);) {}
                if (-1 == i) return false;//循环全部都匹配不到
            }
        }
        return true;
    }
    //从原型中重写set方法
    function setSrc(o, s) {
        var f = Object.getOwnPropertyDescriptor(o.prototype, s);
        Object.defineProperty(o.prototype, s,{
            set: function (str) {
                checkUrl([str]) && f.set.call(this, str);
            }
        });
    }
    d.open = function(){var t = {};t.writeln = t.write = t.close = t.clear = t.open = function(){};return t};
    d.write = d.writeln = function (str) {
        (str + "").replace(/<script[^>]+?src="([^"]+)[^<]+?<\/script>/gi, function (a, url) {
            checkUrl([url]) && _wr.call(d, a);// 解救被挟持的js链接文件，其余字符全部忽略。
        })
    };
    w.open = function(url){
        checkUrl([url]) && wo.apply(this,arguments);
    };
    if (h) {
        var ih = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML"),
            iah = h.prototype.insertAdjacentHTML,
            _rc = h.prototype.replaceChild,_ac = h.prototype.appendChild, _ib = h.prototype.insertBefore;//备用方法
        Object.defineProperty(Element.prototype, "innerHTML", {
            set: function (str) {
                //因使用innerHTML添加的script是不会执行的，所以可不用理会。
                str = str.replace(/<(i?frame).+?<\/\1>/gi,"");
                var _a = str.match(reg);//如果没有非法链接或者是合法链接就正常赋值innerHTML
                (!_a || checkUrl(_a)) && ih.set.call(this, str);
            }
        });
        h.prototype.insertAdjacentHTML = function(w,str){
            str = str.replace(/<(i?frame).+?<\/\1>/gi,"");
            var _a = str.match(reg);//如果没有非法链接或者是合法链接就正常赋值innerHTML
            (!_a || checkUrl(_a)) && iah.call(this,w,str);
        };
        h.prototype.replaceChild = function(e,r){
            1 == e.nodeType ? (this.insertBefore(e,r),this.removeChild(r)) : _rc.call(this,e,r);//如果是节点，转移到insertBefore方法上
        };
        //重写appendChild和insertBefore方法
        HTMLElement.prototype.appendChild = HTMLElement.prototype.insertBefore = function (a, b) {
            var tag = a.tagName, _a;//考虑#document-fragment
            if (tag) {
                tag = tag.toLowerCase();
                _a = ("" + a.getAttribute("style")).match(reg);
                if (/iframe|frame|link|style|audio|video|embed|object/.test(tag)||_a && !checkUrl(_a)) {
                    return ;//禁止使用appendChild插入的标签！
                }
                if(/a|img|script|i?frame/.test(tag)){
                    if(!checkUrl([a.src||a.href]))return;
                }
            }
            b ? _ib.call(this, a, b) : _ac.call(this, a);
        };
        setSrc(HTMLScriptElement, "src");//修改js标签src属性检查
        setSrc(HTMLIFrameElement, "src");//修改iframe标签src属性检查
        setSrc(HTMLFrameElement, "src");//修改frame标签src属性检查
    }
    //DOMNodeInserted类似，但已经从 Web 标准中删除
    if (MutationObserver) {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                var type = mutation.type,tag = mutation.addedNodes,_t,_s;
                if ("childList" == type && tag) {
                    for (var i = tag.length; i--;) {
                        _t = tag[i];//过滤文本节点不处理
                        if(1 == _t.nodeType && _t.outerHTML){
                            _s = _t.outerHTML.replace(_t.innerHTML,"").match(reg);//其他节点查属性是否有非法链接
                            _s && !checkUrl(_s) && _t.parentNode && _t.parentNode.removeChild(_t);//含有非法链接直接移除
                        }
                    }
                }else if("attributes" == type){
                    _t = mutation.target;tag = _t.getAttribute(mutation.attributeName);//获取被修改的属性
                    //只对新添加或修改的属性判断，删除的属性不判断！
                    if (tag) {
                        _s = tag.match(reg);//匹配被修改的属性中是否含有非法链接
                        _s && !checkUrl(_s) && _t.setAttribute(mutation.attributeName, mutation.oldValue);
                    }
                }
            });
        });
        //主要监听节点插入和节点属性变化（不监听节点删除）
        observer.observe(d,{attributes: true,childList: true,subtree: true, attributeOldValue:true,attributesFilter: ["style","src","href"]});
    }
}(document,window,["localhost:","rawgit.com",".baidu.com","bdstatic.com"]);//白名单域名