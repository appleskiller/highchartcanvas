define(function(require, exports, module) {
    "use strict";
    var Highcharts = require("highcharts");
    var merge = Highcharts.merge;
    var mathFloor = Math.floor;
    
    function defined(obj) { return obj !== undefined && obj !== null; }
    
    var SVG_NS = 'http://www.w3.org/2000/svg';
    
    var zColor = require("zrender/tool/color");
    var Text = require("zrender/shape/Text");
    var Path = require("zrender/shape/Path");
    var Rectangle = require("zrender/shape/Rectangle");
    var Circle = require("zrender/shape/Circle")
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
    
    function Dom() {};
    Dom.prototype = {
        namespaceURI: SVG_NS, // 伪装成SVG
        nodeName: 'div',
        attributes: null,
        childNodes: null,
        init: function (opts) {
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
        getDefaultStyle: function () {
            return {};
        } ,
        getAttribute: function (key) {
            return this.attributes[key];
        },
        setAttribute: function (key, value) {
            this.attributes[key] = value;
            this.setDirty();
            // console.log(this.nodeName + " : set " + key + ' = ' + value);
        },
        removeAttribute: function (key) {
            delete this.attributes[key];
            this.setDirty();
            // console.log(this.nodeName + " : del " + key);
        },
        appendChild: function (element) {
            if (element.parentNode){
                element.parentNode.removeChild(element);
            }
            this.childNodes.push(element);
            element.parentNode = this;
            this.setDirty();
        },
        insertBefore: function (newItem, existingItem) {
            if (newItem.parentNode) {
                newItem.parentNode.removeChild(newItem);
            }
            this.childNodes.splice(this.childNodes.indexOf(existingItem), 0, newItem);
            newItem.parentNode = this;
            this.setDirty();
        },
        removeChild: function (element) {
            var ind = this.childNodes.indexOf(element);
            if (ind !== -1){
                this.childNodes.splice(ind , 1);
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
            
            // if (!this.parentNode)
            //     console.warn(this.nodeName);
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
    
    function DefsDom() { Dom.call(this) }
    DefsDom.prototype = {
        nodeName: 'defs' ,
    }
    ZUtil.inherits(DefsDom , Dom);
    
    function GDom(){ Dom.call(this) }
    GDom.prototype = {
        nodeName: 'g' ,
        init: function (opts) {
            Dom.prototype.init.apply(this , arguments);
            this.shape = new Group();
        } ,
        appendChild: function (element) {
            Dom.prototype.appendChild.apply(this , arguments);
            if (element.shape) {
                if (element.shape.parent) {
                    element.shape.parent.removeChild(element.shape);
                }
                this.shape.addChild(element.shape);
            }
        },
        insertBefore: function (newItem, existingItem) {
            Dom.prototype.insertBefore.apply(this , arguments);
            if (newItem && newItem.shape && existingItem && existingItem.shape) {
                if (newItem.shape.parent){
                    newItem.shape.parent.removeChild(newItem.shape);
                }
                this.shape.addChild(newItem.shape);
                // 调整顺序
                var childrens = this.shape._children;
                var from = childrens.indexOf(existingItem.shape);
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
            }
        },
        removeChild: function (element) {
            Dom.prototype.removeChild.apply(this , arguments);
            if (element.shape){
                var ind = this.shape._children.indexOf(element.shape);
                if (ind !== -1){
                    this.shape.removeChild(element.shape);
                }
            }
        },
        translate: function (x , y) {
            this.shape.position[0] = x;
            this.shape.position[1] = y;
            Dom.prototype.translate.apply(this , arguments);
        },
        rotate: function (rot , ox , oy) {
            // rot = (rot - 180) * Math.PI / 180;
            this.shape.rotation[0] = rot;
            if (arguments.length > 1) {
                this.shape.rotation[1] = ox;
                this.shape.rotation[2] = oy;
            }
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
            this.shape.rotation[0] = value;
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
            // console.log('scale' , value);
            Dom.prototype.scaleYSetter.apply(this , arguments);
        },
    }
    ZUtil.inherits(GDom , Dom);
    
    function CanvasDom() { GDom.call(this) }
    CanvasDom.prototype = {
        nodeName: 'canvas' ,
        nativeRenderer: null ,
        init: function (opts) {
            GDom.prototype.init.apply(this , arguments);
            this.nativeRenderer = opts.nativeRenderer;
            this.nativeRenderer.addGroup(this.shape);
            return this;
        },
        __dirtyFlag: false ,
        setDirty: function () {
            var self = this;
            if (!this.__dirtyFlag) {
                this.__dirtyFlag = true;
                setTimeout(function() {
                    self.nativeRenderer.render();
                    self.__dirtyFlag = false;
                }, 10);
            }
        } ,
        appendChild: function (element) {
            GDom.prototype.appendChild.apply(this , arguments);
            // console.log(element.nodeName , 'append to canvas')
        },
    }
    ZUtil.inherits(CanvasDom , GDom);
    
    var attr2ZStyle = {
        "x": 'x' ,
        "y": 'y' ,
        "width": 'width' ,
        "height": 'height' ,
        "text": 'text' ,
        "text-anchor": "textAlign" ,
        'verticalAlign': "textBaseline" , // 可能会有问题
    }
    
    var pathAttr2ZStyle = merge(attr2ZStyle , {
        "d": "path" ,
        "fill": "color" ,
        "gradient-fill": "color" ,
        "stroke": "strokeColor" ,
        "stroke-width": "lineWidth" ,
        "fill-opacity": "opacity" ,
        "stroke-linecap": "lineCape" ,
        "dashstyle": 'lineType'
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
    
    var attr2ZValue = {
        "text-anchor": {
            'middle': 'center'
        },
        "x": mathFloor ,
        "y": mathFloor ,
        "width": mathFloor ,
        "height": mathFloor ,
    }
    var pathAttr2ZValue = merge(attr2ZValue , {
        "fill": {
            'none': "rgba(0,0,0,0)"
        } ,
        "dashstyle": {
            'dash': 'dashed'
        }
    })
    
    var rectAttr2ZValue = merge(pathAttr2ZValue , {
        
    })
    
    var circleAttr2ZValue = merge(pathAttr2ZValue , {
        "cx": mathFloor ,
        "cy": mathFloor ,
    })
    
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
    
    function ShapeDom() { Dom.call(this) }
    ShapeDom.prototype = {
        nodeName: 'shape' ,
        ShapClass: null ,
        defaultOptions: null ,
        attrConverter: attr2ZStyle ,
        valueConverter: attr2ZValue ,
        init: function (opts) {
            Dom.prototype.init.apply(this , arguments);
            this.shape = new this.ShapClass({
                style: this.style
            });
            // TODO 处理高亮样式
            this.shape.hoverable = false;
        } ,
        getDefaultStyle: function () {
            return ShapeDom.defaultStyle;
        } ,
        setAttribute: function (key, value) {
            Dom.prototype.setAttribute.apply(this , arguments);
            var zProp = this.attrConverter[key]
            if (zProp) {
                this.shape.style[zProp] = convertZValue.call(this , this.valueConverter , key , value);
            }
        },
        removeAttribute: function (key) {
            Dom.prototype.setAttribute.apply(this , arguments);
            var zProp = this.attrConverter[key]
            if (zProp) {
                delete this.shape.style[zProp];
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
            // rot = (rot - 180) * Math.PI / 180;
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
    
    function TextDom() { ShapeDom.call(this) }
    TextDom.prototype = {
        nodeName: 'text' ,
        ShapClass: Text ,
        getDefaultStyle: function () {
            return TextDom.defaultStyle
        } 
    }
    ZUtil.inherits(TextDom , ShapeDom);
    TextDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        brushType: 'fill'
    })
    
    function SpanDom() { TextDom.call(this) }
    SpanDom.prototype = {
        nodeName: 'span' ,
        ShapClass: Text ,
    }
    ZUtil.inherits(SpanDom , TextDom);
    
    function TSpanDom() { TextDom.call(this) }
    TSpanDom.prototype = {
        nodeName: 'tspan' ,
        ShapClass: Text ,
    }
    ZUtil.inherits(TSpanDom , TextDom);
    
    function PathDom() { ShapeDom.call(this) }
    PathDom.prototype = {
        nodeName: 'path' ,
        ShapClass: Path ,
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
    
    function ClipPathDom() { PathDom.call(this) }
    ClipPathDom.prototype = {
        nodeName: 'clipPath' ,
        ShapClass: Text ,
    }
    ZUtil.inherits(ClipPathDom , PathDom);
    
    function RectDom() { ShapeDom.call(this) }
    RectDom.prototype = {
        nodeName: 'rect' ,
        ShapClass: HRectangle ,
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
    
    function CircleDom() { ShapeDom.call(this) }
    CircleDom.prototype = {
        nodeName: 'circle' ,
        ShapClass: Circle ,
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
        SpanDom: SpanDom ,
        DefsDom: DefsDom ,
        PathDom: PathDom ,
        RectDom: RectDom ,
        ClipPathDom: ClipPathDom ,
        TSpanDom: TSpanDom,
        CircleDom: CircleDom,
    }
});