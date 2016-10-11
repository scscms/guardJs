# js防劫持讨论会

## 1.什么是http劫持？
 + HTTP劫持
 + DNS劫持
 + XSS跨站脚本

## 2.js劫持形式与目的
 + URL被劫持标记参数
 + flash　img+a　iframe
 + window.open
 + 非法标签(难以界定)

## 3.现有劫持做了哪些工作？
 + 白名单检查script链接
 + 白名单检查非法资源的src,href
 + 移除广告节点
 + 劫持信息上报

## 4.防劫持难题
 + 有必要移除非法script节点吗？
 + 假如拦截了外链就安全了吗？
 + 被劫持后漂白的代码怎么办？
 + 插入广告函数定时执行怎么办？
 + 非法dom节点能界定清楚吗？
 + 非法dom节点能智能处理吗？
 + 跨哉post上报日志

## 5.劫持招数层出不穷
 + 修改现有标签属性setAttribute
 + srcdoc或src函数修改iframe内容
 + 修改src,style,javascript:void(0)

## 6.https真的就万事大吉了吗？

## 7.js生成广告方法
 + document.write
 + document.writeln
 + Element.prototype.appendChild
 + Element.prototype.insertBefore
 + Element.prototype.replaceChild
 + Element.prototype.innerHTML

## 9.http实现https链接效果
 + Subresource Integrity

## 10.拦截一切非法资源
 + Content Security Policy

## 11.修改原型API
 + Element.prototype.innerHTML
 + HTMLElement.prototype.replaceChild、appendChild、insertBefore
 + Function.prototype.call、apply

## 12.监听文档节点变动
 + DOMNodeInserted
 + MutationObserver
 + navigator.sendBeacon