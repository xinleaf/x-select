var Xselect = (function () {
    var utils = {
        rnothtmlwhite: ( /[^\x20\t\r\n\f]+/g ),
        stripAndCollapse: function(value) {
            var tokens = value.match( utils.rnothtmlwhite ) || [];
            return tokens.join( " " );
        },
        getClass: function(value) {
            return ""
        }
    }
    // 事件相关兼容性处理
    var EventUtil = {
        addHandler: function(element, type, handler) {
            if (!element) return;
            if (element.addEventListener) {
                element.addEventListener(type, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + type, handler);
            } else {
                element["on" + type] = handler;
            }
        },
        removeHandler: function(element, type, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, false);
            } else if (element.detachEvent) {
                element.detachEvent("on" + type, handler);
            } else {
                element["on" + type] = null;
            }
        }
    }
    /**
     * @param element: select容器
     * @param Object options: 配置项
     */ 
    var Xselect = function (element, options) {
        this.element = element; // select-dom容器
        this.options = options; // 用户配置（原始配置）
        this.setting = this.mergeOptions(this.default, this.options || {}); // 相关配置（组件处理后）
        this.selectors = {}; // 缓存当前容器相关的element 
        // this._selector = {};
        // this._events = {}; // 当前绑定的事件
        this.init();
    };
    Xselect.prototype = {
        x_selector_clicked: false, // 当前是否存在select被打开状态
        x_selector_options: null, // 记录当前打开select的唯一标识（id）
        _x_all_event: [], // 全局事件存储，防止多次绑定
        _cache: {}, // 公共缓存
        // 默认配置
        default: {
            options: [], // options数据
            value: '', // 当前选择的value值
            initialValue: {
                text: '',
                value: '',
            }, // 初始化值
            placeholder: '', // 提示
            name: '', // 表单字段名称
            allowInput: false, // 是否允许手动输入
            allowClear: false, // 是否允许清空
            textPop: false, // 是否展示文本提示（当值展示不全时，可以展示气泡提示）
            textPopOptions: {
                placement: 'bottom', // 位置。配置化待定
            }, // 值-气泡框相关配置。当textPop为true时生效
            fieldNames: {
                text: 'text',
                value: 'value',
            }, // 字段映射关系
            textAlign: 'center', // 值文本位置(left,right,center)
        },
        // 选择器默认类
        _selector: {
            showBox: function () {
                var name = 'x-select-show'; // 显示部分
                if (this.selectors && this.selectors.showBox) {
                    return this.selectors.showBox;
                } else {
                    if (!this.selectors) this.selectors = {}
                    return this.selectors.showBox = this.children(this.element, name);
                }
                
            },
            ulBox: function () {
                var name = 'x-select-options-ul';
                if (this.selectors.ulBox) {
                    return this.selectors.ulBox;
                } else {
                    return this.selectors.ulBox = this.children(this.element, name);
                }
            },
            // 文本（值）显示区域
            descBox: function () {
                var name = 'x-desc';
                if (this.selectors.descBox) {
                    return this.selectors.descBox;
                } else {
                    return this.selectors.descBox = this.children(this.getSelectorBox('showBox'), name);
                }
            },
            // 操作区域（箭头）-方便增删类名
            actionBox: function () {
                var name = 'x-action';
                if (this.selectors.actionBox) {
                    return this.selectors.actionBox;
                } else {
                    return this.selectors.actionBox = this.children(this.getSelectorBox('showBox'), name);
                }
            },
        },
        // 获取标准容器—代理函数
        getSelectorBox: function (type) {
            return this._selector[type].call(this);
        },
        // 初始化事件
        init: function() {
            if (!this.element) return;
            this.createTemplateContainer(); // 初始化容器
            this.initEvent(); // 初始化相关事件
            if (this.setting.value) {
                this.setValue(this.setting.value);
            }
        },
        // 初始化容器
        createTemplateContainer: function() {
            // 1.绑定容器类
            var setting = this.setting;
            this.addClass('x-select-wrap');
            // 2.创建显示部分
            var box = this._renderTemplate('x-select-show');
            var descBox = this._renderTemplate('x-desc', {value: setting.value, placeholder: setting.placeholder, options: setting.options, textAlign: setting.textAlign});
            var actionBox = this._renderTemplate('x-action')
            box.append(descBox);
            box.append(actionBox);
            if (setting.disabled === true) {
                this.addClass('is-disabled');
            }
            // 3.options部分
            var ulBox = this._renderTemplate('x-select-options-ul', {name: setting.name});
            if (setting.options.length > 0) {
                var lisBox = this._renderTemplate('x-select-options-li', {options: setting.options, fieldNames: setting.fieldNames, placeholder: setting.placeholder});
                ulBox.append(lisBox);
            }
            // end
            this.element.append(box);
            this.element.append(ulBox);
        },
        // 初始化事件
        initEvent: function() {
            // 鼠标点击
            var setting = this.setting;
            var showBox = this.getSelectorBox('showBox');
            var ulBox = this.getSelectorBox('ulBox');
            this.on(showBox, 'click', this._bindFn('onClickShowBox'));
            this.on(ulBox, 'click', this._bindFn('onClickOptionLi'), 'li');
            this.on(ulBox, 'mouseover', this._bindFn('onMouseoverUlBox'));
            if (setting.textPop === true || setting.allowClear === true) {
                this.on(showBox, 'mouseenter', this._bindFn('onMouseoverShowBox'));
                this.on(showBox, 'mouseleave', this._bindFn('onMouseoutShowBox'));
            }
            if (this._x_all_event.indexOf('onClickDom') === -1) {
                this.on(document, 'click', this._bindFn('onClickDom'));
                this._x_all_event.push('onClickDom');
            }
            if (setting.allowClear === true) {
                var actionBox = this.getSelectorBox('actionBox');
                this.on(actionBox, 'click', this._bindFn('onClickClose'));
                this.on(actionBox, 'mouseenter', this._bindFn('onMouseOverClose'));
                this.on(actionBox, 'mouseleave', this._bindFn('onMouseoutClose'));
            }
        },
        // 事件函数(this指向实例;入参tagThis为当前事件对象实际this值)
        _events: {
            // 显示框点击事件
            onClickShowBox: function(tagThis) {
                console.log('onClickShowBox')
                // 处理气泡框
                this._removePop();
                // 特殊情况1-连续点击两个select
                var x_selector_options = this._getPrototypeValue('x_selector_options');
                if (x_selector_options && this.children(tagThis.parentNode, 'x-select-options-ul').getAttribute('id') !== x_selector_options) {
                    this._triggerOptions('close', this.$$('#'+ x_selector_options))
                    this._setPrototypeValue('x_selector_options', null)
                }
                // 特殊情况1-end
                var ulBox = this.getSelectorBox('ulBox');
                if (this.css(ulBox, 'display') === 'block') {
                    this._triggerOptions('close', ulBox);
                } else {
                    this._triggerOptions('open', ulBox);
                    this._setPrototypeValue('x_selector_clicked', true);
                    this._setPrototypeValue('x_selector_options', 'x-'+ this.setting.name +'-options');
                    // 自动聚焦（当下拉框已选择值，需要自动滚动到该位置）
                    var curVal = this.getValue() || '';
                    if (curVal !== "") {
                        // 当前已选择值，需要自动定位
                        var tagLi = this.children(ulBox, 'li_'+ curVal)
                        if (tagLi) {
                            this.addClass('x-auto-color', tagLi); // 设置要定位地方的css 
                            ulBox.scrollTop = tagLi.offsetTop; // 定位option
                        }
                    } else {
                        ulBox.scrollTop = 0;
                    }
                }
            },
            // 显示框移入事件（主要应用于气泡文本提示框）
            onMouseoverShowBox: function() {
                var setting = this.setting;
                //  清除按钮逻辑处理 
                 if ((setting.allowClear === true) && (this.getValue() !== '')) {
                    var actionBox = this.getSelectorBox('actionBox');
                    var icon_close = this._getPublicCache('icon_close');
                    if (!icon_close) {
                        icon_close = this._renderTemplate('x-close');
                        this._setPublicCache('icon_close', icon_close);
                    }
                    actionBox.appendChild(icon_close);
                 }
                // 气泡框相关处理逻辑-start
                if (setting.textPop === true) {
                    var contentBox = this.getSelectorBox('descBox');
                    var contentWidth = contentBox.clientWidth; // $().width()实际width宽度，不包含padding值。contentBox[0].clientWidth-包含padding值;contentBox[0].scrollWidth-包含滚动条值
                    var realWidth = contentBox.scrollWidth; // 文本实际宽度
                    var ulDisplay = this.css(this.getSelectorBox('ulBox'), 'display');
                    if (contentWidth < realWidth && ulDisplay !== 'block') {
                        var positionTop = contentBox.offsetHeight + 6; // 6为三角形
                        // 省略号显示。鼠标移入气泡框显示全部
                        // 位置、样式、是否开放自定义插槽
                        this.element.appendChild(this._renderTemplate('x-select-pop-box', {positionTop: positionTop, value: contentBox.innerHTML}))
                    }
                }
                // 气泡框相关处理逻辑-end
            },
            // 显示框移出事件（移除气泡文本框）
            onMouseoutShowBox: function () {
                this._removePop();
                this._removeCloseIcon();
            },
            // option-li选中事件
            onClickOptionLi: function(tag) {
                // 1.绑定value-text值
                var descBox = this.getSelectorBox('descBox');
                var tagvalue = tag.getAttribute('value');
                // descBox.innerHTML = tag.innerHTML;
                // if (tagvalue) {
                //     this.removeClass('x-desc-placeholder', descBox);
                // } else {
                //     // 断言-option没有值的是提示语
                //     this.addClass('x-desc-placeholder', descBox);
                // }
                // descBox.setAttribute('value', tagvalue);
                this.setValue(tagvalue, tag.innerHTML);
                // 2.隐藏options
                console.log('onClickOptionLi-close')
                this._triggerOptions('close', this.getSelectorBox('ulBox'));
            },
            // options鼠标移入事件（清除已选择option的标识）
            onMouseoverUlBox: function() {
                var tagLi =  this.children(this.getSelectorBox('ulBox'), 'x-auto-color');
                if (tagLi) {
                    this.removeClass('x-auto-color', tagLi);
                }
            },
            // dom点击事件（用于隐藏已展开的options）
            onClickDom: function () {
                var x_selector_clicked = this._getPrototypeValue('x_selector_clicked');
                var x_selector_options = this._getPrototypeValue('x_selector_options');
                if (!x_selector_clicked && x_selector_options) {
                    // 当前存在options打开状态
                    console.log("onClickDom-close")
                    this._triggerOptions('close', this.$$('#'+ x_selector_options));
                    this._setPrototypeValue('x_selector_options', null);
                }
                // 由于select处理事件执行顺序在Body之前，此处判断为select点击后需重置掉
                if (x_selector_clicked === true) {
                    this._setPrototypeValue('x_selector_clicked', false);
                }
            },
            // icon_close点击事件
            onClickClose: function(tagThis, e) {
                var descBox = this.getSelectorBox('descBox');
                if (this.getValue() !== '') {
                  this._stopPropagation(e);
                  this._triggerOptions('close', this.getSelectorBox('ulBox'));
                  this._removeCloseIcon();
                }
                this.setValue('');
            },
            // 改变填充色
            onMouseOverClose: function(tagThis) {
                var tagBox = this.children(tagThis, 'x-select-close');
                this.addClass('action-focus', tagBox);
            },
            // 鼠标移出
            onMouseoutClose: function(tagThis) {
                var tagBox = this.children(tagThis, 'x-select-close');
                tagBox && this.removeClass('action-focus', tagBox);
            },
        },
        // 内置事件-代理函数
        _bindFn: function (type) {
            var self = this;
            return function(e) {
                if (self.setting.disabled === true) {
                    return false;
                }
                self._events[type].call(self, this, e);
            }
        },
        // 移除气泡文本提示框
        _removePop: function() {
            var popBox = this.children(this.element, 'x-select-pop-box');
            popBox && popBox.remove();
        },
        // 移除清除按钮
        _removeCloseIcon: function() {
            if (this.setting.allowClear === true) {
                var actionBox = this.getSelectorBox('actionBox');
                var icon_close = this.children(actionBox, 'x-select-close');
                icon_close && icon_close.remove();
            }
        },
        // 打开options框
        _triggerOptions: function(tag, ulBox) {
            var selectBox = ulBox.parentNode;
            var allowClear = this.setting.allowClear;
            if (tag === 'open') {
                // 去打开
                this.css(ulBox, 'display', 'block');
                // 箭头
                this.addClass('x-options_opened', selectBox);
                // (!allowClear && this.getValue() === '') && this.addClass('x-options_opened', selectBox);
            } else {
                // 去关闭
                this.css(ulBox, 'display', 'none');
                this.removeClass('x-options_opened', selectBox);
                // (!allowClear && this.getValue() === '') && this.removeClass('x-options_opened', selectBox);
            }
        },
        // 阻止事件冒泡
        _stopPropagation: function(e) {
            if(e.stopPropagation) { //W3C阻止冒泡方法  
                e.stopPropagation();  
            } else {  
                e.cancelBubble = true; //IE阻止冒泡方法  
            }  
        },
        // 更新protoptye值
        _setPrototypeValue: function (key, val) {
            this.__proto__[key] = val;
            return this;
        }, 
        _getPrototypeValue: function (key) {
            return this.__proto__[key];
        },
        // 更新公共缓存
        _getPublicCache(key) {
            return this.__proto__._cache[key];
        },
        _setPublicCache(key, val) {
            var old = this.__proto__._cache[key];
            (old !== val) && (old = val);
            return this;
        },
        // 通过value匹配描述
        _matchDescByVal(val) {
            var setting = this.setting;
            var list = setting.options;
            var textField = setting.fieldNames.text;
            var valueField = setting.fieldNames.value;
            var tagDesc;
            for(var i = 0, len = list.length; i < len; i++) {
                if (list[i][valueField] === val) {
                    tagDesc = list[i][textField] || '';
                    break;
                }
            }
            return tagDesc;
        },
        /**
         * 渲染模板
         */
        _renderTemplate: function(type, payload) {
            var elem;
            switch(type) {
                case 'x-select-wrap':
                    // 容器绑定在传入的element上
                    break;
                case "x-select-show": // 页面显示区域
                    elem = document.createElement('div');
                    this.addClass('x-select-show', elem);
                    break;
                case "x-desc": // 页面显示值
                    elem = document.createElement('span');
                    if (payload.textAlign) {
                        elem.style['text-align'] = payload.textAlign;
                    }
                    if (payload.placeholder) {
                        elem.innerHTML = payload.placeholder || '';
                        this.addClass('x-desc-placeholder', elem);
                    }
                    // if (payload.value) {
                    //     this.setValue(payload.value);
                    //     elem.innerHTML = payload.value || '';
                    //     elem.setAttribute('value', payload.value);
                    //     var list = payload.options;
                    //     var textField = this.setting.fieldNames.text;
                    //     var valueField = this.setting.fieldNames.value;
                    //     for(var i = 0, len = list.length; i < len; i++) {
                    //         if (list[i][valueField] === payload.value) {
                    //             elem.innerHTML = list[i][textField] || '';
                    //             break;
                    //         }
                    //     }
                    // } else if (payload.placeholder) {
                    //     elem.innerHTML = payload.placeholder || '';
                    //     this.addClass('x-desc-placeholder', elem)
                    // }
                    this.addClass('x-desc', elem);
                    break;
                case "x-action": // 点击区域（options事件）
                    elem = document.createElement("span");
                    // 默认添加箭头
                    this.addClass('x-action', elem);
                    elem.style['user-select'] = 'none';
                    elem.innerHTML = '<i class="icon icon_arrow"><svg viewBox="64 64 896 896" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" class="">'+
                        '<path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z">'+
                            '</path></svg></i>';
                    break;
                case "x-close": // 关闭按钮
                    elem = document.createElement("i");
                    this.addClass("icon x-select-close", elem);
                    //  '<defs><style type="text/css"/></defs>'+
                    elem.innerHTML = '<svg  class="svg_close" viewBox="0 0 1024 1024" version="1.1" p-id="3147" width="1em" height="1em">'+
                    '<path d="M512.001 15.678C237.414 15.678 14.82 238.273 14.82 512.86S237.414 1010.04 512 1010.04s497.18-222.593 497.18-497.18S786.589 15.678 512.002 15.678z m213.211 645.937c17.798 17.803 17.798 46.657 0 64.456-17.798 17.797-46.658 17.797-64.456 0L512.001 577.315 363.241 726.07c-17.799 17.797-46.652 17.797-64.45 0-17.804-17.799-17.804-46.653 0-64.456L447.545 512.86 298.79 364.104c-17.803-17.798-17.803-46.657 0-64.455 17.799-17.798 46.652-17.798 64.45 0l148.761 148.755 148.755-148.755c17.798-17.798 46.658-17.798 64.456 0 17.798 17.798 17.798 46.657 0 64.455L576.456 512.86l148.756 148.755z m0 0" p-id="3148"/></svg>';
                    break;
                case "x-select-options-ul": // options容器
                    elem = document.createElement("ul");
                    elem.setAttribute('id', 'x-'+ payload.name +'-options'); // 用于"特殊情况-1"
                    this.addClass("x-select-options-ul", elem);
                    break;
                case "x-select-options-li": // option-li
                    elem = createLiFrag(payload);
                    break;
                case "x-select-pop-box": // 气泡文本提示框
                    // <div class="x-select-pop-box" style="top:'+ positionTop +'px;">'+ contentBox.html()  +'</div>
                    elem = document.createElement("div");
                    this.addClass("x-select-pop-box", elem);
                    this.css(elem, 'top', payload.positionTop + 'px');
                    elem.innerHTML = payload.value || '';
                    break;
            }
            // 动态生成options-li(待优化)
            function createLiFrag (payload) {
                var data = payload.options;
                if (data.length > 0) {
                    var flg = document.createDocumentFragment();
                    var liStr = '';
                    var li;
                    var textField = payload.fieldNames.text;
                    var valueField = payload.fieldNames.value;
                    // placeholder设置
                    if (payload.placeholder) {
                        li = document.createElement('li');
                        li.setAttribute('class', 'x-select-options-li x-select-placeholder-li');
                        li.innerHTML = payload.placeholder;
                        flg.append(li);
                    }
                    // 采用innerHTML代替大规模createELement+append的性能消耗
                    for(var i = 0, len = data.length; i < len; i++) {
                        li = document.createElement('li');
                        li.setAttribute('class', "x-select-options-li li_" + data[i][valueField]);
                        li.setAttribute('value', data[i][valueField]);
                        li.innerHTML = data[i][textField];
                        flg.append(li);
                        // liStr += '<li class="x-select-options-li" value="'+ data[i][valueField] +'">'+ data[i][textField] +'</li>';
                    }
                    // flg.innerHTML = liStr;
                    return flg
                }
            }
            return elem;
        },
        /**
         * 合并配置
         * 新增配置替代基础配置的原则
         * @param parent: 基础配置
         * @param child: 新增配置
         */
        mergeOptions: function(parent, child) {
            var options = {};
            var starts = Object.create(null);
            var key;
            for (key in parent) {
                mergeField(key);
            }
            for (key in child) {
                if (!hasOwn(parent, key)) {
                    // 追加子级额外配置
                    mergeField(key);
                }
            }

            function mergeField(key) {
                var start = starts[key] || function (parentval, childVal) {
                    if (Object.prototype.toString.call(childVal)==='[object Object]') {
                        // Object深拷贝（对比），数组全量覆盖
                        return this.Xselect.prototype.mergeOptions(parentval, childVal);
                    } else {
                        return childVal === undefined ? parentval : childVal;
                    }
                    
                };
                options[key] = start(parent[key], child[key])
            }

            function hasOwn (obj, key) {
                return Object.prototype.hasOwnProperty.call(obj, key);
            }
            
            // initialValue 追加到value
            if (options.initialValue) {
                options.value = options.initialValue.value;
            }
            return options;
        },
        // 获取值
        getValue: function() {
            return this.setting.value;
        },
        setValue: function(val, text) {
            var desc;
            var descBox = this.getSelectorBox('descBox');
            if (text) {
                desc = text;
            } else if (val) {
                // options匹配
                desc = this._matchDescByVal(val);
            } else {
                desc = "";
            }
            if (val) {
                this.removeClass('x-desc-placeholder', descBox);
            } else {
                // 断言-option没有值的是提示语
                this.addClass('x-desc-placeholder', descBox);
            }
            descBox.innerHTML = desc;
            descBox.setAttribute('value', val);
            this.setting.value = val;

            return this;
        },
        // 添加类名
        addClass: function (value, element) {
            // 默认追加在this.element上
            var classes = this.classesToArray(value);
            if (classes.length) {
                // 存在多个类名
                var cur,elem,j,curclass;
                if (element) {
                    elem = element;
                } else {
                    elem = this.element;
                }
                var curValue = getClass(elem);
                cur = elem.nodeType === 1 && ( " " + utils.stripAndCollapse( curValue ) + " " );
                // 计算最新class值
                if(cur) {
                    j = 0;
                    while((curclass = classes[ j++ ]) ) {
                        if ( cur.indexOf(" " + curclass + " ") < 0 ) {
                            cur += curclass + " ";
                        } 
                    }
                    finalValue = utils.stripAndCollapse( cur );
                    if (curValue !== finalValue) {
                        elem.setAttribute( "class", finalValue );
                    }
                }

            }
            return this;
        },
        // 删除类名
        removeClass: function (value, elem) {
            var classes = this.classAddTrim(getClass(elem));
            // classes = this.classesToArray(classes);
            var tagList = this.classesToArray(value);
            if (tagList.length) {
                // for-while对比
                var i = 0; // 待删除指针
                var calzz = null; // 当前待删除类名
                while(calzz = tagList[i++]) {
                    if (classes.indexOf(calzz) > -1){
                        classes = classes.replace(" " + calzz + " ", " ");
                    }
                }
            }
            // if (classes !==){}
            elem.setAttribute('class', classes);
        },
        // 类名规格化（前后保证空格）
        classAddTrim: function (val) {
            function trim (str) {
                return str.replace(/^(\s|\u00A0)+/,'').replace(/(\s|\u00A0)+$/,'');
            }
            return " " + trim(val) +" ";
        },
        classesToArray: function(value) {
            if (Array.isArray(value)) {
                return value;
            }
            if (typeof value === "string") {
                var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );
                return value.match( rnothtmlwhite ) || [];
            }
            return [];
        },
        // children(暂时不支持孙级查找，仅支持子代类查找方式)
        children: function (elem, tag) {
            if (tag) {
                var childrens = elem.children;
                for (var i = 0, len = childrens.length; i < len; i++) {
                    if (childrens[i].getAttribute('class').split(' ').indexOf(tag) > -1) {
                        return childrens[i];
                    } 
                }
            } else {
                return elem.children;
            }
            // return this.siblings( elem.firstChild );
        },
        siblings: function( elem ) {
            // return this.siblings( ( elem.parentNode || {} ).firstChild, elem );
        },
        css: function (elem, name, extra, style) {
            rcustomProp = /^--/;
            var isCustomProp = rcustomProp.test(name);
            // if (!isCustomProp) {
            //  name = 
            // }
            if (!extra) {
                // get
                return elem.style[name];
            } else {
                // set
                if (typeof extra === 'string') {
                    if (Object.prototype.toString.call(elem) === "[object NodeList]") {
                        for(var i = 0, len = elem.length; i < len; i++) {
                            elem[i].style[name] = extra;
                        }
                    } else {
                        elem.style[name] = extra;
                    }
                }
                // for (key in extra) {
                //  elem.style.key = extra[key];
                // }
            }

        },
        // 获取元素
        $$: function(selector) {
            var ret = document.querySelectorAll(selector);
            if (ret.length > 1) {
                return ret;
            } else {
                return ret[0];
            }
        },
        // 绑定事件
        on: function(element, event, callback, tag) {
            if (tag) {
                // 当tag存在时以事件委托的形式
                var self = this;
                EventUtil.addHandler(element, event, function(e) {
                    if (e.target.nodeName.toLowerCase() === tag) {
                        callback.call(e.target);
                    }
                })
            } else {
                EventUtil.addHandler(element, event, callback);
            }
            // if (this.events[])
            // 是否需要记录事件栈-暂定
        },
        off: function(element, event, callback) {
            EventUtil.removeHandler(element, event, callback);
        },

    }
    function getClass( elem ) {
        if (elem === undefined) {
            return "";
        }
        return elem.getAttribute && elem.getAttribute( "class" ) || "";
    }
    function stripAndCollapse( value ) {
        var tokens = value.match( rnothtmlwhite ) || [];
        return tokens.join( " " );
    }
    return Xselect;
})();