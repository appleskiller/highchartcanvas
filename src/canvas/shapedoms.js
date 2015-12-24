define(function(require, exports, module) {
    "use strict";
    var Highcharts = require("highcharts");
    var extendClass = Highcharts.extendClass;
    var merge = Highcharts.merge;
    var mathFloor = Math.floor;
    
    function defined(obj) { return obj !== undefined && obj !== null; }
    
    var SVG_NS = 'http://www.w3.org/2000/svg';
    
    var Text = require("zrender/shape/Text");
    var Path = require("zrender/shape/Path");
    var Group = require('zrender/Group');
    
    function Dom() {};
    Dom.prototype = {
        namespaceURI: SVG_NS, // 伪装成SVG
        nodeName: 'div',
        attributes: null,
        childNodes: null,
        zr: null ,
        init: function (zr) {
            this.attributes = {};
            this.childNodes = [];
            this.zr = zr;
            this.style = merge(this.getDefaultStyle());
        } ,
        getDefaultStyle: function () {
            return {};
        } ,
        getAttribute: function (key) {
            return this.attributes[key];
        },
        setAttribute: function (key, value) {
            this.attributes[key] = value;
            console.log(this.nodeName + " : set " + key + ' = ' + value);
        },
        removeAttribute: function (key) {
            delete this.attributes[key];
            console.log(this.nodeName + " : del " + key);
        },
        appendChild: function (element) {
            this.childNodes.push(element);
            element.parentNode = this;
        },
        insertBefore: function (newItem, existingItem) {
            this.childNodes.splice(this.childNodes.indexOf(existingItem), 0, newItem);
        },
        removeChild: function (element) {
            this.childNodes.splice(this.childNodes.indexOf(element), 1);
            delete element.parentNode;
        },
        getElementsByTagName: function (tagName) {
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
            // 子类实现
        },
        rotation: function (rot) {
            // 子类实现
        },
        scale: function (x , y) {
            // 子类实现
        }
    };
    
    var CanvasDom = extendClass(Dom , {
        nodeName: 'canvas' ,
    });
    
    var GDom = extendClass(Dom , {
        nodeName: 'g' ,
        init: function (zr) {
            Dom.prototype.init.apply(this , arguments);
            this.shape = new Group();
            this.zr.addGroup(this.shape);
        } ,
        appendChild: function (element) {
            Dom.prototype.appendChild.apply(this , arguments);
            if (element.shape) {
                this.shape.addChild(element.shape);
            }
        },
        insertBefore: function (newItem, existingItem) {
            Dom.prototype.insertBefore.apply(this , arguments);
            if (newItem && newItem.shape && existingItem && existingItem.shape) {
                this.shape.clearChildren();
                for (var i = 0; i < this.childNodes.length; i++) {
                    if (this.childNodes[i].shape){
                        this.shape.addChild(this.childNodes[i].shape);
                    }
                }
            }
        },
        removeChild: function (element) {
            Dom.prototype.removeChild.apply(this , arguments);
            this.shape.removeChild(element);
        },
    })
    
    var DefsDom = extendClass(Dom , {
        nodeName: 'defs' ,
    })
    
    var attr2ZStyle = {
        "x": 'x' ,
        "y": 'y' ,
        "width": 'width' ,
        "height": 'height' ,
        "text": 'text' ,
        "text-anchor": "textAlign" ,
    }
    
    var pathAttr2ZStyle = merge(attr2ZStyle , {
        "d": "path" ,
        "fill": "color" ,
        "stroke": "strokeColor" ,
        "stroke-width": "lineWidth" ,
        "fill-opacity": "opacity" ,
        "stroke-linecap": "lineCape"
    })
    
    var attr2ZValue = {
        "text-anchor": {
            'middle': 'center'
        }
    }
    var pathAttr2ZValue = merge(attr2ZValue , {
        "fill": {
            'none': ""
        }
    })
    function convertZValue(converter , key , value) {
        if (converter && converter[key] && defined(converter[key][value])) {
            return converter[key][value];
        }
        return value;
    }
    
    var ShapeDom = extendClass(Dom , {
        nodeName: 'shape' ,
        ShapClass: null ,
        defaultOptions: null ,
        attrConverter: attr2ZStyle ,
        valueConverter: attr2ZValue ,
        init: function (zr) {
            Dom.prototype.init.apply(this , arguments);
            this.shape = new this.ShapClass({
                style: this.style
            });
            this.zr.addShape(this.shape);
        } ,
        getDefaultStyle: function () {
            return ShapeDom.defaultStyle;
        } ,
        setAttribute: function (key, value) {
            Dom.prototype.setAttribute.apply(this , arguments);
            var zProp = this.attrConverter[key]
            if (zProp) {
                this.shape.style[zProp] = convertZValue(this.valueConverter , key , value);
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
            var rect = this.shape.getRect(this.shape.style);
            rect.x = mathFloor(rect.x);
            rect.y = mathFloor(rect.y);
            rect.width = mathFloor(rect.width);
            rect.height = mathFloor(rect.height);
            return rect;
        },
        translate: function (x , y) {
            this.shape.position = [x , y];
        },
        rotation: function (rot) {
            this.shape.rotation[0] = rot;
        },
        scale: function (x , y) {
            this.shape.scale[0] = x;
            this.shape.scale[1] = y;
        },
        
    })
    ShapeDom.defaultStyle = {};
    
    var TextDom = extendClass(ShapeDom , {
        nodeName: 'text' ,
        ShapClass: Text ,
        getDefaultStyle: function () {
            return TextDom.defaultStyle
        } 
    });
    TextDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        x: 0 ,
        y: 0 ,
    })
    
    var SpanDom = extendClass(TextDom , {
        nodeName: 'span' ,
        ShapClass: Text ,
    });
    
    var PathDom = extendClass(ShapeDom , {
        nodeName: 'path' ,
        ShapClass: Path ,
        attrConverter: pathAttr2ZStyle ,
        valueConverter: pathAttr2ZValue ,
        getDefaultStyle: function () {
            return PathDom.defaultStyle
        }
    });
    
    PathDom.defaultStyle = merge(ShapeDom.defaultStyle , {
        brushType : 'stroke',
    });
    
    var ClipPathDom = extendClass(PathDom , {
        nodeName: 'clipPath' ,
        ShapClass: Text ,
    })
    
    var RectDom = extendClass(ShapeDom , {
        nodeName: 'rect' ,
        ShapClass: Text ,
    })

    
    module.exports = {
        Dom: Dom ,
        GDom: GDom ,
        CanvasDom: CanvasDom ,
        TextDom: TextDom ,
        SpanDom: SpanDom ,
        DefsDom: DefsDom ,
        PathDom: PathDom ,
        RectDom: RectDom ,
        ClipPathDom: ClipPathDom ,
    }
});