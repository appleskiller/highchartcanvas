requirejs.config({
    baseUrl: '../' ,
    paths: {
        "highcharts": "lib/highcharts/lib/highcharts.src" ,
        "highcharts-more": "lib/highcharts/lib/highcharts-more.src" ,
        "zrender": "lib/zrender/build/zrender-original" ,
        "zrender/tool/util": "lib/zrender/build/zrender-original" ,
        "zrender/tool/color": "lib/zrender/build/zrender-original" ,
        "zrender/shape/Text": "lib/zrender/build/zrender-original" ,
        "zrender/shape/Path": "lib/zrender/build/zrender-original" ,
        "zrender/Group": "lib/zrender/build/zrender-original" ,
        
        "shapedoms": "highchartcanvas/src/canvas/shapedoms" ,
        "highchartcanvas": "highchartcanvas/src/canvas/canvas"
    } ,
    shim: {
        "highcharts": {
            exports: "Highcharts"
        },
        "highcharts-more": {
            deps: ["highcharts"]
        },
        "highchartcanvas": {
            deps: ['highcharts' , 'highcharts-more' , 'zrender']
        }
    } ,
    waitSeconds: 0
})