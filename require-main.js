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
                type: 'bubble',
                zoomType: 'xy'
            },
    
            title: {
                text: 'Highcharts Bubbles'
            },
    
            series: [{
                data: [[97, 36, 79], [94, 74, 60], [68, 76, 58], [64, 87, 56], [68, 27, 73], [74, 99, 42], [7, 93, 87], [51, 69, 40], [38, 23, 33], [57, 86, 31]]
            }, {
                data: [[25, 10, 87], [2, 75, 59], [11, 54, 8], [86, 55, 93], [5, 3, 58], [90, 63, 44], [91, 33, 17], [97, 3, 56], [15, 67, 48], [54, 25, 81]]
            }, {
                data: [[47, 47, 21], [20, 12, 4], [6, 76, 91], [38, 30, 60], [57, 98, 64], [61, 17, 80], [83, 60, 13], [67, 78, 75], [64, 12, 10], [30, 77, 82]]
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