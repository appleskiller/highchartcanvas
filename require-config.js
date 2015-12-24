requirejs.config({
    baseUrl: '../' ,
    paths: {
        "highcharts": "lib/highcharts/lib/highcharts.src" ,
        "zrender": "lib/zrender/build/zrender-original" ,
        "zrender/tool/util": "lib/zrender/build/zrender-original" ,
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
        "highchartcanvas": {
            deps: ['highcharts' , 'zrender']
        }
    } ,
    waitSeconds: 0
})