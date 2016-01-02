requirejs.config({
    baseUrl: '../' ,
    paths: {
        "highcharts": "lib/highcharts/lib/highcharts.src" ,
        "highcharts-more": "lib/highcharts/lib/highcharts-more.src" ,
        "highcharts-3d": "lib/highcharts/lib/highcharts-3d.src" ,
        "highcharts-funnel": "lib/highcharts/lib/modules/funnel.src" ,
        "highcharts-heatmap": "lib/highcharts/lib/modules/heatmap.src" ,
        "highcharts-treemap": "lib/highcharts/lib/modules/treemap.src" ,
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
        "highcharts-3d": {
            deps: ["highcharts"]
        },
        "highcharts-heatmap": {
            deps: ["highcharts"]
        },
        "highcharts-treemap": {
            deps: ["highcharts"]
        },
        "highcharts-funnel": {
            deps: ["highcharts"]
        },
        "highchartcanvas": {
            deps: ['highcharts' , 'highcharts-more' , 'zrender']
        }
    } ,
    waitSeconds: 0
})