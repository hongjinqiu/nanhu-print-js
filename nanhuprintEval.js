var nanhuprintEval_js_prefix = "js:";
var nanhuprintEval_commonAttrField = ["id", "cellspacing", "cellpadding", "colspan", "rowspan"];
var nanhuprintEval_cssElementPrefix = "nanhuprint.If.";
var nanhuprintEval_cssElementRegexp = "^nanhuprint\\.\\w+\\.({css})$";
var nanhuprintEval_id_prefix = "nanhuprint_id_";// 下标,递增给各个元素赋 id 之类的,
var nanhuprintEval_index = 0;// 下标,递增给各个元素赋 id 之类的,
var nanhuprintEval_result_key = "nanhuprint_result";
var nanhuprintEval_body_id = "";
var nanhuprintEval_escape = {
    "'": "&apos;",
    // "&": "&amp;",    // 所有的转义符都有 &,因此,这个&单独特殊处理
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "©": "&copy;",// 版权符
	"®": "&reg;"    // 注册符
	,"\r": "&#x0D;",    // 回车
	"\n": "&#x0A;"    // 换行
};

// xml 属性到 html style 属性的转化,
var nanhuprintEval_attributeDict = {
    'width': 'width',
    'height': 'height',
    'marginLeftByJs': 'margin-left',
    'marginTopByJs': 'margin-top',
    'marginRightByJs': 'margin-right',
    'marginBottomByJs': 'margin-bottom',
    'paddingLeft': 'padding-left',
    'paddingTop': 'padding-top',
    'paddingRight': 'padding-right',
    'paddingBottom': 'padding-bottom',
    'fontStyle': 'font-style',
	'fontWeight': 'font-weight',
	'textDecoration': 'text-decoration',
    'borderCollapse': 'border-collapse',
    'borderSpacing': 'border-spacing',
    'tableLayout': 'table-layout',
    'textAlign': 'text-align',
    'whiteSpace': 'white-space',
    'wordWrap': 'word-wrap',
    'display': 'display',
    'visibility': 'visibility',
    'clear': 'clear',
    'zoom': 'zoom',
    'floatAlign': 'float',
    'fontSize': 'font-size',
    'webkitBoxSizing': '-webkit-box-sizing',
    'mozBoxSizing': '-moz-box-sizing',
    'boxSizing': 'box-sizing',
    'minHeight': 'min-height',
    'position': 'position',
    'lineHeight': 'line-height',
    'color': 'color',
    'borderTopWidth': 'border-top-width',
	// 'borderStyle': 'border-style',
    'borderTopStyle': 'border-top-style',
    'borderTopColor': 'border-top-color',
    'borderLeftWidth': 'border-left-width',
    'borderLeftStyle': 'border-left-style',
    'borderLeftColor': 'border-left-color',
    'borderRightWidth': 'border-right-width',
    'borderRightStyle': 'border-right-style',
    'borderRightColor': 'border-right-color',
    'borderBottomWidth': 'border-bottom-width',
    'borderBottomStyle': 'border-bottom-style',
    'borderBottomColor': 'border-bottom-color',
    'maxWidth': 'max-width',
    'left': 'left',
    'top': 'top',
    'right': 'right',
    'bottom': 'bottom',
    'verticalAlign': 'vertical-align',
    'maxHeight': 'max-height',
    'backgroundColor': 'background-color',
    'backgroundImage': 'background-image',
	'backgroundImageOpacityByPdf': 'backgroundImageOpacityByPdf',// not use in js
    // 'backgroundRepeat': 'background-repeat',
    'backgroundSize': 'background-size',
    'backgroundPositionX': 'background-position-x',
    'backgroundPositionY': 'background-position-y',
	'transformByJs': 'transform',
	'opacityByJs': 'opacity',
	'zIndexByJs': 'z-index',
	'backgroundRepeatByJs': 'background-repeat',
    'fontFamily': 'font-family',
    'overflowX': 'overflow-x',
    'overflowY': 'overflow-y'
};

/**
 * 存放页面上的 css 元素,在每次解析开始的时候,清空,在解析 css 元素的时候赋值,
 * @type {{}}
 */
var nanhuprintEval_css = {};

/**
 * 存放页面上的 macro 宏标签内容,清空,在解析 css 元素的时候赋值,
 * @type {{}}
 */
var nanhuprintEval_macro = {};

/**
 * 存放 id->metaObj 的映射
 * @type {{}}
 */
var nanhuprintEval_metaObj = {};

/**
 * 数据清理
 */
function nanhuprintEval_clearAll() {
	nanhuprintEval_body_id = "";
	nanhuprintEval_css = {};
	nanhuprintEval_macro = {};
	nanhuprintEval_metaObj = {};
}

/**
 * 判断是否空对象
 */
function nanhuprintEval_isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

/**
 * 某个元素是否在数组中
 */
function nanhuprintEval_isInArray(item, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == item) {
            return true;
        }
    }
    return false;
}

/**
 * 对象有时候会包两层,统一取最底层
 * @param metaObj
 * @returns {*}
 */
function nanhuprintEval_getOnionObj(metaObj) {
    if (metaObj.name && metaObj.name.localPart) {
        return metaObj.value;
    } else {
        return metaObj;
    }
}

/**
 * 替换掉转义字符
 * @param metaObj
 * @param env
 * @param expressionEvaluator
 */
function nanhuprintEval_replaceEscapeCharacter(value) {
    // 特殊字符转义后,都包含 &, 因此,先对 & 进行特殊处理,
    if (value.indexOf("&") > -1) {
        value = value.replace(new RegExp("&", "g"), "&amp;");
    }
    // 特殊字符的替换
    for (var escapeItem in nanhuprintEval_escape) {
        if (value.indexOf(escapeItem) > -1) {
            value = value.replace(new RegExp(escapeItem, "g"), nanhuprintEval_escape[escapeItem]);
        }
    }
    return value;
}

/**
 * 拼装字符串属性值,同时进行属性的表达式解析,
 * 例如:<div width="20px" height="30px">
 *     返回:width="20px" height="30px"
 *  <div width="js:1+1" height="js:5+7">
 *      返回:width="2" height="12"
 * @param metaObj
 * @returns {*}
 */
function nanhuprintEval_getAttributeString(metaObj, env, expressionEvaluator) {
    var result = [];
    for (item in metaObj) {
        var value = metaObj[item];
        // 非字符串类型的属性一般为数组子元素,需要在别的地方再遍历读取,
        if (typeof(value) == "string" && item != "TYPE_NAME") {
            // js:表达式开头,进行表达式解析,
            if (value.indexOf(nanhuprintEval_js_prefix) == 0) {
                var valueToLog = value.substring(nanhuprintEval_js_prefix.length);
                if (!valueToLog) {// 空字符串,直接抛异常
                    var log = 'Error eval expression, attribute value null or empty, tagName:[{tagName}]/[{item}:{expression}], env is:';
                    log = log.replace("{tagName}", metaObj["TYPE_NAME"]);
                    log = log.replace("{item}", item);
                    log = log.replace("{expression}", valueToLog);
                    console.log(log);
                    console.log(env);
                    throw new Error(log + JSON.stringify(env, null, 4));
                }
                value = expressionEvaluator.eval(valueToLog, env);
                if (value === undefined) {
                    var log = 'Error eval expression, tagName:[{tagName}]/[{item}:{expression}], env is:';
                    log = log.replace("{tagName}", metaObj["TYPE_NAME"]);
                    log = log.replace("{item}", item);
                    log = log.replace("{expression}", valueToLog);
                    console.log(log);
                    console.log(env);
                    throw new Error(log + JSON.stringify(env, null, 4));
                }
                // value 计算出来后有可能不是 string 类型,由于是拼属性,因此,将其转化为 string,
                value = value + "";
            }

            value = nanhuprintEval_replaceEscapeCharacter(value);

            result.push('{item}="{value}"'.replace("{item}", item).replace("{value}", value));
        } else if (typeof(value) == "number") {// number
            result.push('{item}="{value}"'.replace("{item}", item).replace("{value}", value));
        } else if (typeof(value) == "boolean") {// number
            result.push('{item}="{value}"'.replace("{item}", item).replace("{value}", value ? "true" : "false"));
        }
    }
    if (result.length > 0) {
        return result.join(" ");
    }
    return "";
}

/**
 * xml 属性转 html css 属性,例如:
 * fontFamily="Arial"
 * ->
 * font-family:Arial
 * 1.对应子元素,
 2.属性值,
 3.从 css 对应的样式中,按空格分割,从右向左查找,

 举例说明:
 .common { width: 10%; }
 <div cls="common" width="50%">
 	<css>
    	<width js="20%" />
 	</css>
 </div>
 ->
 <div cls="common" stle="width: 20%"></div>
 */
function nanhuprintEval_getAttributeToStyleString(metaObj, childKey) {
    var result = [];

    for (item in nanhuprintEval_attributeDict) {
        /*var value = "";
        // 1.查找对应子 css 元素,取值
        if (metaObj[childKey]) {
            for (var i = 0; i < metaObj[childKey].length; i++) {
                if (metaObj[childKey][i].TYPE_NAME == "nanhuprint.Css") {
                    value = nanhuprintEval_getCssElementJsValue(metaObj[childKey][i], item);
                    break;
                }
            }
        }
        // 2.没值时,从属性取值,
        if (!value) {
            // 属性值
            value = metaObj[item];
        }
        // 3.从 css 对应的样式中,按空格分割,从右向左查找,
        if (!value) {
            if (metaObj.cls) {
                var clsLi = metaObj.cls.split(/ +/);// 控空格分隔
				for (var i = clsLi.length - 1; i >= 0; i--) {
                    var cssName = clsLi[i];
                    if (cssName) {
                        var cssObj = nanhuprintEval_css[cssName];
                        value = nanhuprintEval_getCssElementJsValue(cssObj, item);
                        if (value) {
                            break;
                        }
                    }
                }
            }
        }*/
		var value = nanhuprintEval_getCssAttribute(metaObj, childKey, item);
        if (value) {
            var itemConvert = nanhuprintEval_attributeDict[item];
            value = nanhuprintEval_replaceEscapeCharacter(value);
            result.push('{item}:{value}'.replace("{item}", itemConvert).replace("{value}", value));
        }
    }
    if (result.length > 0) {
        return result.join(";");
    }
    return "";
}

/**
 * 从子标签,属性,css 样式中查找属性值
 */
function nanhuprintEval_getCssAttribute(metaObj, childKey, attrName) {
	var value = "";
	// 1.查找对应子 css 元素,取值
	if (metaObj[childKey]) {
		for (var i = 0; i < metaObj[childKey].length; i++) {
			if (metaObj[childKey][i].TYPE_NAME == "nanhuprint.Css") {
				value = nanhuprintEval_getCssElementJsValue(metaObj[childKey][i], attrName);
				break;
			}
		}
	}
	// 2.没值时,从属性取值,
	if (!value) {
		// 属性值
		value = metaObj[attrName];
	}
	// 3.从 css 对应的样式中,按空格分割,从右向左查找,
	if (!value) {
		if (metaObj.cls) {
			var clsLi = metaObj.cls.split(/ +/);// 控空格分隔
			for (var i = clsLi.length - 1; i >= 0; i--) {
				var cssName = clsLi[i];
				if (cssName) {
					var cssObj = nanhuprintEval_css[cssName];
					value = nanhuprintEval_getCssElementJsValue(cssObj, attrName);
					if (value) {
						break;
					}
				}
			}
		}
	}
	return value;
}

/**
 * 匹配元素,取得属性值,例如:
 * @param cssObj: {
        "TYPE_NAME": "nanhuprint.Css",
        "ifAndForEachAndSet": [
            {
                "TYPE_NAME": "nanhuprint.If.Width",
                "js": "80_byTable"
            },
            {
                "TYPE_NAME": "nanhuprint.If.Display",
                "js": "block_byTable"
            }
        ]
    }
    @param tagName width|height|...
    返回属性 js 的值
 */
function nanhuprintEval_getCssElementJsValue(cssObj, tagName) {
    if (cssObj && cssObj.ifAndForEachAndSet) {
        var cssChildLi = cssObj.ifAndForEachAndSet;

		// nanhuprint.If.Display
		var targetTypeName = nanhuprintEval_cssElementPrefix + tagName[0].toUpperCase() + tagName.substring(1);
		// console.log(targetTypeName);
		for (var j = 0; j < cssChildLi.length; j++) {
			var subElementObj = cssChildLi[j];
			if (subElementObj.TYPE_NAME == targetTypeName) {
				return subElementObj.js;
			}
		}
		/*
		// 正则表达式的匹配非常的慢,修改成字符串比较,
		var regexpText = nanhuprintEval_cssElementRegexp.replace("{css}", tagName);
		var regexp = new RegExp(regexpText, "i");
		for (var j = 0; j < cssChildLi.length; j++) {
			var subElementObj = cssChildLi[j];
			if (regexp.test(subElementObj.TYPE_NAME)) {
				return subElementObj.js;
			}
		}
		 */
	}

    /*
    var regexpText = nanhuprintEval_cssElementRegexp.replace("{css}", tagName);
    var regexp = new RegExp(regexpText, "i");
    for (var j = 0; j < childLi.length; j++) {
        var subElementObj = childLi[j];
        if (regexp.test(subElementObj.TYPE_NAME)) {
            return subElementObj.js;
        }
    }
    */
    return null;
}

/**
 * 每个标签的子标签循环遍历分发方法
 * 例如:div -> DivEval
 * if -> IfEval
 */
function nanhuprintEval_loopEvalDynamicElement(objLi, env, expressionEvaluator, textLi) {
    if (objLi) {
        var evalFactory = new EvalFactory();
        for (var i = 0; i < objLi.length; i++) {
            var evalImplment = evalFactory.routeEval(objLi[i]);
            if (evalImplment) {
                var text = evalImplment.evalDynamicElement(objLi[i], env, expressionEvaluator);
                textLi.push(text);
            }
        }
    }
}

/**
 * 每个标签的子标签循环遍历分发方法
 * 例如:div -> DivEval
 * if -> IfEval
 */
function nanhuprintEval_loopEvalToHtml(objLi, env, textLi) {
    if (objLi) {
        var evalFactory = new EvalFactory();
        for (var i = 0; i < objLi.length; i++) {
            // css 元素已经在父元素做过了遍历取值,不需要再解析取值,这里面直接跳过即可,
            if (!nanhuprintEval_isCssElement(objLi[i].TYPE_NAME)) {
                var evalImplment = evalFactory.routeEval(objLi[i]);
                if (evalImplment) {
                    var text = evalImplment.evalToHtml(objLi[i], env);
                    textLi.push(text);
                }
            }
        }
    }
}

/**
 * 每个元素都放一个 nanhuprint_parentId,指向父元素,以方便访问,
 */
function nanhuprintEval_loopSetIdAndParentId(parentObj, objLi) {
    if (objLi) {
        var evalFactory = new EvalFactory();
        for (var i = 0; i < objLi.length; i++) {
            var evalImplment = evalFactory.routeEval(objLi[i]);
            if (evalImplment) {
                if (!evalImplment.setIdAndParentId) {
                    console.log("not exists setIdAndParentId, elem is:");
                    console.log(evalImplment);
                }
                evalImplment.setIdAndParentId(objLi[i], parentObj);
            }
        }
    }
}

/**
 * 遍历元素,调用 setIdAndMetaObj
 * @param objLi
 */
function nanhuprintEval_loopSetIdAndMetaObj(objLi) {
	if (objLi) {
		var evalFactory = new EvalFactory();
		for (var i = 0; i < objLi.length; i++) {
			var evalImplment = evalFactory.routeEval(objLi[i]);
			if (evalImplment) {
				if (!evalImplment.setIdAndMetaObj) {
					console.log("not exists setIdAndMetaObj, elem is:");
					console.log(evalImplment);
				}
				evalImplment.setIdAndMetaObj(objLi[i]);
			}
		}
	}
}

/**
 * 给执行环境循环赋值,当 env 的 nanhuprint_outer 有值,并且 nanhuprint_outer 也有对应的 key 时,
 * 给对应的 nanhuprint_outer 赋值
 */
function nanhuprintEval_loopSetEnvValue(env, key, value) {
    env[key] = value;
    var outerEnv = env.nanhuprint_outer;
    while (outerEnv) {
        if (outerEnv[key] !== undefined) {
            outerEnv[key] = value;
        }
        outerEnv = outerEnv.nanhuprint_outer;
    }
}

/**
 * 取得 env 存在的 nanhuprint
 * @param env
 */
function nanhuprintEval_getNanhuprintEnv(env) {
    if (!env[nanhuprintEval_result_key]) {
        env[nanhuprintEval_result_key] = {};
    }
    return env[nanhuprintEval_result_key];
}

/**
 * div,table,tr,td,css 等元素的 xml 输出解析,除了标签不同,其它都相同,
 */
function nanhuprintEval_commonEvalDynamicElement(tagName, metaObj, childKey, env, expressionEvaluator) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];
    var attribute = nanhuprintEval_getAttributeString(obj, env, expressionEvaluator);
    resultLi.push("<{tagName} {attribute}>".replace("{tagName}", tagName).replace("{attribute}", attribute));
    nanhuprintEval_loopEvalDynamicElement(obj[childKey], env, expressionEvaluator, resultLi);
    resultLi.push("</{tagName}>".replace("{tagName}", tagName));
    return resultLi.join("");
}

/**
 * div,table,tr,td,css 等元素的 xml 转 html 输出解析,除了标签不同,其它都相同,
 * attrFieldLi 指的是像 id 等属性,不放到 style 里面,而要放到元素上,例如:<div id="xxxx"
 */
function nanhuprintEval_commonEvalToHtml(tagName, metaObj, attrFieldLi, childKey, env, customConfig) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];

    var attrFieldTextLi = [];
    for (var i = 0; i < attrFieldLi.length; i++) {
        var item = attrFieldLi[i];
        if (obj[item] !== undefined) {// 只拼装属性中有的值
            var value = obj[item] + "";
            var value = nanhuprintEval_replaceEscapeCharacter(value);
            attrFieldTextLi.push('{item}="{value}"'.replace("{item}", item).replace("{value}", value));
        }
    }

    var style = nanhuprintEval_getAttributeToStyleString(obj, childKey);

    // class 属性对应 xml 里面的 cls
    var classReplace = "";
    if (obj.cls !== undefined) {
        classReplace = 'class="{class}"'.replace("{class}", obj.cls);
    }
    var template = '<{tagName} {attrFieldText} {classReplace} style="{style}">'.replace("{classReplace}", classReplace);
    template = template.replace("{tagName}", tagName);
    template = template.replace("{attrFieldText}", attrFieldTextLi.join(" "));
    template = template.replace("{style}", style);
    resultLi.push(template);

    if (customConfig && customConfig.middleFn) {
        var text = customConfig.middleFn(obj);
        if (text) {
            resultLi.push(text);
        }
    }
    nanhuprintEval_loopEvalToHtml(obj[childKey], env, resultLi);

    resultLi.push("</{tagName}>".replace("{tagName}", tagName));
    return resultLi.join("");
}

/**
 * 给每个标签设一个 id 属性,方便用到的时候取值,
 */
function nanhuprintEval_commonSetIdAndParentId(metaObj, childKey, parentId) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    if (!obj.nanhuprint_parentId) {
        obj.nanhuprint_parentId = parentId;
    }
    if (!obj.id) {
        obj.id = nanhuprintEval_id_prefix + (nanhuprintEval_index++) + "";
    }
    nanhuprintEval_loopSetIdAndParentId(obj, obj[childKey]);
}

/**
 * 给每个标签设一个 id -> metaObj 的映射,方便用到的时候取值
 * @param metaObj
 * @param childKey
 */
function nanhuprintEval_commonSetIdAndMetaObj(metaObj, childKey) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	nanhuprintEval_metaObj[metaObj.id] = metaObj;
	nanhuprintEval_loopSetIdAndMetaObj(obj[childKey]);
}

/**
 * 是否是样式子元素
 */
function nanhuprintEval_isCssElement(tagName) {
    var clsKeyLi = [];
    for (var key in nanhuprintEval_attributeDict) {
        clsKeyLi.push(key);
    }
    // clsKeyLi.push('cls');
    // clsKeyLi.push('cellspacing');
    // clsKeyLi.push('cellpadding');
    // clsKeyLi.push('colspan');
    // clsKeyLi.push('rowspan');

    var clsElementText = clsKeyLi.join("|");
    // 正则表达式匹配,nanhuprint\.\w+\.(cls|width), 匹配目标:nanhuprint.If.Width
    var regexpText = nanhuprintEval_cssElementRegexp.replace("{css}", clsElementText);
    var regexp = new RegExp(regexpText, "i");
    return regexp.test(tagName);
}

/**
 * 一行元素处理,
 * <param name="" value="" />
 * <width js="" pdf="" />
 * 这种元素称为一行元素,
 * @param metaObj
 * @param env
 * @param expressionEvaluator
 * @returns {string}
 */
function nanhuprintEval_evalDynamicElementForOneLineElement(metaObj, env, expressionEvaluator) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];
    var attribute = nanhuprintEval_getAttributeString(obj, env, expressionEvaluator);
    var typeName = obj.TYPE_NAME;// nanhuprint.If.Width
    // 截取 width 出来
    typeName = typeName.substring(typeName.lastIndexOf(".") + 1);
    // 首字母小写
    typeName = typeName[0].toLowerCase() + typeName.substring(1);
    resultLi.push("<{typeName} {attribute}>".replace("{typeName}", typeName).replace("{attribute}", attribute));
    resultLi.push("</{typeName}>".replace("{typeName}", typeName));
    return resultLi.join("");
}

/**
 * 生成独立的执行环境时,把 formatFunc 给传进去,
 * @param env
 * @returns {{}}
 */
function nanhuprintEval_getNestEnv(env) {
	var nestEnv = {};
	if (env.formatFunc) {
		nestEnv.formatFunc = env.formatFunc;
	}
	return nestEnv;
}

/**
 * 工厂类,
 * 对 Jsonix unmarshalString 返回的对象中的各个数据类型,返回其对应的执行器
 * @constructor
 */
function EvalFactory(){}

/**
 * 处理类路由,jsonix 返回的数据结构,有时候会包一层,因此,需要做双重判断,
 * 例如:其返回多包一层的数据结构,
 {
        "name": {
            "namespaceURI": "https://github.com/hongjinqiu/nanhu-print-java",
            "localPart": "if",
            "prefix": "",
            "key": "{https://github.com/hongjinqiu/nanhu-print-java}if",
            "string": "{https://github.com/hongjinqiu/nanhu-print-java}if"
        },
        "value": {
            "TYPE_NAME": "nanhuprint.If",
            "testJs": "1==2",
            "widthAndHeightAndPaddingLeft": []
        }
    }
 也可能返回
 {
        "TYPE_NAME": "nanhuprint.If",
        "testJs": "1==1",
        "widthAndHeightAndPaddingLeft": []
    }
 * @param metaObj
 * @returns {HtmlEval}
 */
EvalFactory.prototype.routeEval = function(metaObj){
    if ((metaObj.name && metaObj.name.localPart == "html") || (metaObj.TYPE_NAME == "nanhuprint.Html")) {
        return new HtmlEval();
    }
	if ((metaObj.name && metaObj.name.localPart == "style") || (metaObj.TYPE_NAME == "nanhuprint.Style")) {
		return new StyleEval();
	}
	if ((metaObj.name && metaObj.name.localPart == "macros") || (metaObj.TYPE_NAME == "nanhuprint.Macros")) {
		return new MacrosEval();
	}
    if ((metaObj.name && metaObj.name.localPart == "body") || (metaObj.TYPE_NAME == "nanhuprint.Body")) {
        return new BodyEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "div") || (metaObj.TYPE_NAME == "nanhuprint.Div")) {
        return new DivEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "table") || (metaObj.TYPE_NAME == "nanhuprint.Table")) {
        return new TableEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "thead") || (metaObj.TYPE_NAME == "nanhuprint.Thead")) {
        return new TheadEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "tbody") || (metaObj.TYPE_NAME == "nanhuprint.Tbody")) {
        return new TbodyEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "tloop") || (metaObj.TYPE_NAME == "nanhuprint.Tloop")) {
        return new TloopEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "tbottom") || (metaObj.TYPE_NAME == "nanhuprint.Tbottom")) {
        return new TbottomEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "tr") || (metaObj.TYPE_NAME == "nanhuprint.Tr")) {
        return new TrEval();
    }
	if ((metaObj.name && metaObj.name.localPart == "td") || (metaObj.TYPE_NAME == "nanhuprint.Td")) {
		return new TdEval();
	}
	if ((metaObj.name && metaObj.name.localPart == "th") || (metaObj.TYPE_NAME == "nanhuprint.Th")) {
		return new ThEval();
	}
    if ((metaObj.name && metaObj.name.localPart == "span") || (metaObj.TYPE_NAME == "nanhuprint.Span")) {
        return new SpanEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "params") || (metaObj.TYPE_NAME == "nanhuprint.Params")) {
        return new ParamsEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "param") || (metaObj.TYPE_NAME == "nanhuprint.Param")) {
        return new ParamEval();
    }
    /*// 不支持 img 标签,图片都用 backgroundImage
    if ((metaObj.name && metaObj.name.localPart == "img") || (metaObj.TYPE_NAME == "nanhuprint.Img")) {
        return new ImgEval();
    }
    */
    if ((metaObj.name && metaObj.name.localPart == "if") || (metaObj.TYPE_NAME == "nanhuprint.If")) {
        return new IfEval();
    }
    if ((metaObj.name && metaObj.name.localPart == "forEach") || (metaObj.TYPE_NAME == "nanhuprint.ForEach")) {
        return new ForEachEval();
    }
	if ((metaObj.name && metaObj.name.localPart == "macroRef") || (metaObj.TYPE_NAME == "nanhuprint.MacroRef")) {
		return new MacroRefEval();
	}
    if ((metaObj.name && metaObj.name.localPart == "set") || (metaObj.TYPE_NAME == "nanhuprint.Set")) {
        return new SetEval();
    }
	if ((metaObj.name && metaObj.name.localPart == "css") || (metaObj.TYPE_NAME == "nanhuprint.Css")) {
		return new CssEval();
	}
	if ((metaObj.name && metaObj.name.localPart == "macro") || (metaObj.TYPE_NAME == "nanhuprint.Macro")) {
		return new MacroEval();
	}

    if (nanhuprintEval_isCssElement(metaObj.TYPE_NAME)) {
        return new CssElementEval();
    }

    return null;
}

/**
 * 数据结构:
 {
    "name": {
        "namespaceURI": "https://github.com/hongjinqiu/nanhu-print-java",
        "localPart": "html",
        "prefix": "",
        "key": "{https://github.com/hongjinqiu/nanhu-print-java}html",
        "string": "{https://github.com/hongjinqiu/nanhu-print-java}html"
    },
    "value": {
        "TYPE_NAME": "nanhuprint.Html",
        "style": {}
        "body": {}
    }
 }
 * @constructor
 */
function HtmlEval(){}

HtmlEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];
    resultLi.push('<?xml version="1.0" encoding="UTF-8" ?>');
    resultLi.push('<html xmlns="{xmlns}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'.replace("{xmlns}", metaObj.name.namespaceURI));

    // 宏变量清值
	if (!nanhuprintEval_isEmpty(nanhuprintEval_macro)) {
		nanhuprintEval_macro = {};
	}

    // style,body 的解析
    var evalFactory = new EvalFactory();
    if (obj.style) {
        var evalImplment = evalFactory.routeEval(obj.style);
        var text = evalImplment.evalDynamicElement(obj.style, env, expressionEvaluator);
        resultLi.push(text);
    }

	if (obj.macros) {
		var evalImplment = evalFactory.routeEval(obj.macros);
		var text = evalImplment.evalDynamicElement(obj.macros, env, expressionEvaluator);
		resultLi.push(text);
	}

    if (obj.body) {
        var evalImplment = evalFactory.routeEval(obj.body);
        var text = evalImplment.evalDynamicElement(obj.body, env, expressionEvaluator);
        resultLi.push(text);
    }

    resultLi.push('</html>');

    var nanhuprintEnv = nanhuprintEval_getNanhuprintEnv(env);
    var text = resultLi.join("");
    nanhuprintEnv.step1Xml = text;

    return text;
}

/**
 * 输出 html 的函数入口,
 * @param metaObj
 * @returns {string}
 */
HtmlEval.prototype.evalToHtml = function(metaObj, env) {
    var self = this;
	nanhuprintEval_clearAll();
    self.setIdAndParentId(metaObj, null);// 给元素赋 id 和 parentId
	self.setIdAndMetaObj(metaObj);// 元素 id -> metaObj 映射

    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];
    resultLi.push('<!DOCTYPE html> ');
    resultLi.push(' <html> ');
    resultLi.push(' <head> ');
    resultLi.push('     <meta charset="UTF-8"> ');
    resultLi.push('     <title>gen_by_nanhuprint_interpreter</title> ');

    // style,body 的解析
    var evalFactory = new EvalFactory();
    if (obj.style) {
        var evalImplment = evalFactory.routeEval(obj.style);
        var text = evalImplment.evalToHtml(obj.style, env);
        resultLi.push(text);
    }
    resultLi.push(' </head> ');
    if (obj.body) {
        var evalImplment = evalFactory.routeEval(obj.body);
        var text = evalImplment.evalToHtml(obj.body, env);
        resultLi.push(text);
    }

    resultLi.push('</html>');

    var nanhuprintEnv = nanhuprintEval_getNanhuprintEnv(env);
    var text = resultLi.join("");
    nanhuprintEnv.step2Html = text;

    return text;
}

/**
 * 设置 id,nanhuprint_parentId
 * html 元素, 没有 id, parentId 属性,只往下分发,
 * @param metaObj
 * @param parentObj 没有父元素,null,
 */
HtmlEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var evalFactory = new EvalFactory();
    if (obj.body) {
        var evalImplment = evalFactory.routeEval(obj.body);
        evalImplment.setIdAndParentId(obj.body, obj);
    }
}

/**
 * 设置 id -> metaObj 映射,
 * html 元素, 不放置映射, 只是往下分发调用,
 * @param metaObj
 */
HtmlEval.prototype.setIdAndMetaObj = function(metaObj) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var evalFactory = new EvalFactory();
	if (obj.body) {
		var evalImplment = evalFactory.routeEval(obj.body);
		evalImplment.setIdAndMetaObj(obj.body);
	}
}

/**
 * 数据结构:
 * {
            "TYPE_NAME": "nanhuprint.Style",
            "ifAndForEachAndSet": []
    }
 * @constructor
 */
function StyleEval() {}

StyleEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];
	resultLi.push("<style>");

	nanhuprintEval_loopEvalDynamicElement(obj.ifAndForEachAndSet, env, expressionEvaluator, resultLi);

	resultLi.push("</style>");
	return resultLi.join("");
}

/**
 * html 的输出,采用直接写 style 的方式,不会输出 css,
 * 因此, css 的渲染,写入一个全局的局部变量 nanhuprintEval_css 中,方便后续的各个元素取值输出,
 */
StyleEval.prototype.evalToHtml = function(metaObj, env) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];
	// resultLi.push('<style type="text/css"> ');

	nanhuprintEval_loopEvalToHtml(obj.ifAndForEachAndSet, env, resultLi);

	// resultLi.push("</style>");
	return resultLi.join("");
}


/**
 * 数据结构:
 * {
            "TYPE_NAME": "nanhuprint.Macros",
            "ifAndForEachAndSet": []
    }
 * @constructor
 */
function MacrosEval() {}

MacrosEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];

	nanhuprintEval_loopEvalDynamicElement(obj.ifAndForEachAndSet, env, expressionEvaluator, resultLi);

	return resultLi.join("");
}

/**
 * 数据结构
 * {
            "TYPE_NAME": "nanhuprint.Body",
            "cls": "common",
            "backgroundColor": "#000",
            "ifAndForEachAndSet": []
    }
 * @constructor
 */
function BodyEval() {}

BodyEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("body", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

BodyEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    return nanhuprintEval_commonEvalToHtml("body", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

BodyEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
	nanhuprintEval_body_id = metaObj.id;
}

BodyEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Div",
        "ifAndForEachAndSet": []
    }
 * @constructor
 */
function DivEval() {}

DivEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("div", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

DivEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    return nanhuprintEval_commonEvalToHtml("div", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

DivEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

DivEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Table",
        "cellspacing": "0",
        "cellpadding": "0",
        "width": "100%",
        "ifAndForEachAndSet": []
    }
 */
function TableEval() {}

TableEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("table", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

TableEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    return nanhuprintEval_commonEvalToHtml("table", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

TableEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TableEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Thead",
        "ifAndForEachAndSet": []
    }
 */
function TheadEval() {}

TheadEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("thead", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

TheadEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    return nanhuprintEval_commonEvalToHtml("thead", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

TheadEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TheadEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Tbody",
        "ifAndForEachAndSet": []
    }
 */
function TbodyEval() {}

TbodyEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("tbody", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

TbodyEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    return nanhuprintEval_commonEvalToHtml("tbody", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

TbodyEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TbodyEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Tloop",
        "ifAndForEachAndSet": []
    }
 */
function TloopEval() {}

TloopEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("tloop", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

/**
 * tloop 会生成一个 tbody class="tbodyGenByTloop", 根据 countJs 属性循环内容,
 */
TloopEval.prototype.evalToHtml = function(metaObj, env) {
    // tloop 内容不参与渲染,仅仅将结果与父元素id,放到 env 中,
    var attrFieldLi = nanhuprintEval_commonAttrField;
    var result = [];
    var obj = nanhuprintEval_getOnionObj(metaObj);
    if (obj.cls) {
        obj.cls += " tbodyGenByTloop";
    } else {
        obj.cls = "tbodyGenByTloop";
    }

    var isTwo = false;
    var childLi0 = [];
	var childLi1 = [];
    if (obj.mode && obj.mode == "two") {
    	var childLi = obj.ifAndForEachAndSet;
    	if (!childLi || childLi.length < 2) {
    		throw new Error("标签<tloop 配置了 mode='two',但是却没有包含两个子元素");
		}
		childLi0.push(childLi[0]);
		childLi1.push(childLi[1]);
		isTwo = true;
	}

    var countJs = obj.countJs !== undefined ? obj.countJs : 0;
    for (var i = 0; i < countJs; i++) {
    	if (isTwo) {
    		if (i % 2 == 0) {
				obj.ifAndForEachAndSet = childLi0;
			} else {
				obj.ifAndForEachAndSet = childLi1;
			}
		}
        var tloopHtml = nanhuprintEval_commonEvalToHtml("tbody", obj, attrFieldLi, "ifAndForEachAndSet", env);
        // 删除所有系统生成的 id,
        tloopHtml = tloopHtml.replace(new RegExp('id="' + nanhuprintEval_id_prefix + '\\d+"', "g"), "");
        result.push(tloopHtml);
    }

    return result.join("");
    // return nanhuprintEval_commonEvalToHtml("tloop", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

TloopEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TloopEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Tbottom",
        "ifAndForEachAndSet": []
    }
 */
function TbottomEval() {}

TbottomEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("tbottom", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

TbottomEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    var obj = nanhuprintEval_getOnionObj(metaObj);
    if (obj.cls) {
        obj.cls += " tbodyGenByTbottom";
    } else {
        obj.cls = "tbodyGenByTbottom";
    }
    // tbottom 用 tbody 来渲染
    return nanhuprintEval_commonEvalToHtml("tbody", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
    // return nanhuprintEval_commonEvalToHtml("tbottom", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

TbottomEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TbottomEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Tr",
        "ifAndForEachAndSet": []
    }
 */
function TrEval() {}

TrEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("tr", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

TrEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    return nanhuprintEval_commonEvalToHtml("tr", metaObj, attrFieldLi, "ifAndForEachAndSet", env);
}

TrEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TrEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Td",
        "ifAndForEachAndSet": []
    }
 */
function TdEval() {}

TdEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	return nanhuprintEval_commonEvalDynamicElement("td", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

TdEval.prototype.evalToHtml = function(metaObj, env) {
	var attdFieldLi = nanhuprintEval_commonAttrField;
	return nanhuprintEval_commonEvalToHtml("td", metaObj, attdFieldLi, "ifAndForEachAndSet", env);
}

TdEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
	nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

TdEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Th",
        "ifAndForEachAndSet": []
    }
 */
function ThEval() {}

ThEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	return nanhuprintEval_commonEvalDynamicElement("th", metaObj, "ifAndForEachAndSet", env, expressionEvaluator);
}

ThEval.prototype.evalToHtml = function(metaObj, env) {
	var atthFieldLi = nanhuprintEval_commonAttrField;
	return nanhuprintEval_commonEvalToHtml("th", metaObj, atthFieldLi, "ifAndForEachAndSet", env);
}

ThEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
	nanhuprintEval_commonSetIdAndParentId(metaObj, "ifAndForEachAndSet", parentObj.id);
}

ThEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "ifAndForEachAndSet");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Span",
        "value": "value1",
        "widthAndHeightAndPaddingLeft": []
    }
 */
function SpanEval() {}

SpanEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("span", metaObj, "cssAndParams", env, expressionEvaluator);
}

SpanEval.prototype.evalToHtml = function(metaObj, env) {
    var attrFieldLi = nanhuprintEval_commonAttrField;
    // <span value="test"></span> -> <span>test</span>
    var customConfig = {
        middleFn: function(obj) {
            // return obj.value;
			if (obj.format) {
				if (obj.format == "num") {
					if (!(env.formatFunc && env.formatFunc.num)) {
						throw new Error("<span 标签配置了 format='num',但是传入的 env 中没有对应的格式函数, env.formatFunc.num, 无法进行格式化显示");
					}
					return env.formatFunc.num(obj.value);
				} else if (obj.format == "unitPrice") {
					if (!(env.formatFunc && env.formatFunc.unitPrice)) {
						throw new Error("<span 标签配置了 format='unitPrice',但是传入的 env 中没有对应的格式函数, env.formatFunc.unitPrice, 无法进行格式化显示");
					}
					return env.formatFunc.unitPrice(obj.value);
				} else if (obj.format == "amt") {
					if (!(env.formatFunc && env.formatFunc.amt)) {
						throw new Error("<span 标签配置了 format='amt',但是传入的 env 中没有对应的格式函数, env.formatFunc.amt, 无法进行格式化显示");
					}
					return env.formatFunc.amt(obj.value);
				}
			}
			return obj.value.replace(/\r?\n/g, "<br />");
        }
    };
    return nanhuprintEval_commonEvalToHtml("span", metaObj, attrFieldLi, "cssAndParams", env, customConfig);
}

SpanEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "cssAndParams", parentObj.id);
}

SpanEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "cssAndParams");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Params",
        "param": [
            {
                "TYPE_NAME": "nanhuprint.Param",
                "name": "extendBody",
                "value": "true"
            },
        ]
    },
 * @constructor
 */
function ParamsEval() {}

ParamsEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("params", metaObj, "param", env, expressionEvaluator);
}

/**
 * 往 env.nanhuprintEval_result_key 赋值,
 * 由于 evalToHtml 执行的时候,xml 里面已经没有 if,forEach 等动态标签,因此 不会发生 env 的新建,自始自络,始终只有一个 env,
 */
ParamsEval.prototype.evalToHtml = function(metaObj, env) {
    var nanhuprintEnv = nanhuprintEval_getNanhuprintEnv(env);
    var params = nanhuprintEnv.params || [];
    var paramLi = [];
    if (metaObj.param) {
        for (var i = 0; i < metaObj.param.length; i++) {
            paramLi.push({
                name: metaObj.param[i].name,
                value: metaObj.param[i].value,
            });
        }
    }
    params.push({
        tagId: metaObj.nanhuprint_parentId,
        params: paramLi
    });
    nanhuprintEnv.params = params;

    nanhuprintEval_loopSetEnvValue(env, nanhuprintEval_result_key, nanhuprintEnv);
    return "";
}

ParamsEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "param", parentObj.id);
}

ParamsEval.prototype.setIdAndMetaObj = function(metaObj) {
	nanhuprintEval_commonSetIdAndMetaObj(metaObj, "param");
}

/**
 * {
        "TYPE_NAME": "nanhuprint.Param",
        "name": "extendBody",
        "value": "true"
    }
 单行元素,
 */
function ParamEval() {}

ParamEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_evalDynamicElementForOneLineElement(metaObj, env, expressionEvaluator);
}

ParamEval.prototype.evalToHtml = function(metaObj, env) {
    return "";
}

ParamEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    // do nothing
}

ParamEval.prototype.setIdAndMetaObj = function(metaObj) {
	// do nothing
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Img",
        "src": "http://test",
        "widthAndHeightAndPaddingLeft": []
    }
 */
function ImgEval() {}

ImgEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_commonEvalDynamicElement("img", metaObj, "cssAndParams", env, expressionEvaluator);
}

ImgEval.prototype.evalToHtml = function(metaObj, env) {
    // var attrFieldLi = nanhuprintEval_commonAttrField;
    var attrFieldLi = ["src"];
    for (var i = 0; i < nanhuprintEval_commonAttrField.length; i++) {
        attrFieldLi.push(nanhuprintEval_commonAttrField[i]);
    }
    return nanhuprintEval_commonEvalToHtml("img", metaObj, attrFieldLi, "cssAndParams", env);
}

ImgEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    nanhuprintEval_commonSetIdAndParentId(metaObj, "cssAndParams", parentObj.id);
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Css",
        "name": "common",
        "ifAndForEachAndSet": []
    }
 * @constructor
 */
function CssEval() {}

CssEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];
	var attribute = nanhuprintEval_getAttributeString(obj, env, expressionEvaluator);
	resultLi.push("<css {attribute}>".replace("{attribute}", attribute));
	nanhuprintEval_loopEvalDynamicElement(obj.ifAndForEachAndSet, env, expressionEvaluator, resultLi);
	resultLi.push("</css>");
	return resultLi.join("");
}

CssEval.prototype.evalToHtml = function(metaObj, env) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];

	nanhuprintEval_css[obj.name] = obj;

	return resultLi.join("");
}

CssEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
	// do nothing
}

CssEval.prototype.setIdAndMetaObj = function(metaObj) {
	// do nothing
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.Macro",
		"name": "test1",
		"paramJs": "obj",
		"widthAndHeightAndPaddingLeft": []
    }
 * @constructor
 */
function MacroEval() {}

MacroEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];

	nanhuprintEval_macro[obj.name] = obj;

	return resultLi.join("");
}

/**
 * 数据结构
 * {
        "TYPE_NAME": "nanhuprint.If",
        "testJs": "1==1",
        "widthAndHeightAndPaddingLeft": []
    }
 */
function IfEval(){}

IfEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];

    if (expressionEvaluator.eval(obj.testJs, env)) {
        nanhuprintEval_loopEvalDynamicElement(obj.widthAndHeightAndPaddingLeft, env, expressionEvaluator, resultLi);
    }

    return resultLi.join("");
}

/**
 * 数据结构
 * {
            "TYPE_NAME": "nanhuprint.ForEach",
            "var": "item",
            "itemsJs": "#testLoopLi",
            "varStatus": "index",
            "widthAndHeightAndPaddingLeft": [
                {
                    "TYPE_NAME": "nanhuprint.Div"
                }
            ]
        }
 */
function ForEachEval(){}

ForEachEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var resultLi = [];

    // 生成一个独立的 nestEnv, 用 nanhuprint_outer 来指向 env
    var nestEnv = {};
    for (var item in env) {
        nestEnv[item] = env[item];
    }
    nestEnv.nanhuprint_outer = env;
    var items = expressionEvaluator.eval(obj.itemsJs, nestEnv);
    for (var i = 0; i < items.length; i++) {
        nanhuprintEval_loopSetEnvValue(nestEnv, obj.var, items[i]);
        nanhuprintEval_loopSetEnvValue(nestEnv, obj.varStatus, i);
        nanhuprintEval_loopEvalDynamicElement(obj.widthAndHeightAndPaddingLeft, nestEnv, expressionEvaluator, resultLi);
    }

    return resultLi.join("");
}

/**
 * 数据结构:
 * {
        "TYPE_NAME": "nanhuprint.Set",
        "var": "tmpValue",
        "valueJs": "3"
    }
 * @constructor
 */
function SetEval(){}

SetEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    var obj = nanhuprintEval_getOnionObj(metaObj);
    var value = expressionEvaluator.eval(obj.valueJs, env);
    nanhuprintEval_loopSetEnvValue(env, obj.var, value);
    return "";
}

/**
 * 数据结构
 * {
		"TYPE_NAME": "nanhuprint.MacroRef",
		"name": "test1",
		"paramJs": "macroObj"
	}
 */
function MacroRefEval(){}

/**
 * 根据 name 从 nanhuprintEval_macro 中查找对应的 macro,
 * 根据 MacroRef.paramJs, 从 env 中找出对象,传递给 Macro.paramJs
 */
MacroRefEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
	var obj = nanhuprintEval_getOnionObj(metaObj);
	var resultLi = [];

	var macroObj = nanhuprintEval_macro[obj.name];
	if (macroObj) {
		var nestEnv;
		if (macroObj.paramJs) {
			if (!obj.paramJs) {
				throw new Error("<macroRef name=\"" + obj.name + "\" 缺少 paramJs 属性值");
			}
			// 生成一个独立的 nestEnv, 用 nanhuprint_outer 来指向 env
			var inputParam = expressionEvaluator.eval(obj.paramJs, env);// 从 env 中找出 MacroRef.paramJs

			var nestEnv = nanhuprintEval_getNestEnv(env);
			nestEnv[macroObj.paramJs] = inputParam;// 传递给 Macro.paramJs
			nestEnv.nanhuprint_outer = env;
		} else {
			nestEnv = env;
		}

		nanhuprintEval_loopEvalDynamicElement(macroObj.widthAndHeightAndPaddingLeft, nestEnv, expressionEvaluator, resultLi);
	}

	return resultLi.join("");
}

/**
 *{
        "TYPE_NAME": "nanhuprint.If.TextAlign",
        "js": "center",
        "pdf": "pdf",
        "jsSpel": "center",
        "pdfSpel": "gogogog"
    }
 这个元素没有 evalToHtml 方法,因此都被父元素给执行了,不会执行到子元素的 evalToHtml 方法
 * @constructor
 */
function CssElementEval() {}

CssElementEval.prototype.evalDynamicElement = function(metaObj, env, expressionEvaluator) {
    return nanhuprintEval_evalDynamicElementForOneLineElement(metaObj, env, expressionEvaluator);
}

CssElementEval.prototype.setIdAndParentId = function(metaObj, parentObj) {
    // do nothing
}
