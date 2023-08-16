# What is nanhu-print-js

A js framework that parses nanhu-print xml into html, which can help users dynamically set page elements on the web side, and assist `nanhu-print-java` server side to finally generate pdf files.

A simple code example is:

## 1. frist download Jsonix-all.js, and put it into your project

the address of Jsonix-all.js is: `https://github.com/highsource/jsonix/blob/master/dist/Jsonix-all.js`

## 2. Write an html page, import js, and refer to the api of nanhu-print-js
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

[Quick Start](document/quick_start.md)

For more examples, please refer to nanhu-print-java-demo

git address: `https://github.com/hongjinqiu/nanhu-print-java-demo.git`

