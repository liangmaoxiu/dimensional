define(function (require, exports, module) {
    var cesium = null;
    var videoElement = null;
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
        //底图切换
        cesium.loadSwitcherMap(MapConfig.mapInitParams.imageryViewModels);
        //显示图层控制器（图层管理器）
        var showOrHideLay=true;
        $("#cesium3DLayers").click(function(){
            if($(this).attr("class").indexOf("active") != -1){
                if(showOrHideLay){
                    $(".syn3D").css("display","block");
                    //加载图层控制器
                    cesium.show3DLayers(MapConfig.Layers);
                    // 方法处理完之后重新加载
                    cesium.isLoad3DLayers=false;
                    showOrHideLay=false;
                }else{
                    $(".syn3D").css("display","none");
                    showOrHideLay=true;
                }
            }else{
                $(".syn3D").css("display","none");
            }
        });
        // 图层管理器 鼠标放上之后的样式 in out 
        $("#cesium3DLayers").hover(function(){
            if($(".window-left").hasClass('fold')){
                $(".syn3D").css("display","none");
            }
        },function(){
            $(".syn3D").css("display","none");
        });
         videoElement = document.getElementById('trailer');
         // 116.3912, 39.920  xmin: 112.2720152869,ymin: 37.692958923 最大范围  
         var positionOnEllipsoid = Cesium.Cartesian3.fromDegrees(112.286, 37.703);
         //3D笛卡尔点 x 轴指向当地的东部方向 y 轴指向本地北方向 z 轴指向穿过该位置的椭球面法线方向 大小
         var dimensions = new Cesium.Cartesian3(100, 50, 1.0);
         // 从以度为单位的经度和纬度值返回Cartesian3位置
         // 从具有东北向上轴的参考帧计算4x4变换矩阵以提供的原点为中心，以提供的椭球的固定参考系为中心
         var translateMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid);
         //从Matrix3计算代表旋转的Matrix4实例和代表翻译的Cartesian3     创建围绕x轴的旋转矩阵  旋转角度（以弧度为单位）正角是逆时针方向 toRadians 将度转换成弧度
         var rotationXMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(-45.0)));
         var rotationYMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(45.0)));
         // 计算表示不均匀比例的Matrix4实例。
         var scaleMatrix = Cesium.Matrix4.fromScale(dimensions);

         // 一个4x4矩阵，可索引为列主序数组
         var planeZModelMatrix = new Cesium.Matrix4();
         // multiply计算两个矩阵的乘积，将结果放在planeZModelMatrix中
         Cesium.Matrix4.multiply(translateMatrix, scaleMatrix, planeZModelMatrix);

         var planeXModelMatrix = new Cesium.Matrix4();
         Cesium.Matrix4.multiply(translateMatrix, rotationXMatrix, planeXModelMatrix);
         Cesium.Matrix4.multiply(planeXModelMatrix, scaleMatrix, planeXModelMatrix);

         var planeYModelMatrix = new Cesium.Matrix4();
         Cesium.Matrix4.multiply(translateMatrix, rotationYMatrix, planeYModelMatrix);
         Cesium.Matrix4.multiply(planeYModelMatrix, scaleMatrix, planeYModelMatrix);
         //  createPlane(planeZModelMatrix, new Cesium.Color(0.0, 0.0, 1.0, 1.0));
         // 创建平面 描述表示以原点为中心的平面的几何形状，并带有单位宽度和长度。
         var planeGeometry = new Cesium.PlaneGeometry({
            vertexFormat : Cesium.MaterialAppearance.VERTEX_FORMAT,
         });
        // 创建平面外轮廓 描述代表以原点为中心的平面轮廓的几何图形，并带有单位宽度和长度。
        var planeOutlineGeometry = new Cesium.PlaneOutlineGeometry({
        });
        // 几何体实例化允许一个 Geometry 对象在多个对象中的位置不同的位置和独特的颜色
        var planeGeometryInstance = new Cesium.GeometryInstance({
            // 要实例化的几何,几何学
            geometry : planeGeometry,
            //  Matrix4 转换以将几何图形从模型坐标转换为世界坐标的模型矩阵。
            modelMatrix : planeZModelMatrix
        });
         // 使用现有材料类型创建新平面
         var material = Cesium.Material.fromType('Image');
         material.uniforms.image = videoElement;
         var planeOutlineGeometryInstance = new Cesium.GeometryInstance({
             geometry : planeOutlineGeometry,
             modelMatrix : planeZModelMatrix,
             attributes : {
                 color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
             }
         });
         var myPrimitives = [];
        // 空间分析中的视频分析
        $("#videoShow").click(function(){
            var scene =cesium.cesiumViewer.scene;
            // 进入之后进行判断 如果播放则暂停，如果暂停则播放
            var disValue = $("#trailer").css("display");
            var primitive = new Cesium.Primitive({
                // 渲染的几何实例-或单个几何实例
                geometryInstances : planeGeometryInstance,
                // 用于渲染图元的外观;任意几何的外观支持材质着色
                appearance : new Cesium.MaterialAppearance({
                    // 如果 true ，则几何将被关闭
                    closed: false,
                    // 用于确定片段颜色的材料
                    material: material
                })
            });
            var myPrimitive = new Cesium.Primitive({
                geometryInstances : planeOutlineGeometryInstance,
                appearance : new Cesium.PerInstanceColorAppearance({
                    // 为 true ，则在片段着色器中使用平面阴影，这意味着不考虑照明。
                    flat : true,
                    // 可选的渲染状态将覆盖默认的渲染状态
                    renderState : {
                        lineWidth : Math.min(2.0, scene.maximumAliasedLineWidth)
                    }
                })
            }); 
            if(disValue =="block" ){
                // 暂停
                videoElement.pause();
                $("#trailer").css("display","none"); 
                $("#trailer").css("z-index","-112"); 
                for(var i=0; i< myPrimitives.length; i++){
                    scene.primitives.remove(myPrimitives[i]);
                }
                // scene.primitives.remove(myPrimitives.pop());
            }else{
                myPrimitives = [];
                $("#trailer").css("display","block");  
                $("#trailer").css("z-index","112"); 
                // 播放
                videoElement.play();
                myPrimitives.push(primitive);
                scene.primitives.add(primitive);
                myPrimitives.push(myPrimitive);
                scene.primitives.add(myPrimitive);
                cesium.cesiumViewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(positionOnEllipsoid, 50));
            }
            // 呈现一种球体
            // createPlane(planeXModelMatrix, new Cesium.Color(1.0, 0.0, 0.0, 1.0));
            // createPlane(planeYModelMatrix, new Cesium.Color(0.0, 1.0, 0.0, 1.0));
            // 具有中心和半径的包围球
      });
        // 热点定位器 鼠标放上之后的样式 in out 
        $("#cesium3DLocation").hover(function(){
            if($(".window-left").hasClass('fold')){
                $(".syn_location3D").css("display","none");
            }
        },function(){
            $(".syn_location3D").css("display","none");
        });
       
        //显示地图热点定位器
        var showOrHideHot=true;
        $("#cesium3DLocation").click(function(){
            if($(this).attr("class").indexOf("active") != -1){
                if(showOrHideHot){
                    $(".syn_location3D").css("display","block");
                    //加载地图热点定位器
                    cesium.show3DLocator(MapConfig.locations);
                    // 方法处理完之后重新加载
                    cesium.isLoadLocation=false;
                    showOrHideHot=false;
                }else{
                    $(".syn_location3D").css("display","none");
                    showOrHideHot=true;
                }
            }else{
                $(".syn_location3D").css("display","none");
            }
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
        var slider=true;
        $("#cesium3DSlider").click(function(){
            if(slider){
                cesium.showCesiumSlider(3);
                slider =false;
            }else{
                cesium.hideCesiumSlider();
                slider =true;;
            }
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
        // var drawHelper = new DrawHelper(cesium.cesiumViewer);
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
        var showOrHideHotPlot=true;
        $("#cesiumDrawToolbar").click(function(){
            if($(this).attr("class").indexOf("active") != -1){
                if(showOrHideHotPlot){
                    $("#toolbar").show();
                    $(".map_toolbar_list_more").addClass("plotting");
                    $("#toolbar").css("display","block");
                    showOrHideHotPlot=false;
                }else{
                    $("#toolbar").hide();
                    $("#toolbar").css("display","none");
                    showOrHideHotPlot=true;
                }
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
        var showOrHideFly=true;
        $("#cesiumFly3DPaths").click(function(){
            if($(this).attr("class").indexOf("active") != -1){
                if(showOrHideFly){
                    $(".fly3DPaths").show();
                    showOrHideFly=false;
                }else{
                    $(".fly3DPaths").hide();
                    showOrHideFly=true;
                }
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