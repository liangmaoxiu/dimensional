define(function (require, exports, module) {
    var cesium = null;
    function init() {
        // 申请的token
        Cesium.Ion.defaultAccessToken='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZmQ1MTJiZC03NmFmLTQ0YzMtYjAwMS1iNTQ3ZDBkNmU2ODgiLCJpZCI6Mjg4MDUsInNjb3BlcyI6WyJhc'+
        '2wiLCJhc3IiLCJhc3ciLCJnYyIsInByIl0sImlhdCI6MTU5MTU4NzY0Mn0.9pVXyPhcRF9lax5CPChENS_pof73mT8Aexbfb4CB5PY';
        //地图初始化
        cesium  = new CesiumViewer("cesiumMap",{mapInitParams:MapConfig.mapInitParams});
        //显示当前坐标
        cesium.show3DCoordinates();
        //调用接口-隐藏logo以及地图服务版权信息
        cesium.hideMapLogo();
        //添加导航指北针
        cesium.cesiumViewer.extend(Cesium.viewerCesiumNavigationMixin, {defaultResetView:cesium.defaultResetView});
        // //加载地形图（地貌）
        // $("#cesiumTerrain").click(function(){
        //     if($(this).attr("class").indexOf("selected") != -1){
        //         cesium.addTerrainLayer(MapConfig.terrainObj);
        //     }else{
        //         cesium.romoveTerrainLayer();
        //     }
        // });
        //cesium.addTerrainLayer(MapConfig.terrainObj);
        //底图切换
        cesium.loadSwitcherMap(MapConfig.mapInitParams.imageryViewModels);
        //显示图层控制器（图层管理器）
        $("#cesium3DLayers").click(function(){
            cesium.show3DLayers(MapConfig.Layers);
        });
        //显示地图热点定位器
        $("#cesium3DLocation").click(function(){
            //加载地图热点定位器
            cesium.show3DLocator(MapConfig.locations);
        });
		//清空地图
        $("#cesiumClearData").click(function(){
            cesium.clearMap();
        });
        //显示地图复位（第一个图标）
        $("#cesiumMapFull").click(function(){
            cesium.flyToRectangle(cesium.initExtent);
        });
        //显示地图卷帘
        $("#cesium3DSlider").click(function(){
            cesium.showCesiumSlider(3);
        });
        //量算工具
        var html='<div id="toolTip" class="measure-mouse-tip" style="display:none;color:rgb(236, 159, 30);border: 1px solid rgb(236, 159, 30);position:absolute;font-size:12px;color:#fff">单击开始，双击结束</div>';
        $('.cesium-viewer').append(html);
        // 测量距离
        $("#measureDistance").click(function(){
            new measureDistance(cesium);
        });
        // 测量面积
        $("#measureArea").click(function(){
            new measureArea(cesium);
        });
        //绘制工具Draw
        //var html='<div id="toolbar" class="cesium_toolbar"></div>';
        //$('.cesium-viewer').append(html);
        // start the draw helper to enable shape creation and editing
        var drawHelper = new DrawHelper(cesium.cesiumViewer);
        var toolbar = drawHelper.addToolbar(document.getElementById("toolbar"), {
            buttons: ['marker', 'polyline', 'polygon', 'circle', 'extent']
        });
        toolbar.addListener('markerCreated', function(event) {
            //loggingMessage('Marker created at ' + event.position.toString());
            // create one common billboard collection for all billboards
            var b = new Cesium.BillboardCollection();
            cesium.cesiumViewer.scene.primitives.add(b);
            var billboard = b.add({
                show : true,
                id:"plot",
                position : event.position,
                pixelOffset : new Cesium.Cartesian2(0, 0),
                eyeOffset : new Cesium.Cartesian3(0.0, 0.0, 0.0),
                horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                verticalOrigin : Cesium.VerticalOrigin.CENTER,
                scale : 1.0,
                image: GLOBAL.domainResource+'/gis/cesium/images/glyphicons_242_google_maps.png',
                color : new Cesium.Color(1.0, 1.0, 1.0, 1.0)
            });
            billboard.setEditable();
        });
        toolbar.addListener('polylineCreated', function(event) {
            //loggingMessage('Polyline created with ' + event.positions.length + ' points');
            var polyline = new DrawHelper.PolylinePrimitive({
                positions: event.positions,
                width: 5,
                type:"plot",
                geodesic: true
            });
            cesium.cesiumViewer.scene.primitives.add(polyline);
            polyline.setEditable();
            polyline.addListener('onEdited', function(event) {
                //loggingMessage('Polyline edited, ' + event.positions.length + ' points');
            });

        });
        toolbar.addListener('polygonCreated', function(event) {
            //loggingMessage('Polygon created with ' + event.positions.length + ' points');
            var polygon = new DrawHelper.PolygonPrimitive({
                positions: event.positions,
                type:"plot",
                material : Cesium.Material.fromType('Checkerboard')
            });
            cesium.cesiumViewer.scene.primitives.add(polygon);
            polygon.setEditable();
            polygon.addListener('onEdited', function(event) {
                //loggingMessage('Polygon edited, ' + event.positions.length + ' points');
            });

        });
        toolbar.addListener('circleCreated', function(event) {
            //loggingMessage('Circle created: center is ' + event.center.toString() + ' and radius is ' + event.radius.toFixed(1) + ' meters');
            var circle = new DrawHelper.CirclePrimitive({
                center: event.center,
                radius: event.radius,
                type:"plot",
                material: Cesium.Material.fromType(Cesium.Material.RimLightingType)
            });
            cesium.cesiumViewer.scene.primitives.add(circle);
            circle.setEditable();
            circle.addListener('onEdited', function(event) {
                //loggingMessage('Circle edited: radius is ' + event.radius.toFixed(1) + ' meters');
            });
        });
        toolbar.addListener('extentCreated', function(event) {
            var extent = event.extent;
            //loggingMessage('Extent created (N: ' + extent.north.toFixed(3) + ', E: ' + extent.east.toFixed(3) + ', S: ' + extent.south.toFixed(3) + ', W: ' + extent.west.toFixed(3) + ')');
            var extentPrimitive = new DrawHelper.ExtentPrimitive({
                extent: extent,
                type:"plot",
                material: Cesium.Material.fromType(Cesium.Material.StripeType)
            });
            cesium.cesiumViewer.scene.primitives.add(extentPrimitive);
            extentPrimitive.setEditable();
            extentPrimitive.addListener('onEdited', function(event) {
                //loggingMessage('Extent edited: extent is (N: ' + event.extent.north.toFixed(3) + ', E: ' + event.extent.east.toFixed(3) + ', S: ' + event.extent.south.toFixed(3) + ', W: ' + event.extent.west.toFixed(3) + ')');
            });
        });
        // 标绘
        $("#cesiumDrawToolbar").click(function(){
            if($(this).attr("class").indexOf("selected") != -1){
                $("#toolbar").show();
            }else{
                $("#toolbar").hide();
            }
        });

        //三维模型3DModels
        //为了适配模型的光源效果最佳状态，设置模型的当前光照时间，并且停止时间流动计算
        cesium.cesiumViewer.clockViewModel.currentTime = Cesium.JulianDate.fromIso8601('2020-06-08T12:00:00+08:00');//北京时间
        cesium.cesiumViewer.clockViewModel.shouldAnimate = false;
        cesium.cesiumViewer.clockViewModel.canAnimate  = false;
        //cesium.cesiumViewer.scene.sun = new Cesium.Sun();
        //cesium.cesiumViewer.scene.sun.glowFactor = 10;//默认1.0
        //设置当前时间，并且恢复时间流动计算
        /*cesium.cesiumViewer.clockViewModel.currentTime = Cesium.JulianDate.fromDate(new Date());//北京时间
        cesium.cesiumViewer.clockViewModel.shouldAnimate = true;
        cesium.cesiumViewer.clockViewModel.canAnimate  = true;*/
        // 3D模型
        $("#cesium3DModel").click(function(){ 
            cesium.add3DGlft(MapConfig.Obj3D);
        });
        //倾斜摄影3DTiles
        $("#cesium3DTiles").click(function(){
            cesium.add3DTiles(MapConfig.Tiles3D);
        });
        //调用接口-批量加载图标显示
        var symbols=[];
        var obj ={
            id:"monitorID_1",
            name:"测试监控1",
            type:"infoWindow",
            position:Cesium.Cartesian3.fromDegrees(111.075,21.468),
            url:GLOBAL.domainResource+"/gis/cesium/images/red.png",
            description:{name:"测试监控1",content:"测试在线监控气泡窗口内容1"},
            width:32,
            height:60
        };
        symbols.push(obj);
        cesium.addPictureMarkerSymbols(symbols);
        //动态添加气泡窗口DIV
        var infoDiv = '<div id="trackPopUp" style="display:none;">'+
            '<div id="trackPopUpContent" class="leaflet-popup" style="top:-25px;left:0px;">'+
            '<a class="leaflet-popup-close-button" href="#">×</a>'+
            '<div class="leaflet-popup-content-wrapper">'+
            '<div id="trackPopUpLink" class="leaflet-popup-content" style="max-width: 300px;"></div>'+
            '</div>'+
            '<div class="leaflet-popup-tip-container">'+
            '<div class="leaflet-popup-tip"></div>'+
            '</div>'+
            '</div>'+
            '</div>';
        //$("#"+cesium.mapDivId).append(infoDiv);
        $(".cesium-viewer").append(infoDiv);
        //调用接口-气泡窗口
        var handler3D = new Cesium.ScreenSpaceEventHandler(cesium.cesiumViewer.scene.canvas);
        handler3D.setInputAction(function(movement) {
            //点击弹出气泡窗口
            var pick = cesium.cesiumViewer.scene.pick(movement.position);
            if(pick && pick.id && pick.id._position){//选中某模型
                var cartographic = Cesium.Cartographic.fromCartesian(pick.id._position._value);//世界坐标转地理坐标（弧度）
                var point=[ cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180];//地理坐标（弧度）转经纬度坐标
                var destination=Cesium.Cartesian3.fromDegrees(point[0], point[1], 3000.0);
                //debugger;
                //判断是否弹出气泡窗口内容
                switch (pick.id._type)
                {
                    case "infoWindow":
                        var content =
                            "<div>"+
                            "<span>测试监控1:</span><span>测试监控11</span></br>"+
                            "<span>测试监控12:</span><span>测试监控12</span></br>"+
                            "<span>测试监控13:</span><span>测试监控13</span></br>"+
                            "</div>";
                        var obj = {position:movement.position,destination:destination,content:content};
                        cesium.infoWindow(obj);
                        break;
                }
            }
            else{
                $('#trackPopUp').hide();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //飞行路径模块部分
        $("#cesiumFly3DPaths").click(function(){
            if($(this).attr("class").indexOf("selected") != -1){
                $(".fly3DPaths").show();
            }else{
                $(".fly3DPaths").hide();
            }
        });
        bxmap.FlyCesium.Init(cesium,drawHelper);//初始化漫游飞行路径功能
    }

    //URL及其他配置信息
    module.exports = {
        CESIUM:cesium,
        init: init
    };
});