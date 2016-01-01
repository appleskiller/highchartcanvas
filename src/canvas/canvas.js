define(function(require, exports, module) {
    "use strict";
    var Highcharts = require("highcharts");
    var zrender = require("zrender");
    var shapedoms = require("shapedoms");
    
    var doc = document,
	    win = window ,
	    math = Math,
    	mathRound = math.round,
    	mathFloor = math.floor,
    	mathCeil = math.ceil;
    	
	var userAgent = navigator.userAgent,
    	isOpera = win.opera,
    	isMS = /(msie|trident|edge)/i.test(userAgent) && !isOpera,
    	docMode8 = doc.documentMode === 8,
    	isWebKit = !isMS && /AppleWebKit/.test(userAgent),
    	isFirefox = /Firefox/.test(userAgent),
    	isTouchDevice = /(Mobile|Android|Windows Phone)/.test(userAgent);
    	
    var UNDEFINED ,
        PX = 'px' ,
        PREFIX = 'highcharts-' ,
        DEFAULTFONTFAIMILY = '"Lucida Grande" "Lucida Sans Unicode" Arial Helvetica "Microsoft Yahei"';
    
    var extendClass = Highcharts.extendClass ,
		merge = Highcharts.merge ,
		extend = Highcharts.extend ,
		wrap = Highcharts.wrap ,
		each = Highcharts.each ,
		pick = Highcharts.pick ,
	    addEvent = Highcharts.addEvent;
	
	var SVGElement = Highcharts.SVGElement ,
	    SVGRenderer = Highcharts.SVGRenderer;
	    
	function defined(obj) { return obj !== UNDEFINED && obj !== null; }
    function isString(s) { return typeof s === 'string'; }
    function isObject(obj) { return obj && typeof obj === 'object'; }
    function isArray(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; }
    function isNumber(n) { return typeof n === 'number'; }
    function pInt(s, mag) { return parseInt(s, mag || 10); }
    
	function attr(elem, prop, value) {
    	var key,
    		ret;
    
    	// if the prop is a string
    	if (isString(prop)) {
    		// set the value
    		if (defined(value)) {
    			elem.setAttribute(prop, value);
    
    		// get the value
    		} else if (elem && elem.getAttribute) { // elem not defined when printing pie demo...
    			ret = elem.getAttribute(prop);
    		}
    
    	// else if prop is defined, it is a hash of key/value pairs
    	} else if (defined(prop) && isObject(prop)) {
    		for (key in prop) {
    			elem.setAttribute(key, prop[key]);
    		}
    	}
    	return ret;
    }
    
    function css(el, styles) {
    // 	extend(el.style, styles);
        if (!styles){
            return;
        }
        for (var prop in styles) {
            el.setStyle(prop , styles[prop]);
        }
    	if (styles && (styles.fontSize || styles.fontFamily || styles.fontWeight)) {
    	    el.setStyle("textFont" , (el.getStyle("fontWeight") || 'normal') + ' ' + (el.getStyle("fontSize") || '12px') + " " + (el.getStyle("fontFamily") || DEFAULTFONTFAIMILY).replace(',' , " "))
    	}
    }
    
    var classMap = {
        'text': shapedoms.TextDomGroup ,
        'title': shapedoms.TextDom ,
        'span': shapedoms.SpanDom ,
        'tspan': shapedoms.TSpanDom ,
        'g': shapedoms.GDom ,
        'canvas': shapedoms.CanvasDom ,
        'defs': shapedoms.DefsDom ,
        'path': shapedoms.PathDom ,
        'rect': shapedoms.RectDom ,
        'clipPath': shapedoms.ClipPathDom ,
        'circle': shapedoms.CircleDom,
        'linearGradient': shapedoms.LinearGradient,
        'radialGradient': shapedoms.RadialGradient,
        'stop': shapedoms.Stop
    }

	// 创建DOMElement适配对象
	function createElement(nodeName , opts) {
	    if (classMap[nodeName]) {
	        var el = new classMap[nodeName]();
	        el.init(opts);
	        return el;
	    }
	    throw new Error("不支持的元素类型：" + nodeName);
	}
	// 创建文本对象。
	function createTextNode(text) {
	    var element = new shapedoms.TextDom();
	    element.init();
	    element.setAttribute("text" , text);
	    return element;
	}
    /**
     * Canvas元素包装类
     */
	var CanvasElement = extendClass(SVGElement , {
	    init: function (renderer, nodeName , elOpts) {
    		var wrapper = this;
    		wrapper.element = createElement(nodeName , elOpts);
    		wrapper.renderer = renderer;
    	},
    	css: function (styles) {
    		var elemWrapper = this,
    			oldStyles = elemWrapper.styles,
    			newStyles = {},
    			elem = elemWrapper.element,
    			textWidth,
    			n,
    			hasNew = !oldStyles;

    		// Filter out existing styles to increase performance (#2640)
    		if (oldStyles) {
    			for (n in styles) {
    				if (styles[n] !== oldStyles[n]) {
    					newStyles[n] = styles[n];
    					hasNew = true;
    				}
    			}
    		}
    		if (hasNew) {
    			textWidth = elemWrapper.textWidth = 
    				(styles && styles.width && elem.nodeName.toLowerCase() === 'text' && pInt(styles.width)) || 
    				elemWrapper.textWidth; // #3501
    
    			// Merge the new styles with the old ones
    			if (oldStyles) {
    				styles = extend(
    					oldStyles,
    					newStyles
    				);
    			}
    
    			// store object
    			elemWrapper.styles = styles;
    			css(elem , styles);
    			// re-build text
    			if (textWidth && elemWrapper.added) {
    				elemWrapper.renderer.buildText(elemWrapper);
    			}
    		}
    
    		return elemWrapper;
    	},
    	updateTransform: function () {
            var wrapper = this,
                translateX = wrapper.translateX || 0,
                translateY = wrapper.translateY || 0,
                scaleX = wrapper.scaleX,
                scaleY = wrapper.scaleY,
                inverted = wrapper.inverted,
                rotation = wrapper.rotation,
                element = wrapper.element,
                transform;

            if (inverted) {
                translateX += wrapper.attr('width');
                translateY += wrapper.attr('height');
            }
            // apply translate
            element.translate(translateX , translateY);
            // apply rotation
            if (inverted) {
                element.rotate(90);
                element.scale(-1 , 1);
            } else if (rotation) { // text rotation
                element.rotate(rotation , (element.getAttribute('x') || 0) , (element.getAttribute('y') || 0));
            }
            // apply scale
            if (defined(scaleX) || defined(scaleY)) {
                element.scale(pick(scaleX, 1) , pick(scaleY, 1));
            }
        },
        translateXSetter: function () {
            SVGElement.prototype.translateXSetter.apply(this , arguments);
        },
        translateYSetter: function () {
            SVGElement.prototype.translateYSetter.apply(this , arguments);
        },
        clip: function (clipRect) {
            this.attr('clip-path', clipRect ? 'url(' + this.renderer.url + '#' + clipRect.id + ')' : "none");
            if (clipRect && clipRect.element) {
                this.element.clip(clipRect.element);
            }
            return this;
        },
        shadow: function (shadowOptions, group, cutOff) {
            // TODO
            return this;
        },
        
    	// setters
    	fillSetter: function (value, prop, element) {
            if (typeof value === 'string') {
                element.setAttribute(prop, value);
            } else if (value) {
                this.colorGradient(value, prop, element);
                var key = element.gradient;
                var gradient = this.renderer.gradients[key];
                element.setAttribute('gradient-' + prop , gradient.element.toColor(element.style));
                // console.log(element.nodeName , "setAttribute: gradient-" + prop)
            }
        },
    	titleSetter: function (value) {
            var titleNode = this.element.getElementsByTagName('title')[0];
            if (!titleNode) {
                titleNode = createElement('title');
                this.element.appendChild(titleNode);
            }
            titleNode.appendChild(
                createTextNode(
                    (String(pick(value), '')).replace(/<[^>]*>/g, '')
                )
            );
        },
	});
	
	var defaultSVGElementSetter = SVGElement.prototype.translateXSetter;
	
	CanvasElement.prototype.translateXSetter = CanvasElement.prototype.translateYSetter =
    CanvasElement.prototype.rotationSetter = CanvasElement.prototype.verticalAlignSetter =
    CanvasElement.prototype.scaleXSetter = CanvasElement.prototype.scaleYSetter = function (value, key) {
        this.element[key + 'Setter'](value);
        defaultSVGElementSetter.apply(this , arguments);
    };
	
	/**
	 * Canvas渲染器
	 */
	var CanvasRenderer = function () {
    	this.init.apply(this, arguments);
    };
	extend(CanvasRenderer.prototype , SVGRenderer.prototype);
	extend(CanvasRenderer.prototype , {
	    Element: CanvasElement ,
	    /**
	     * 初始化Canvas渲染器
	     */
	    init: function (container, width, height, style, forExport, allowHTML) {
    		var renderer = this,
    			boxWrapper,
    			element
            
    		renderer.zr = zrender.init(container);
    		boxWrapper = renderer.createElement('canvas' , {nativeRenderer: renderer.zr})
    			.attr({
    				version: '1.1'
    			})
    			.css(this.getStyle(style));
    		element = boxWrapper.element;
    
    		renderer.isSVG = true;
    		renderer.box = element;
    		renderer.boxWrapper = boxWrapper;
    		renderer.alignedObjects = [];
    		renderer.url = '';
    
    		// Page url used for internal references. #24, #672, #1070
    // 		renderer.url = (isFirefox || isWebKit) && doc.getElementsByTagName('base').length ?
    // 			loc.href
    // 				.replace(/#.*?$/, '') // remove the hash
    // 				.replace(/([\('\)])/g, '\\$1') // escape parantheses and quotes
    // 				.replace(/ /g, '%20') : // replace spaces (needed for Safari only)
    // 			'';
    
    		// Add description
    // 		desc = this.createElement('desc').add();
    // 		desc.element.appendChild(doc.createTextNode('Created with ' + PRODUCT + ' ' + VERSION));
    
    
    		renderer.defs = this.createElement('defs').add();
    		renderer.allowHTML = allowHTML;
    		renderer.forExport = forExport;
    		renderer.gradients = {}; // Object where gradient SvgElements are stored
    		renderer.cache = {}; // Cache for numerical bounding boxes
            renderer.cacheKeys = [];
            
    		renderer.setSize(width, height, false);
    
    
    
    		// Issue 110 workaround:
    		// In Firefox, if a div is positioned by percentage, its pixel position may land
    		// between pixels. The container itself doesn't display this, but an SVG element
    		// inside this container will be drawn at subpixel precision. In order to draw
    		// sharp lines, this must be compensated for. This doesn't seem to work inside
    		// iframes though (like in jsFiddle).
    		var subPixelFix, rect;
    		if (isFirefox && container.getBoundingClientRect) {
    			renderer.subPixelFix = subPixelFix = function () {
    				css(container, { left: 0, top: 0 });
    				rect = container.getBoundingClientRect();
    				css(container, {
    					left: (mathCeil(rect.left) - rect.left) + PX,
    					top: (mathCeil(rect.top) - rect.top) + PX
    				});
    			};
    
    			// run the fix now
    			subPixelFix();
    
    			// run it on resize
    			addEvent(win, 'resize', subPixelFix);
    		}
    	},
    	createElement: function (nodeName , opts) {
            var wrapper = new this.Element();
            wrapper.init(this, nodeName , opts);
            return wrapper;
        },
    	text: function (str, x, y, useHTML) {

            // declare variables
            var renderer = this,
                wrapper,
                attr = {};

            if (useHTML && (renderer.allowHTML || !renderer.forExport)) {
                return renderer.html(str, x, y);
            }

            attr.x = Math.round(x || 0); // X is always needed for line-wrap logic
            if (y) {
                attr.y = Math.round(y);
            }
            if (str || str === 0) {
                attr.text = str;
            }

            wrapper = renderer.createElement('text')
                .attr(attr);

            if (!useHTML) {
                wrapper.xSetter = function (value, key, element) {
                    var tspans = element.getElementsByTagName('tspan'),
                        tspan,
                        parentVal = element.getAttribute(key),
                        i;
                    for (i = 0; i < tspans.length; i++) {
                        tspan = tspans[i];
                        // If the x values are equal, the tspan represents a linebreak
                        if (tspan.getAttribute(key) === parentVal) {
                            tspan.setAttribute(key, value);
                        }
                    }
                    element.setAttribute(key, value);
                };
            }

            return wrapper;
        },
    	buildText: function (wrapper) {
    		var textNode = wrapper.element,
    			renderer = this,
    			forExport = renderer.forExport,
    			textStr = pick(wrapper.textStr, '').toString(),
    			hasMarkup = textStr.indexOf('<') !== -1,
    			lines,
    			childNodes = textNode.childNodes,
    			styleRegex,
    			hrefRegex,
    			parentX = attr(textNode, 'x'),
    			textStyles = wrapper.styles,
    			width = wrapper.textWidth,
    			textLineHeight = textStyles && textStyles.lineHeight,
    			textShadow = textStyles && textStyles.textShadow,
    			ellipsis = textStyles && textStyles.textOverflow === 'ellipsis',
    			i = childNodes.length,
    			tempParent = width && !wrapper.added && this.box,
    			getLineHeight = function (tspan) {
    				return textLineHeight ? 
    					pInt(textLineHeight) :
    					renderer.fontMetrics(
    						/(px|em)$/.test(tspan && tspan.style.fontSize) ?
    							tspan.style.fontSize :
    							((textStyles && textStyles.fontSize) || renderer.style.fontSize || 12),
    						tspan
    					).h;
    			},
    			unescapeAngleBrackets = function (inputStr) {
    				return inputStr.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    			};
    		/// remove old text
    		while (i--) {
    			textNode.removeChild(childNodes[i]);
    		}
    
    		// Skip tspans, add text directly to text node. The forceTSpan is a hook 
    		// used in text outline hack.
    		if (!hasMarkup && !textShadow && !ellipsis && textStr.indexOf(' ') === -1) {
    		    textNode.appendChild(createTextNode(unescapeAngleBrackets(textStr)));
    			return;
    		// Complex strings, add more logic
    		} else {
    
    			styleRegex = /<.*style="([^"]+)".*>/;
    			hrefRegex = /<.*href="(http[^"]+)".*>/;
    
    			if (tempParent) {
    				tempParent.appendChild(textNode); // attach it to the DOM to read offset width
    			}
    
    			if (hasMarkup) {
    				lines = textStr
    					.replace(/<(b|strong)>/g, '<span style="font-weight:bold">')
    					.replace(/<(i|em)>/g, '<span style="font-style:italic">')
    					.replace(/<a/g, '<span')
    					.replace(/<\/(b|strong|i|em|a)>/g, '</span>')
    					.split(/<br.*?>/g);
    
    			} else {
    				lines = [textStr];
    			}
    
    
    			// remove empty line at end
    			if (lines[lines.length - 1] === '') {
    				lines.pop();
    			}
    
    			
    			// build the lines
    			each(lines, function (line, lineNo) {
    				var spans, spanNo = 0;
    
    				line = line.replace(/<span/g, '|||<span').replace(/<\/span>/g, '</span>|||');
    				spans = line.split('|||');
    
    				each(spans, function (span) {
    					if (span !== '' || spans.length === 1) {
    						var attributes = {},
    				// 			tspan = doc.createElementNS(SVG_NS, 'tspan'),
    				            tspan = renderer.createElement('tspan').element,
    							spanStyle; // #390
    						if (styleRegex.test(span)) {
    							spanStyle = span.match(styleRegex)[1].replace(/(;| |^)color([ :])/, '$1fill$2');
    							attr(tspan, 'style', spanStyle);
    						}
    						if (hrefRegex.test(span) && !forExport) { // Not for export - #1529
    							attr(tspan, 'onclick', 'location.href=\"' + span.match(hrefRegex)[1] + '\"');
    							css(tspan, { cursor: 'pointer' });
    						}
    
    						span = unescapeAngleBrackets(span.replace(/<(.|\n)*?>/g, '') || ' ');
    
    						// Nested tags aren't supported, and cause crash in Safari (#1596)
    						if (span !== ' ') {
    
    							// add the text node
    							//  doc.createTextNode(span)
    							tspan.appendChild(createTextNode(span));
    
    							if (!spanNo) { // first span in a line, align it to the left
    								if (lineNo && parentX !== null) {
    									attributes.x = parentX;
    								}
    							} else {
    								attributes.dx = 0; // #16
    							}
    
    							// add attributes
    							attr(tspan, attributes);
    
    							// Append it
    							textNode.appendChild(tspan);
    
    							// first span on subsequent line, add the line height
    							if (!spanNo && lineNo) {
    
    								// allow getting the right offset height in exporting in IE
    								// if (!hasSVG && forExport) {
    								// 	css(tspan, { display: 'block' });
    								// }
    
    								// Set the line height based on the font size of either
    								// the text element or the tspan element
    								attr(
    									tspan,
    									'dy',
    									getLineHeight(tspan)
    								);
    							}
    
    							/*if (width) {
    								renderer.breakText(wrapper, width);
    							}*/
    
    							// Check width and apply soft breaks or ellipsis
    							if (width) {
    								var words = span.replace(/([^\^])-/g, '$1- ').split(' '), // #1273
    									hasWhiteSpace = spans.length > 1 || lineNo || (words.length > 1 && textStyles.whiteSpace !== 'nowrap'),
    									tooLong,
    									wasTooLong,
    									actualWidth,
    									rest = [],
    									dy = getLineHeight(tspan),
    									softLineNo = 1,
    									rotation = wrapper.rotation,
    									wordStr = span, // for ellipsis
    									cursor = wordStr.length, // binary search cursor
    									bBox;
    
    								while ((hasWhiteSpace || ellipsis) && (words.length || rest.length)) {
    									wrapper.rotation = 0; // discard rotation when computing box
    									bBox = wrapper.getBBox(true);
    									actualWidth = bBox.width;
    
    									// Old IE cannot measure the actualWidth for SVG elements (#2314)
    								// 	if (!hasSVG && renderer.forExport) {
    								// 		actualWidth = renderer.measureSpanWidth(tspan.firstChild.data, wrapper.styles);
    								// 	}
    
    									tooLong = actualWidth > width;
    
    									// For ellipsis, do a binary search for the correct string length
    									if (wasTooLong === undefined) {
    										wasTooLong = tooLong; // First time
    									}
    									if (ellipsis && wasTooLong) {
    										cursor /= 2;
    
    										if (wordStr === '' || (!tooLong && cursor < 0.5)) {
    											words = []; // All ok, break out
    										} else {
    											if (tooLong) {
    												wasTooLong = true;
    											}
    											wordStr = span.substring(0, wordStr.length + (tooLong ? -1 : 1) * mathCeil(cursor));
    											words = [wordStr + (width > 3 ? '\u2026' : '')];
    											tspan.removeChild(tspan.firstChild);
    										}
    
    									// Looping down, this is the first word sequence that is not too long,
    									// so we can move on to build the next line.
    									} else if (!tooLong || words.length === 1) {
    										words = rest;
    										rest = [];
    												
    										if (words.length) {
    											softLineNo++;
    											
    											tspan = renderer.createElement('tspan').element;
    											attr(tspan, {
    												dy: dy,
    												x: parentX
    											});
    											if (spanStyle) { // #390
    												attr(tspan, 'style', spanStyle);
    											}
    											textNode.appendChild(tspan);
    										}
    										if (actualWidth > width) { // a single word is pressing it out
    											width = actualWidth;
    										}
    									} else { // append to existing line tspan
    										tspan.removeChild(tspan.firstChild);
    										rest.unshift(words.pop());
    									}
    									if (words.length) {
    								// 		tspan.appendChild(doc.createTextNode(words.join(' ').replace(/- /g, '-')));
    								        tspan.appendChild(createTextNode(words.join(' ').replace(/- /g, '-')));
    									}
    								}
    								if (wasTooLong) {
    									wrapper.attr('title', wrapper.textStr);
    								}
    								wrapper.rotation = rotation;
    							}
    
    							spanNo++;
    						}
    					}
    				});
    			});
    			if (tempParent) {
    				tempParent.removeChild(textNode); // attach it to the DOM to read offset width
    			}
    
    			// Apply the text shadow
    			if (textShadow && wrapper.applyTextShadow) {
    				wrapper.applyTextShadow(textShadow);
    			}
    		}
    	},
    	symbol: function (symbol, x, y, width, height, options) {
    	    var symb = SVGRenderer.prototype.symbol.apply(this , arguments);
    	    symb.element.style["brushType"] = "fill";
    	    return symb;
    	} ,
    	
    	draw: function () {
    	   // 显示绘制矩形
    	   //var self = this;
    	   //setTimeout(function () {
    	   //    self.findAllElement(self.box , shapedoms.TextDom , function (el) {
        // 	       self.drawRenderRect(el);
        // 	   })
    	   //} , 1000)
    	   //console.log(this.box);
    	   // this.zr.render();
    	},
    	findAllElement: function(element , elClass , cb) {
    	    if (!elClass || element instanceof elClass) {
    	        cb(element);
    	    }
    	    for (var i = 0; i < element.childNodes.length; i++) {
    	        this.findAllElement(element.childNodes[i] , elClass , cb)
    	    }
    	},
    	drawRenderRect: function(element) {
    	    var zr = this.zr;
    	    if (element.getBBox && element.shape) {
    	        var bbox = element.shape.getRect(element.shape.style);
    	        console.log(bbox);
        	    zr.addShape(new shapedoms.HRectangle({
        	        brushType: 'stroke' ,
        	        style: {
        	            x: bbox.x ,
        	            y: bbox.y ,
        	            width: bbox.width ,
        	            height: bbox.height ,
        	            
        	            text: element.nodeName ,
        	            textAlign: "left" ,
        	            textBaseline: "top"
        	        }
        	    }))
    	    }
    	} 
	});
	
	wrap(Highcharts.Chart.prototype , "setTitle" , function (processed , titleOptions, subtitleOptions, redraw) {
	    var chart = this,
            options = chart.options,
            chartTitleOptions,
            chartSubtitleOptions;
            
        if (!chart.renderer.zr){
            processed.call(this , titleOptions, subtitleOptions, redraw);
            return;
        }

        chartTitleOptions = options.title = merge(options.title, titleOptions);
        chartSubtitleOptions = options.subtitle = merge(options.subtitle, subtitleOptions);

        // add title and subtitle
        each([
            ['title', titleOptions, chartTitleOptions],
            ['subtitle', subtitleOptions, chartSubtitleOptions]
        ], function (arr) {
            var name = arr[0],
                title = chart[name],
                titleOptions = arr[1],
                chartTitleOptions = arr[2];

            if (title && titleOptions) {
                chart[name] = title = title.destroy(); // remove old
            }

            if (chartTitleOptions && chartTitleOptions.text && !title) {
                chart[name] = chart.renderer.text(
                    chartTitleOptions.text,
                    0,
                    0,
                    chartTitleOptions.useHTML
                )
                .attr({
                    align: chartTitleOptions.align,
                    'class': PREFIX + name,
                    zIndex: chartTitleOptions.zIndex || 4
                })
                .css(chartTitleOptions.style)
                .add();
            }
        });
        chart.layOutTitles(redraw);
	})
    
    Highcharts.CanvasElement = CanvasElement;
    Highcharts.CanvasRenderer = CanvasRenderer;
});