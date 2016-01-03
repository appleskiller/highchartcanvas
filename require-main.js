requirejs([
    "highcharts" ,
    "highcharts-more" ,
    "highcharts-funnel" ,
    "highcharts-heatmap" ,
    "highcharts-treemap" ,
    // "highcharts-3d" ,
    "zrender" ,
    "highchartcanvas"
] , function (Highcharts) {
    $(document).ready(function () {
        
        function setOptions(opts) {
            var options = null;
            options = (new Function(opts))();
            $('#svg').highcharts(options);
            options = (new Function(opts))();
            options.chart = options.chart || {};
            options.chart.renderer = "CanvasRenderer"
            $('#canvas').highcharts(options);
        }
        
        var settingText = "return {\r\n" + 
        "    xAxis: {\r\n" + 
        "        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']\r\n" + 
        "    },\r\n" + 
        "    yAxis: {\r\n" + 
        "        title: {\r\n" + 
        "            text: 'Temperature (°C)'\r\n" + 
        "        },\r\n" + 
        "        plotLines: [{\r\n" + 
        "            value: 0,\r\n" + 
        "            width: 2,\r\n" + 
        "            color: '#808080'\r\n" + 
        "        }]\r\n" + 
        "    },\r\n" + 
        "    series: [{\r\n" + 
        "        name: 'Tokyo',\r\n" + 
        "        data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]\r\n" + 
        "    }]\r\n" + 
        "}"
        
        setOptions(settingText);
        
        var editor = ace.edit("editor");
        editor.setOptions({
            fontSize: 18,
            mode: "ace/mode/javascript" ,
            theme: "ace/theme/tomorrow_night_eighties",
        })
        editor.setValue(settingText);
        
        $('#btn').click(function () {
            try {
                setOptions(editor.getValue());
            } catch (e) {
                console.error(e);
            }
        })
    })
})