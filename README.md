# x-select

适用场景：不使用UI框架的前提下，优化原生select

##### 调用方式

```js
var xx = new Xselect(document.getElementById(''), options);
```

##### options

|           字段           |                             说明                             | 必填 |           默认值            |
| :----------------------: | :----------------------------------------------------------: | :--: | :-------------------------: |
|         options          |                      [Array]值列表值集                       | true |             []              |
|           name           |                 [String]当前表单控件的name值                 | true |                             |
|       placeholder        |                        [String]提示语                        |      |             “”              |
|       initialValue       |                   [Object]初始值{value:''}                   |      |     {value:"",text:""}      |
|        allowInput        |         [Boolean]是否允许输入；输入值默认等于value值         |      |            false            |
|    allowClear(待实现)    |                      [Boolean]允许清除                       |      |            false            |
|        fieldNames        | [Object]字段映射。text-显示值字段键名；value-选择option值的键名 |      | {text:"text",value:"value"} |
|        textAlign         |        [String]显示描述的对齐方式；left,right,center         |      |          "center"           |
|         textPop          |      [Boolean]当选择值描述过长时是否显示气泡文本提示框       |      |            false            |
| textPopOptions（待实现） |   [Object]气泡文本提示框的相关配置；当textPop为true时生效    |      |    {placement: “bottom”}    |
|                          |                                                              |      |                             |

##### 实例相关方法

|    名称    |          说明           |      |      |
| :--------: | :---------------------: | ---- | ---- |
| getValue() | 获取当前select的value值 |      |      |
|            |                         |      |      |
|            |                         |      |      |
|            |                         |      |      |

