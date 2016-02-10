define(function(require, exports, module) {
    "use strict";
    var Highcharts = require("highcharts");
    var merge = Highcharts.merge;
    var pick = Highcharts.pick;
    var mathFloor = Math.floor;
    var mathRound = Math.round;
    var mathCeil = Math.ceil;
    var mathMax = Math.max;
    var mathMin = Math.min;
    
    function defined(obj) { return obj !== undefined && obj !== null; }
    function nextFrame(cb) {
        if (window.requestAnimationFrame) {
            return window.requestAnimationFrame(cb);
        } else {
            return setTimeout(cb , 16.7);
        }
    }
    
    var SVG_NS = 'http://www.w3.org/2000/svg';
    
    var zColor = require("zrender/tool/color");
    var Text = require("zrender/shape/Text");
    var Path = require("zrender/shape/Path");
    var Rectangle = require("zrender/shape/Rectangle");
    var Circle = require("zrender/shape/Circle");
    var Image = require("zrender/shape/Image");
    var Group = require('zrender/Group');
    var ZUtil = require("zrender/tool/util");
    
    /**
     * 修复矩形奇数像素宽度边框绘制结果模糊的问题。
     */
    function HRectangle(options) {
        Rectangle.call(this , options);
    }
    HRectangle.prototype = {
        _buildRadiusPath: function (ctx, style) {
            var x = (style.lineWidth && style.lineWidth%2 !== 0) ? style.x + 0.5 : style.x;
            var y = (style.lineWidth && style.lineWidth%2 !== 0) ? style.y + 0.5 : style.y;
            var width = style.width;
            var height = style.height;
            var r = style.radius;
            var r1; 
            var r2; 
            var r3; 
            var r4;
              
            if (typeof r === 'number') {
                r1 = r2 = r3 = r4 = r;
            }
            else if (r instanceof Array) {
                if (r.length === 1) {
                    r1 = r2 = r3 = r4 = r[0];
                }
                else if (r.length === 2) {
                    r1 = r3 = r[0];
                    r2 = r4 = r[1];
                }
                else if (r.length === 3) {
                    r1 = r[0];
                    r2 = r4 = r[1];
                    r3 = r[2];
                }
                else {
                    r1 = r[0];
                    r2 = r[1];
                    r3 = r[2];
                    r4 = r[3];
                }
            }
            else {
                r1 = r2 = r3 = r4 = 0;
            }
            
            var total;
            if (r1 + r2 > width) {
                total = r1 + r2;
                r1 *= width / total;
                r2 *= width / total;
            }
            if (r3 + r4 > width) {
                total = r3 + r4;
                r3 *= width / total;
                r4 *= width / total;
            }
            if (r2 + r3 > height) {
                total = r2 + r3;
                r2 *= height / total;
                r3 *= height / total;
            }
            if (r1 + r4 > height) {
                total = r1 + r4;
                r1 *= height / total;
                r4 *= height / total;
            }
            ctx.moveTo(x + r1, y);
            ctx.lineTo(x + width - r2, y);
            r2 !== 0 && ctx.quadraticCurveTo(
                x + width, y, x + width, y + r2
            );
            ctx.lineTo(x + width, y + height - r3);
            r3 !== 0 && ctx.quadraticCurveTo(
                x + width, y + height, x + width - r3, y + height
            );
            ctx.lineTo(x + r4, y + height);
            r4 !== 0 && ctx.quadraticCurveTo(
                x, y + height, x, y + height - r4
            );
            ctx.lineTo(x, y + r1);
            r1 !== 0 && ctx.quadraticCurveTo(x, y, x + r1, y);
        },
        buildPath: function (ctx, style) {
            if (!style.radius) {
                var x = (style.lineWidth && style.lineWidth%2 !== 0) ? style.x + 0.5 : style.x , 
                    y = (style.lineWidth && style.lineWidth%2 !== 0) ? style.y + 0.5 : style.y;
                ctx.moveTo(x, y);
                ctx.lineTo(x + style.width, y);
                ctx.lineTo(x + style.width, y + style.height);
                ctx.lineTo(x, y + style.height);
                ctx.lineTo(x, y);
            }else {
                Rectangle.prototype.buildPath.apply(this , arguments);
            }
            ctx.closePath();
        }
    }
    ZUtil.inherits(HRectangle , Rectangle);
    /**
     * 为Path扩展dash
     */
    function HPath(options) {
        Rectangle.call(this , options);
    }
    HPath.prototype = {
        buildPath : function (ctx, style) {
            if (ctx.setLineDash && (style.lineType === "dashed" || style.lineType === "dotted")) {
                    ctx.setLineDash(style.dashArray);
            } else {
                // TODO 适配实现
            }
            Path.prototype.buildPath.apply(this , arguments);
        }
    }
    ZUtil.inherits(HPath , Path);
    
    function mergeParentStyle(parent , style) {
        if (parent && parent.__inheritTextStyle) {
            return merge(mergeParentStyle(parent.parent , parent.style) , style);
        } else {
            return style;
        }
    }
    var textFactor = { 14: 0.143 , 15: 0.167 , 16: 0.157 , 17: 0.177 , 18: 0.195 , 19: 0.185 , 20: 0.2 , 21: 0.191 , // 19px
        22: 0.205 , 23: 0.207 , 24: 0.208 , 25: 0.210 , 26: 0.211 , 27: 0.213 , 28: 0.214 , 29: 0.216 , 30: 0.217 , 31: 0.219 , // 29px
        32: 0.22  , 33: 0.2204, 34: 0.2208, 35: 0.2212, 36: 0.2216, 37: 0.222, 38: 0.2224, 39: 0.2228 , 40: 0.2232, 41: 0.2236, // 39px
        42: 0.239 , 43: 0.2392 , 44: 0.2394 , 45: 0.2396 , 46: 0.2398 , 47: 0.24 , 48: 0.2402 , 49: 0.2404 , 50: 0.2406 , 51: 0.2408 , // 49px
        52: 0.241 , 53: 0.2411 , 54: 0.2412 , 55: 0.2413 , 56: 0.2414 , 57: 0.2415 , 58: 0.2416 , 59: 0.2417 , 60: 0.2418 , 61: 0.2419 , // 59px
        62: 0.242 , 63: 0.2428 , 64: 0.2436 , 65: 0.2444 , 66: 0.2452 , 67: 0.246 , 68: 0.2468 , 69: 0.2476 , 70: 0.2484 , 71: 0.2492 , // 69px
        72: 0.25  // 70px
    }
    
    /**
     * 扩展文本，使得文本可以继承父容器样式。
     */
    function HText(options) {
        Text.call(this , options);
    }
    HText.prototype = {
        brush : function (ctx, isHighlight) {
            if (this.parent && this.parent.__inheritTextStyle) {
                var cacheStyle = this.style;
                this.style = mergeParentStyle(this.parent , this.style);
                Text.prototype.brush.apply(this , arguments);
                this.style = cacheStyle;
            } else {
                Text.prototype.brush.apply(this , arguments);
            }
        },
        getRect: function () {
            if (this.style.__rect) {
                return this.style.__rect;
            }
            var style = mergeParentStyle(this.parent , this.style);
            var rect = Text.prototype.getRect.call(this , style);
            // 位置修正
            var h = Math.max(rect.height , 14);
            var factor = textFactor[mathRound(h)] || 0.25;
            var fix = mathCeil(rect.height * factor);
            rect.height = rect.height + 2 * fix;
            rect.y = rect.y - fix;
            this.style.__rect = rect;
            return rect;
        }
    }
    ZUtil.inherits(HText , Text);
    
    function Dom() {};
    Dom.prototype = {
        namespaceURI: SVG_NS, // 伪装成SVG
        nodeName: 'div',
        renderer: null ,
        attributes: null,
        childNodes: null,
        firstChild: null,
        init: function (renderer , opts) {
            this.renderer = renderer;
            // 浅表克隆
            this.attributes = {};
            this.childNodes = [];
            this.style = merge(this.getDefaultStyle());
            
            if (opts) {
                for (var prop in opts) {
                    this[prop] = opts[prop]
                }
            }
        } ,
        clip: function (element) {
            // 子类实现如何剪裁；
            this.setDirty();
        } ,
        getDefaultStyle: function () {
            return {};
        } ,
        getAttribute: function (key) {
            return this.attributes[key];
        },
        setAttribute: function (key, value) {
            if (key === "class") {
                this.addClass(value);
            }
            this.attributes[key] = value;
            this.setDirty();
            // console.log(this.nodeName + " : set " + key + ' = ' + value);
        },
        addClass: function (value) {
            // body...
        },
        getStyle: function (key) {
            return this.style[key];
        },
        setStyle: function (key , value) {
            this.style[key] = value;
            this.setDirty();
        },
        removeAttribute: function (key) {
            delete this.attributes[key];
            this.setDirty();
            // console.log(this.nodeName + " : del " + key);
        },
        _on: function (type, fn) {
            // 子类实现
        },
        _off: function (type , fn) {
            // 子类实现
        },
        appendChild: function (element) {
            if (!element) {
                return;
            }
            if (element.parentNode){
                element.parentNode.removeChild(element);
            }
            this.childNodes.push(element);
            this.firstChild = this.childNodes[0];
            element.parentNode = this;
            // element.setDirty();
            this.setDirty();
        },
        insertBefore: function (newItem, existingItem) {
            if (!newItem) {
                return;
            }
            if (newItem.parentNode) {
                newItem.parentNode.removeChild(newItem);
            }
            this.childNodes.splice(this.childNodes.indexOf(existingItem), 0, newItem);
            this.firstChild = this.childNodes[0];
            newItem.parentNode = this;
            // newItem.setDirty();
            this.setDirty();
        },
        removeChild: function (element) {
            if (!element) {
                return;
            }
            var ind = this.childNodes.indexOf(element);
            if (ind !== -1){
                this.childNodes.splice(ind , 1);
                this.firstChild = this.childNodes[0];
                this.setDirty();
                delete element.parentNode;
            }
        },
        getElementsByTagName: function (tagName) {
            // TODO 递归遍历
            var arr = [];
            if (!tagName){
                return arr;
            }
            for (var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].nodeName === tagName) {
                    arr.push(this.childNodes[i]);
                }
            }
            return arr;
        },
        cloneNode: function () {
            return this;
        },
        translate: function (x , y) {
            this.setDirty();
        },
        rotate: function (rot , ox , oy) {
            this.setDirty();
        },
        scale: function (x , y) {
            this.setDirty();
        },
        setDirty: function () {
            if (this.parentNode) {
                this.parentNode.setDirty(true);
            }
        },
        translateXSetter: function (value) {
            this.setDirty();
        },
        translateYSetter: function (value) {
            this.setDirty();
        },
        rotationSetter: function (value) {
            this.setDirty();
        },
        verticalAlignSetter: function (value) {
            this.setDirty();
        },
        scaleXSetter: function (value) {
            this.setDirty();
        },
        scaleYSetter: function (value) {
            this.setDirty();
        },
    };
    
    function collectColorList(stopNodes) {
        var list = [] , attrs;
        for (var i = 0; i < stopNodes.length; i++) {
            attrs = stopNodes[i].attributes;
            list.push([attrs["offset"] , zColor.alpha(attrs["stop-color"] , attrs["stop-opacity"])]);
        }
        return list;
    }
    
    function LinearGradient(){ Dom.call(this) }
    LinearGradient.prototype = {
        __stops: null ,
        toColor: function (style) {
            // TODO 尚未应用转换
            if (!this.__stops){
                this.__stops = collectColorList(this.childNodes);
            }
            var attrs = this.attributes;
            return zColor.getLinearGradient(
                attrs["x1"] * style.x , style.y + attrs["y1"] * style.y , 
                attrs["x2"] * style.width , attrs["y2"] * style.height ,
                this.__stops);
        }
    };
    ZUtil.inherits(LinearGradient , Dom);
    
    function RadialGradient(){ Dom.call(this) }
    RadialGradient.prototype = {
        __stops: null ,
        toColor: function (style) {
            // TODO 尚未应用转换
            if (!this.__stops){
                this.__stops = collectColorList(this.childNodes);
            }
            var attrs = this.attributes;
            var cx = style.x - attrs["cx"] * style.r , cy = style.y - attrs["cy"] * style.r;
            return zColor.getRadialGradient(
                cx , cy , 0 ,
                cx , cy , attrs["r"] * style.r ,
                this.__stops);
        }
    };
    ZUtil.inherits(RadialGradient , Dom);
    
    function Stop(){ Dom.call(this) }
    ZUtil.inherits(Stop , Dom);
    
    
    
    function dimensionConverter(value) {
        value = /px/.test(value) ? parseInt(value) : value;
        return mathFloor(value)
    }
    
    function convertZValue(converter , key , value) {
        if (converter && converter[key]) {
            if (typeof converter[key] === 'function'){
                return converter[key].call(this , value);
            } else if (defined(converter[key][value])) {
                return converter[key][value]
            }
        }
        return value;
    }
    
    var attr2ZStyle = {
        "x": 'x' ,
        "y": 'y' ,
        "width": 'width' ,
        "height": 'height' ,
        "text": 'text' ,
        "text-anchor": "textAlign" ,
        'verticalAlign': "textBaseline" , // 可能会有问题
        'visibility': 'ignore',
        "opacity": "opacity" ,
        "fill": "color",
        'shadow-color': "shadowColor",
        'shadow-blur': "shadowBlur",
        'shadow-offsetX': "shadowOffsetX",
        'shadow-offsetY': "shadowOffsetY"
    }
    
    var attr2ZValue = {
        "text-anchor": {
            'middle': 'center'
        },
        "x": dimensionConverter ,
        "y": dimensionConverter ,
        "width": dimensionConverter ,
        "height": dimensionConverter ,
        "visibility": function (value) {
            var ignore = (value === "hidden");
            if (this.shape) {
                this.shape.ignore = ignore;
            }
            return ignore;
        }
    }
    
    var removeAttrValue = {
        "stroke": function (key , zProp) {
            this.setAttribute(key , "none");
            delete this.shape.style[zProp]
        },
        "visibility": function (key , zProp) {
            delete this.shape[zProp];
        }
    }
    
    var groupAttr2ZStyle = merge(attr2ZStyle , {
        
    });
    
    var groupAttr2ZValue = merge(attr2ZValue , {
        // opacity 将遍历到叶子节点逐个套用
        "opacity": function (value) {
            var node;
            for (var i = 0; i < this.childNodes.length; i++) {
                this.childNodes[i].setAttribute("opacity" , value);
            }
            return value;
        }
    });
    
    function GDom(){ Dom.call(this) }
    GDom.prototype = {
        nodeName: 'g' ,
        attrConverter: groupAttr2ZStyle ,
        valueConverter: groupAttr2ZValue ,
        __events__: null ,
        init: function (renderer , opts) {
            Dom.prototype.init.apply(this , arguments);
            this.shape = new Group({
                style: this.style
            });
            this.__events__ = {};
        },
        clip: function (element) {
            if (element.shape){
                this.shape.clipShape = element.shape;
            }
            Dom.prototype.clip.apply(this , arguments);
        } ,
        setStyle: function (key , value) {
            var zProp = this.attrConverter[key]
            if (zProp) {
                this.shape.style[zProp] = convertZValue.call(this , this.valueConverter , key , value);
            } else {
                this.shape.style[key] = value;
            }
            Dom.prototype.setStyle.apply(this , arguments);
        },
        setAttribute: function (key, value) {
            var zProp = this.attrConverter[key]
            if (zProp) {
                this.shape.style[zProp] = convertZValue.call(this , this.valueConverter , key , value);
            }
            Dom.prototype.setAttribute.apply(this , arguments);
        },
        removeAttribute: function (key) {
            var zProp = this.attrConverter[key]
            if (zProp) {
                removeAttrValue[key] && removeAttrValue[key].call(this , key , zProp);
            }
            Dom.prototype.removeAttribute.apply(this , arguments);
        },
        _on: function (type, fn) {
            for (var i = 0; i < this.childNodes.length; i++) {
                this.childNodes[i]._on(type , fn);
            }
            this.__events__[type] = fn;
        },
        _off: function (type , fn) {
            for (var i = 0; i < this.childNodes.length; i++) {
                this.childNodes[i]._off(type , fn);
            }
            this.__events__ = {};
        },
        appendChild: function (element) {
            if (!element) {
                return;
            }
            Dom.prototype.appendChild.apply(this , arguments);
            if (element.shape) {
                if (element.shape.parent) {
                    element.shape.parent.removeChild(element.shape);
                }
                this.shape.addChild(element.shape);
                // 套用可见性设置
                var visible = this.getAttribute("opacity");
                if (defined(visible)) {
                    element.setAttribute("opacity" , visible)
                }
                // 追加事件函数
                for (var prop in this.__events__) {
                    element._on(prop , this.__events__[prop]);
                }
                this._childAdded(element , this.shape._children.length - 1);
            }
        },
        insertBefore: function (newItem, existingItem) {
            if (!newItem) {
                return;
            }
            Dom.prototype.insertBefore.apply(this , arguments);
            if (newItem && newItem.shape) {
                if (newItem.shape.parent){
                    newItem.shape.parent.removeChild(newItem.shape);
                }
                this.shape.addChild(newItem.shape);
                // 调整顺序
                var childrens = this.shape._children;
                var from = (existingItem && existingItem.shape) ? childrens.indexOf(existingItem.shape) : 0;
                from = (from === -1) ? 0 : from;
                var switching = childrens[from];
                var temp;
                childrens[from] = newItem.shape;
                for (var i = from + 1; i < childrens.length; i++) {
                    if (childrens[i]) {
                        temp = childrens[i];
                        childrens[i] = switching;
                        switching = temp;
                    }
                }
                
                // 套用可见性设置
                var visible = this.getAttribute("opacity");
                if (defined(visible)) {
                    newItem.setAttribute("opacity" , visible)
                }
                // 追加事件函数
                for (var prop in this.__events__) {
                    newItem._on(prop , this.__events__[prop]);
                }
                this._childAdded(newItem , from , true);
            }
        },
        removeChild: function (element) {
            if (!element) {
                return;
            }
            Dom.prototype.removeChild.apply(this , arguments);
            if (element.shape){
                var ind = this.shape._children.indexOf(element.shape);
                if (ind !== -1){
                    element._off();
                    this.shape.removeChild(element.shape);
                    this._childRemoved(element , ind)
                }
            }
        },
        _childAdded: function (element , index , insert) {
            if (element.shape && "zlevel" in this.shape) {
                setZLevel(element.shape , this.shape.zlevel);
            }
        },
        _childRemoved: function (element , index) {
            // body...
        },
        translate: function (x , y) {
            this.shape.position[0] = x;
            this.shape.position[1] = y;
            Dom.prototype.translate.apply(this , arguments);
        },
        rotate: function (rot , ox , oy) {
            rot = (-rot) * Math.PI / 180;
            this.shape.rotation[0] = rot;
            if (arguments.length > 1) {
                this.shape.rotation[1] = ox || 0;
                this.shape.rotation[2] = oy || 0;
            }
            Dom.prototype.rotate.apply(this , arguments);
        },
        scale: function (x , y) {
            this.shape.scale[0] = x;
            this.shape.scale[1] = y;
            Dom.prototype.scale.apply(this , arguments);
        },
        translateXSetter: function (value) {
            this.shape.position[0] = value;
            Dom.prototype.translateXSetter.apply(this , arguments);
        },
        translateYSetter: function (value) {
            this.shape.position[1] = value;
            Dom.prototype.translateYSetter.apply(this , arguments);
        },
        rotationSetter: function (value) {
            this.shape.rotation[0] = value || 0;
            Dom.prototype.rotationSetter.apply(this , arguments);
        },
        verticalAlignSetter: function (value) {
            // TODO
            this.setDirty();
        },
        scaleXSetter: function (value) {
            this.shape.scale[0] = value;
            Dom.prototype.scaleXSetter.apply(this , arguments);
        },
        scaleYSetter: function (value) {
            this.shape.scale[1] = value;
            Dom.prototype.scaleYSetter.apply(this , arguments);
        },
    }
    ZUtil.inherits(GDom , Dom);
    
    function DefsDom() { GDom , Dom.call(this) }
    DefsDom.prototype = {
        nodeName: 'defs' ,
    }
    ZUtil.inherits(DefsDom , GDom , Dom);
    
    function setZLevel(shape , zlevel) {
        shape.zlevel = zlevel;
        if (shape instanceof Group) {
            shape.eachChild(function (child) {
                setZLevel(child , zlevel);
            });
        }
    }
    
    function CanvasDom() { GDom.call(this) }
    CanvasDom.prototype = {
        nodeName: 'canvas' ,
        nativeRenderer: null ,
        init: function (renderer , opts) {
            GDom.prototype.init.apply(this , arguments);
            this.nativeRenderer = opts.nativeRenderer;
            this.nativeRenderer.addElement(this.shape);
            return this;
        },
        __dirtyFlag: false ,
        setDirty: function () {
            var self = this;
            if (!this.__dirtyFlag) {
                this.__dirtyFlag = true;
                nextFrame(function() {
                    self.nativeRenderer.render();
                    self.__dirtyFlag = false;
                });
            }
        },
        _childAdded: function (element , index , insert) {
            if (element.shape) {
                var zl;
                var afterChild = this.shape._children[index + 1];
                var beforeChild = this.shape._children[index - 1];
                if (insert) {
                    if (!afterChild && !beforeChild) {
                        zl = index;
                    } else if (!afterChild) {
                        zl = beforeChild.zlevel + 1;
                    } else if (!beforeChild) {
                        zl = afterChild.zlevel - 1;
                    } else {
                        if (afterChild.zlevel !== beforeChild.zlevel + 1) {
                            zl = beforeChild.zlevel + 1;
                        } else {
                            var childrens = this.shape._children;
                            var i
                            if (index * 2 > childrens.length) {
                                zl = afterChild.zlevel;
                                for (i = index + 1; i < childrens.length; i++) {
                                    setZLevel(childrens[i] , childrens[i].zlevel + 1);
                                }
                            } else {
                                zl = beforeChild.zlevel;
                                for (i = index - 1; i >= 0; i--) {
                                    setZLevel(childrens[i] , childrens[i].zlevel - 1);
                                }
                            }
                        }
                    }
                } else if (beforeChild) {
                    zl = beforeChild.zlevel + 1;
                } else {
                    zl = index;
                }
                setZLevel(element.shape , zl);
            }
        },
    }
    ZUtil.inherits(CanvasDom , GDom);
    
    var shapeAttr2ZStyle = merge(attr2ZStyle , {
        "stroke-dasharray": "dashArray" ,
        "dashstyle": 'lineType'
    });
    
    var shapeAttr2ZValue = merge(attr2ZValue , {
    });
    
    var checkHoverabled = {
        "mouseout": true ,
        "mouseover": true ,
        "mousemove": true ,
    }
    var checkClickabled = {
        "click": true
    }
    
    function ShapeDom() { Dom.call(this) }
    ShapeDom.prototype = {
        nodeName: 'shape' ,
        ShapeClass: null ,
        defaultOptions: null ,
        attrConverter: shapeAttr2ZStyle ,
        valueConverter: shapeAttr2ZValue ,
        init: function (renderer , opts) {
            Dom.prototype.init.apply(this , arguments);
            this.shape = new this.ShapeClass({
                style: this.style
            });
            this.shape.hoverable = false;
            this.shape.clickable = false;
        } ,
        getDefaultStyle: function () {
            return ShapeDom.defaultStyle;
        } ,
        setStyle: function (key , value) {
            var zProp = this.attrConverter[key]
            if (zProp) {
                this.shape.style[zProp] = convertZValue.call(this , this.valueConverter , key , value);
            } else {
                this.shape.style[key] = value;
            }
            Dom.prototype.setStyle.apply(this , arguments);
        },
        setAttribute: function (key, value) {
            var zProp = this.attrConverter[key];
            if (zProp) {
                this.shape.style[zProp] = convertZValue.call(this , this.valueConverter , key , value);
            }
            Dom.prototype.setAttribute.apply(this , arguments);
        },
        removeAttribute: function (key) {
            var zProp = this.attrConverter[key];
            if (zProp) {
                removeAttrValue[key] && removeAttrValue[key].call(this , key , zProp);
            }
            Dom.prototype.setAttribute.apply(this , arguments);
        },
        _on: function (type, fn) {
            this.shape.hoverable = this.shape.hoverable || checkHoverabled[type] || false;
            this.shape.clickable = this.shape.clickable || checkClickabled[type] || false;
            var self = this;
            this.shape.bind(type , function (e) {
                e.target = self;
                fn(e);
            });
        },
        _off: function (type , fn) {
            if (!arguments.length) {
                this.shape._handlers = {};
            }
        },
        getBBox: function () {
            return this.shape.getRect(this.shape.style);
        },
        translate: function (x , y) {
            this.shape.position[0] = x;
            this.shape.position[1] = y;
            Dom.prototype.translate.apply(this , arguments);
        },
        rotate: function (rot , ox , oy) {
            rot = (-rot) * Math.PI / 180;
            this.shape.rotation[0] = rot;
            if (arguments.length > 1) {
                this.shape.rotation[1] = ox;
                this.shape.rotation[2] = oy;
            }
            Dom.prototype.rotate.apply(this , arguments);
        },
        scale: function (x , y) {
            this.shape.scale[0] = x;
            this.shape.scale[1] = y;
            Dom.prototype.scale.apply(this , arguments);
        },
        setDirty: function () {
            if (!this.shape.__dirty) {
                this.shape.__dirty = true;
                Dom.prototype.setDirty.apply(this , arguments);
            }
        },
        translateXSetter: function (value) {
            this.shape.position[0] = value;
            Dom.prototype.translateXSetter.apply(this , arguments);
        },
        translateYSetter: function (value) {
            this.shape.position[1] = value;
            Dom.prototype.translateYSetter.apply(this , arguments);
        },
        rotationSetter: function (value) {
            this.shape.rotation[0] = value;
            Dom.prototype.rotationSetter.apply(this , arguments);
        },
        verticalAlignSetter: function (value) {
            this.setAttribute("verticalAlign" , value);
            Dom.prototype.verticalAlignSetter.apply(this , arguments);
        },
        scaleXSetter: function (value) {
            this.shape.scale[0] = value;
            Dom.prototype.scaleXSetter.apply(this , arguments);
        },
        scaleYSetter: function (value) {
            this.shape.scale[1] = value;
            Dom.prototype.scaleYSetter.apply(this , arguments);
        },
    }
    ZUtil.inherits(ShapeDom , Dom);
    ShapeDom.defaultStyle = {
        x: 0 ,
        y: 0 ,
    };
    
    var TextDomGroupAttrSetter = {
        "x": function (value) {
            // this.translateXSetter(dimensionConverter(value));
            this.__x = value;
            this._updatePosition();
        } ,
        "y": function (value) {
            // this.translateYSetter(dimensionConverter(value));
            this.__y = value;
            this._updatePosition();
        } ,
        "text": function (value) {
            if (!this.textDom) {
                this.textDom = new TextDom();
                this.textDom.init(this.renderer);
                this.insertBefore(this.textDom);
            }
            this.textDom.setAttribute("text" , value);
        }
    }
    
    function findFirstText(dom) {
        for (var i = dom.childNodes.length; i--; ) {
            if (dom.childNodes[i] instanceof TextDom) {
                return dom.childNodes[i];
            } else {
                return findFirstText(dom.childNodes[i]);
            }
        }
        return null;
    }
    function onlyOneTextDom(dom) {
        var result = [];
        for (var i = dom.childNodes.length; i--; ) {
            if (dom.childNodes[i] instanceof TextDom) {
                result.push(dom.childNodes[i]);
            } else {
                result = result.concat(findFirstText(dom.childNodes[i]));
            }
            if (result.length > 1) {
                break;
            }
        }
        return result;
    }
    
    function TextDomGroup() { GDom.call(this); }
    TextDomGroup.prototype = {
        nodeName: 'text' ,
        ShapeClass: Group ,
        textDom: null ,
        __x: 0 ,
        __y: 0 ,
        __translateX: 0 ,
        __translateY: 0 ,
        init: function (renderer , opts) {
            GDom.prototype.init.apply(this , arguments);
            this.shape.__inheritTextStyle = true;
        },
        setAttribute: function (key, value) {
            GDom.prototype.setAttribute.apply(this , arguments);
            if (TextDomGroupAttrSetter[key]){
                TextDomGroupAttrSetter[key].call(this , value);
            }
        },
        setStyle: function (key , value) {
            GDom.prototype.setStyle.apply(this , arguments);
        },
        appendChild: function (element) {
            GDom.prototype.appendChild.apply(this , arguments);
        },
        insertBefore: function (newItem, existingItem) {
            GDom.prototype.insertBefore.apply(this , arguments);
        },
        removeChild: function (element) {
            GDom.prototype.removeChild.apply(this , arguments);
        },
        getBBox: function () {
            if (this.textDom) {
                return this.textDom.getBBox();
            }
            // 如果只有一个TextDom元素
            var onlyOnes = onlyOneTextDom(this);
            if (!onlyOnes.length) {
                return {x: 0 , y: 0 , width: 0 , height: 0};
            }
            if (onlyOnes.length === 1) {
                return onlyOnes[0].getBBox();
            }
            
            var ww = 0 , hh = 0 , x = 0 , y = 0 , dx , dy , box , node;
            var nx = 0 , ny = 0;
            for (var i = 0; i < this.childNodes.length; i++) {
                node = this.childNodes[i];
                x = node.getAttribute("x");
                y = node.getAttribute("y");
                dx = node.getAttribute("dx") || 0;
                dy = node.getAttribute("dy") || 0;
                nx = defined(x) ? x : nx + dx;
                ny = defined(y) ? y : ny + dy;
                node.setAttribute("x" , nx);
                node.setAttribute("y" , ny);
                box = node.getBBox();
                nx = nx + box.width;
                
                ww = mathMax(ww , nx);
                hh = mathMax(hh , ny + box.height);
            }
            return {x: 0 , y: 0 , width: ww , height: hh};
        },
        rotate: function (rot , ox , oy) {
            if (arguments.length > 1) {
                ox -= pick(this.__x , 0);
                oy -= pick(this.__y , 0);
            }
            GDom.prototype.rotate.call(this , rot , ox , oy);
        },
        translate: function (x , y) {
            this.__translateX = x;
            this.__translateY = y;
            GDom.prototype.translate.apply(this , arguments);
            this._updatePosition();
        },
        translateXSetter: function (value) {
            this.__translateX = value;
            GDom.prototype.translateXSetter.apply(this , arguments);
            this._updatePosition();
        },
        translateYSetter: function (value) {
            this.__translateY = value;
            GDom.prototype.translateYSetter.apply(this , arguments);
            this._updatePosition();
        },
        // 更新grouptranslate和rotation原点位置。
        _updatePosition: function () {
            this.shape.position[0] = mathFloor(this.__x + this.__translateX);
            this.shape.position[1] = mathFloor(this.__y + this.__translateY);
        }
    }
    ZUtil.inherits(TextDomGroup , GDom);
    
    function TextDom() { ShapeDom.call(this) }
    TextDom.prototype = {
        nodeName: 'text' ,
        ShapeClass: HText ,
        getDefaultStyle: function () {
            return TextDom.defaultStyle
        }
    }
    ZUtil.inherits(TextDom , ShapeDom);
    TextDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        brushType: 'fill'
    })
    
    function SpanDom() { TextDomGroup.call(this) }
    SpanDom.prototype = {
        nodeName: 'span' ,
    }
    ZUtil.inherits(SpanDom , TextDomGroup);
    
    function TSpanDom() { TextDomGroup.call(this) }
    TSpanDom.prototype = {
        nodeName: 'tspan'
    }
    ZUtil.inherits(TSpanDom , TextDomGroup);
    
    var pathAttr2ZStyle = merge(shapeAttr2ZStyle , {
        "d": "path" ,
        "gradient-fill": "color" ,
        "stroke": "strokeColor" ,
        "stroke-width": "lineWidth" ,
        "fill-opacity": "opacity" ,
        "stroke-linecap": "lineCape"
    })
    
    var rectAttr2ZStyle = merge(pathAttr2ZStyle , {
        "rx": "radius" ,
        "ry": "radius" ,
    })
    
    var circleAttr2ZStyle = merge(pathAttr2ZStyle , {
        "r": "r" ,
        "cx": "x" ,
        "cy": "y"
    })
    
    function setBrushType(shape) {
        var fill = shape.__useFill;
        var stroke = shape.__useStroke;
        shape.style.brushType = (fill && stroke) ? "both" : 
                                fill ? "fill" : 
                                stroke ? "stroke" : 
                                "none";
    }
    
    var pathAttr2ZValue = merge(attr2ZValue , {
        "fill": function (value) {
            var result;
            if (!value || value === "none") {
                result = 'rgba(0,0,0,0)';
                this.shape.__useFill = false;
            } else {
                result = value;
                this.shape.__useFill = true;
            }
            setBrushType(this.shape);
            return result;
        } ,
        "stroke": function (value) {
            var result;
            if (!value || value === "none") {
                result = 'rgba(0,0,0,0)';
                this.shape.__useStroke = false;
            } else {
                result = value;
                this.shape.__useStroke = true;
            }
            setBrushType(this.shape);
            return result;
        } ,
        "d": function (value) {
            if (this.style.path !== value) {
                // 删除cache，已保证zrender使用新的path绘图
                delete this.style.pathArray;
            }
            return value;
        }
    })
    
    var rectAttr2ZValue = merge(pathAttr2ZValue , {
        
    })
    
    var circleAttr2ZValue = merge(pathAttr2ZValue , {
        "cx": dimensionConverter ,
        "cy": dimensionConverter ,
    })
    
    function PathDom() { ShapeDom.call(this) }
    PathDom.prototype = {
        nodeName: 'path' ,
        ShapeClass: HPath ,
        attrConverter: pathAttr2ZStyle ,
        valueConverter: pathAttr2ZValue ,
        getDefaultStyle: function () {
            return PathDom.defaultStyle
        }
    }
    ZUtil.inherits(PathDom , ShapeDom);
    
    PathDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        brushType : 'stroke',
    });
    
    function ClipPathDom() { GDom.call(this) }
    ClipPathDom.prototype = {
        nodeName: 'clipPath' ,
        ShapeClass: Group ,
    }
    ZUtil.inherits(ClipPathDom , GDom);
    
    function RectDom() { ShapeDom.call(this) }
    RectDom.prototype = {
        nodeName: 'rect' ,
        ShapeClass: HRectangle ,
        attrConverter: rectAttr2ZStyle ,
        valueConverter: rectAttr2ZValue ,
        getDefaultStyle: function () {
            return RectDom.defaultStyle
        }
    }
    ZUtil.inherits(RectDom , ShapeDom);
    
    RectDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        brushType : 'both',
    });
    
    var imageAttr2ZStyle = merge(pathAttr2ZStyle , {
        "hc-svg-href": "image" ,
    });
    var imageAttr2ZValue = merge(pathAttr2ZValue , {
        
    })
    function ImageDom() { ShapeDom.call(this) }
    ImageDom.prototype = {
        nodeName: 'image' ,
        ShapeClass: Image ,
        attrConverter: imageAttr2ZStyle ,
        valueConverter: imageAttr2ZValue ,
        getDefaultStyle: function () {
            return {}
        }
    }
    ZUtil.inherits(ImageDom , ShapeDom);
    
    function CircleDom() { ShapeDom.call(this) }
    CircleDom.prototype = {
        nodeName: 'circle' ,
        ShapeClass: Circle ,
        attrConverter: circleAttr2ZStyle ,
        valueConverter: circleAttr2ZValue ,
        getDefaultStyle: function () {
            return CircleDom.defaultStyle
        }
    }
    ZUtil.inherits(CircleDom , ShapeDom);
    
    CircleDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        "brushType": "both"
    })
    
    module.exports = {
        Dom: Dom ,
        LinearGradient: LinearGradient ,
        RadialGradient: RadialGradient ,
        Stop: Stop ,
        GDom: GDom ,
        CanvasDom: CanvasDom ,
        TextDom: TextDom ,
        TextDomGroup: TextDomGroup ,
        SpanDom: SpanDom ,
        DefsDom: DefsDom ,
        PathDom: PathDom ,
        RectDom: RectDom ,
        ClipPathDom: ClipPathDom ,
        TSpanDom: TSpanDom,
        CircleDom: CircleDom,
        ImageDom: ImageDom,
        
        HRectangle: HRectangle
    }
});