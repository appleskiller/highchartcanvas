requirejs([
    "highcharts" ,
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
        chart: {
            type: 'column'
        },
        title: {
            text: 'Stacked column chart'
        },
        xAxis: {
            categories: ['Apples', 'Oranges', 'Pears', 'Grapes', 'Bananas']
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total fruit consumption'
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
            shared: true
        },
        plotOptions: {
            column: {
                stacking: 'percent'
            }
        },
        series: [{
            name: 'John',
            data: [5, 3, 4, 7, 2]
        }, {
            name: 'Jane',
            data: [2, 2, 3, 2, 1]
        }, {
            name: 'Joe',
            data: [3, 4, 4, 2, 5]
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