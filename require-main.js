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
            (new Function('o = ' + opts))();
            $('#svg').highcharts(o);
            (new Function('o = ' + opts))();
            o.chart = o.chart || {};
            o.chart.renderer = "CanvasRenderer"
            $('#canvas').highcharts(o);
        }
        
        var options = {
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: {
                title: {
                    text: 'Temperature (°C)'
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: '#808080'
                }]
            },
            series: [{
                name: 'Tokyo',
                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
            }]
        }
        
        setOptions(JSON.stringify(options));
        
        var editor = ace.edit("editor");
        editor.setOptions({
            fontSize: 18,
            mode: "ace/mode/text" ,
        })
        
        $('#btn').click(function () {
            try {
                setOptions(editor.getValue());
            } catch (e) {
                console.error(e);
            }
        })
    })
})