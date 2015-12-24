requirejs([
    "highcharts" ,
    "zrender" ,
    "highchartcanvas"
] , function (Highcharts) {
    $(document).ready(function () {
        
        function chartLoaded() {
            // Draw the flow chart
            var ren = this.renderer,
            colors = Highcharts.getOptions().colors,
            rightArrow = ['M', 0, 0, 'L', 100, 0, 'L', 95, 5, 'M', 100, 0, 'L', 95, -5],
            leftArrow = ['M', 100, 0, 'L', 0, 0, 'L', 5, 5, 'M', 0, 0, 'L', 5, -5];
            
            // Separator, client from service
            ren.rect(100 , 100 , 300 , 300)
                .attr({
                    'stroke-width': 2,
                    stroke: 'silver',
                    dashstyle: 'dash',
                    fill: '#CCC'
                })
                .add();
        }
        
        var options = {
            chart: {
                events: {
                    // load: chartLoaded
                }
            } ,
            title: {
                text: "SVG-Chart"
            } ,
            subtitle: {
                text: 'asdfasdfasdfasdfasdfasdf'
            } ,
            series: [{
                name: 'Tokyo',
                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
            }]
        }
        
        $('#svg').highcharts(options)
        
        options.chart.renderer = "CanvasRenderer"
        $('#canvas').highcharts(options)
    })
})