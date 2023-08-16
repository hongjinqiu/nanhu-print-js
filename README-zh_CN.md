# 什么是 nanhu-print-js
	
一个将nanhu-print xml解析为html的js框架，可以帮助用户在web端动态设置页面元素，并协助`nanhu-print-java`服务器端最终生成pdf文件。

简单代码示例为:

## 1. 下载 Jsonix-all.js, 并将其放到项目中

Jsonix-all.js 下载地址 `https://github.com/highsource/jsonix/blob/master/dist/Jsonix-all.js`

## 2. 写一个 html 页面, 引入以入 js, 并引用 nanhu-print-js 的 api

```html
<script type="text/javascript" src="js/jsonix/Jsonix-all.js"></script>
<script type="text/javascript" src="js/nanhuprint/nanhuprint.js"></script>
<script type="text/javascript" src="js/nanhuprint/nanhuprintEval.js"></script>
<script type="text/javascript" src="js/nanhuprint/interpreter.js"></script>
<script type="text/javascript">
    var xml = "your xml content";
    var data = {};// your business data
    var nanhuprintInterpreter = new NanhuprintInterpreter();
    nanhuprintInterpreter.interpreterString(xml, data);


    console.log(data.nanhuprint_result);
    console.log(data.nanhuprint_result.step2Html);
</script>
```

[Quick Start](document/quick_start-zh_CN.md)

更多示例参考 nanhu-print-java-demo
git 地址: https://github.com/hongjinqiu/nanhu-print-java-demo.git
