/*!
 *自定义CesiumViewer类
 *gwli
 *2016-9-14
 */

/**
 * 加载DObject基类
 */
function loadDObject(){
    DUtil = {};
    DUtil.extend = function (destination, source) {
        destination = destination || {};
        if (source) {
            for (var property in source) {
                var value = source[property];
                if (value !== undefined) {
                    destination[property] = value;
                }
            }
            var sourceIsEvt = typeof window.Event == "function" && source instanceof window.Event;
            if (!sourceIsEvt && source.hasOwnProperty && source.hasOwnProperty('toString')) {
                destination.toString = source.toString;
            }
        }
        return destination;
    };
    DObject = function () {
        var Class = function () {
            if (arguments && arguments[0] != null) {
                this.construct.apply(this, arguments);
            }
        };
        var extended = {};
        var parent;
        for (var i = 0, len = arguments.length; i < len; ++i) {
            if (typeof arguments[i] == "function") {
                parent = arguments[i].prototype;
            } else {
                parent = arguments[i];
            }
            DUtil.extend(extended, parent);
        }
        Class.prototype = extended;
        return Class;
    };
}
if(typeof(DObject) =="undefined"){
    loadDObject();//DObject未定义undefined的情况下，加载DObject基类
}
/**
 * 自定义CesiumViewer类,继承Cesium.Viewer,封装自定义函数
 * @class CesiumViewer类
 * @constructor
 */
CesiumViewer = DObject({
    cesiumViewer: null,	//cesiumViewer对象
    initExtent:null,//地图初始范围
    defaultResetView:null,//默认cesium的defaultResetView
    cesiumLayerList:[],//cesium加载底图数组,默认为空数组
    mapDivId: null,//cesium地图容器
    spatialReferenceWkid:null,//空间坐标系wkid
    cartographicWS:null,
    cartographicEN:null,
    isLoad3DLayers:false,//图层管理器是否加载过
    isLoadLocation:false,//热点定位器是否加载过
    entityFly:null,//当前飞行模型Entity
    draw3DObj:null,//飞行模式的路径信息
    drawPolyline:null,//飞行绘制路线
    /**
     * 类构造函数
     * @method construct
     * @param  divId 地图容器div的id
     * @param  options 构造Cesium.Viewer可选参数
     * @return cesiumViewer cesiumBase widget对象
     */
    construct: function (divId, options) {
        if (divId == null || divId == "") { return; }
        this.mapDivId = divId;
        //pDiv = document.getElementById(divId);
        this.spatialReferenceWkid = options.mapInitParams.spatialReference.wkid;
        this.cesiumViewer = new Cesium.Viewer(divId, {
            showRenderLoopErrors: false,
            sceneModePicker: false, //是否显示投影方式控件
            fullscreenElement: document.body, //全屏时渲染的HTML元素
            animation:false, //是否显示动画控件，默认true
            shouldAnimate : true,
            requestRenderMode: true, //启用请求渲染模式
            scene3DOnly: false, //每个几何实例将只能以3D渲染以节省GPU内存
            sceneMode: 3 ,//初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
            baseLayerPicker:false,//地图切换控件(底图以及地形图)是否显示,默认显示true
            fullscreenButton:false,//全屏按钮,默认显示true
            geocoder:false,//地名查找,默认true
            timeline:false,//时间线,默认true
            vrButton:false,//双屏模式,默认不显示false
            homeButton:false,//主页按钮，默认true
            infoBox:false,//点击要素之后显示的信息,默认true
            selectionIndicator:true,//选中元素显示,默认true
            navigationHelpButton:false,//导航帮助说明,默认true
            navigationInstructionsInitiallyVisible:false,
            automaticallyTrackDataSourceClocks:true,//自动追踪最近添加的数据源的时钟设置,默认true
            imageryProviderViewModels:this._getImageryViewModels(options.mapInitParams.imageryViewModels),//设置影像图列表，baseLayerPicker配合使用
            //mapProjection : new Cesium.WebMercatorProjection(),
            //globe:new Cesium.Globe(),
            //imageryProvider :this.returnProviderViewModel(options.mapInitParams.imageryViewModels[0]),//baseLayerPicker设置false才生效，默认加载的底图
            sceneModePicker : false,//是否显示地图2D2.5D3D模式
        });
        var viewer = this.cesiumViewer;
        var cesium = this;
        //清空底图
        this.cesiumViewer.scene.imageryLayers.removeAll();
        var layers = viewer.scene.imageryLayers;
        //默认加载配置文件第一个底图
        var baseLayer = layers.addImageryProvider(this.returnProviderViewModel(options.mapInitParams.imageryViewModels[0]));
        layers.lowerToBottom(baseLayer);
        //设置相机角度
        // viewer.scene.camera.setView({
        //     destination:Cesium.Cartesian3.fromDegrees(112.324103, 37.710597,3000),
        //     orientation:{
        //         heading:1.7763568394002505e-15,
        //         pitch:-0.7854646577982072,
        //         roll:6.283185307179586
        //     }
        // });

        //viewer.scene.globe.show = false;//设置隐藏球体不可见
        this.cesiumLayerList.push({layer:baseLayer,id:"baseMap"});
        //设置地图主页按钮跳转地图为自定义的地图位置
        if(!this.isEmpty(options.mapInitParams)){
            var cartographic1 = null;
            var cartographic2 = null;
            //var viewer = this.cesiumViewer;
            //地图配置文件投影坐标系不是经纬度4326的话，需要投影转换
            if(options.mapInitParams.spatialReference.wkid != 4326){
                this.cartographicWS = cartographic1 = proj4('EPSG:'+options.mapInitParams.spatialReference.wkid, 'EPSG:4326', [options.mapInitParams.extent.xmin, options.mapInitParams.extent.ymin]);
                this.cartographicEN = cartographic2 = proj4('EPSG:'+options.mapInitParams.spatialReference.wkid, 'EPSG:4326', [options.mapInitParams.extent.xmax, options.mapInitParams.extent.ymax]);
            }else{//地图配置文件投影坐标系经纬度4326
                this.cartographicWS = cartographic1 = [options.mapInitParams.extent.xmin, options.mapInitParams.extent.ymin];
                this.cartographicEN = cartographic2 = [options.mapInitParams.extent.xmax, options.mapInitParams.extent.ymax];
            }
            // Override behavior of home button
            if(viewer.homeButton){
                viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(commandInfo) {
                    //地图范围跳转
                    viewer.camera.flyTo({
                        destination : Cesium.Rectangle.fromDegrees(cartographic1[0], cartographic1[1], cartographic2[0], cartographic2[1])
                    });
                    commandInfo.cancel = true;
                });
            }
            //重写cesium二维切换模式机制
            if(viewer.sceneModePicker){
                viewer.sceneModePicker.viewModel.morphTo2D.beforeExecute.addEventListener(function(commandInfo) {
                    //$("#map").show();
                    //$("#cesiumContainer").hide();
                    cesium.morphTo2DMap();
                    commandInfo.cancel = true;
                });
            }
            //创建地图初始范围对象
            this.initExtent = new Cesium.Rectangle(cartographic1[0], cartographic1[1], cartographic2[0], cartographic2[1]);
            //初始化地图范围跳转
            this.flyToRectangle(this.initExtent);
            //设置cesium默认defaultResetView
            this.defaultResetView = Cesium.Rectangle.fromDegrees(this.initExtent.west, this.initExtent.south, this.initExtent.east, this.initExtent.north);
            //隐藏底图切换控件的底图服务以及地形图的标题显示
            if(this.cesiumViewer._baseLayerPickerDropDown){
                this.cesiumViewer._baseLayerPickerDropDown.childNodes[0].style.display = "none";
                this.cesiumViewer._baseLayerPickerDropDown.childNodes[2].style.display = "none";
            }
        }
        var handler3D = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler3D.setInputAction(function(movement) {
            if(document.getElementById(cesium.mapDivId).style.display=="none"){//三维地图不可见情况下
                return;
            }else{
                var pick = viewer.scene.pick(movement.endPosition);
                if(pick){
                    //设置地图鼠标样式
                    viewer.container.style.cursor="pointer";
                }else{
                    //设置地图鼠标样式
                    viewer.container.style.cursor="auto";
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    },
    /**
     * 地图切换控件
     */
    loadSwitcherMap:function(data){
        var T = this;
        //设置底图不同类型
        var baseLayerSwitcherToolbar = new BaseLayerSwitcherToolBar({
            data: data
        });
        //$("#"+this.mapDivId).append(baseLayerSwitcherToolbar.target);
        $(".cesium-viewer").append(baseLayerSwitcherToolbar.target);
        var curlayer = null;
        var labellayer = null;
        baseLayerSwitcherToolbar.onItemClick = function(itemData,index,element){
            //var data = itemData.data;
            var data = itemData;
            /*if(curlayer)
                T.cesiumViewer.scene.imageryLayers.remove(curlayer);
            if(labellayer)
                T.cesiumViewer.scene.imageryLayers.remove(labellayer);*/
            //T.cesiumViewer.scene.imageryLayers.removeAll();//清空底图
            //清空指定ID的底图imageryLayers
            T.removeLayerByID("baseMap");
            //关闭图层管理器
            //$("#layerHtmlClose").click();
            switch (data.type) {
                case 2://天地图，矢量和注记分开
                    var layers = T.cesiumViewer.scene.imageryLayers;
                    curlayer = layers.addImageryProvider(T.returnProviderViewModel(MapConfig.mapInitParams.imageryViewModels[data.id]));
                    //天地图注记配置信息
                    var tdtLabel = {type:2,proxyUrl:'',Url:'http://t{l}.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=tiles',layer: 'tdtCiaBasicLayer',style: 'default',format: 'image/jpeg',tileMatrixSetID:'tdtMap'};
                    labellayer = layers.addImageryProvider(T.returnProviderViewModel(tdtLabel));
                    //labellayer = layers.addImageryProvider(T.returnProviderViewModel(MapConfig.mapInitParams.imageryViewModels[MapConfig.mapInitParams.imageryViewModels.length-1]));
                    //layers.raiseToTop(labellayer);
                    layers.lowerToBottom(labellayer);
                    layers.lowerToBottom(curlayer);
                    T.cesiumLayerList.push({layer:curlayer,id:"baseMap"});
                    T.cesiumLayerList.push({layer:labellayer,id:"baseMap"});
                    break;
                default:
                    var layers = T.cesiumViewer.scene.imageryLayers;
                    curlayer = layers.addImageryProvider(T.returnProviderViewModel(MapConfig.mapInitParams.imageryViewModels[data.id]));
                    layers.lowerToBottom(curlayer);
                    T.cesiumLayerList.push({layer:curlayer,id:"baseMap"});
                    break;
            }
        };
    },
    /*显示当前坐标*/
    show3DCoordinates: function () {
        //地图底部工具栏显示地图坐标信息
        var elementbottom = document.createElement("div");
        $(".cesium-viewer").append(elementbottom);
        elementbottom.className = "mapfootBottom";

        var coordinatesDiv = document.getElementById(this.mapDivId + "_coordinates");
        if (coordinatesDiv) {
            coordinatesDiv.style.display = "block";
        }
        else {
            var viewer = this.cesiumViewer;
            //var scale;
            var _divID_coordinates = this.mapDivId + "_coordinates";
            coordinatesDiv = document.createElement("div");
            coordinatesDiv.id = _divID_coordinates;
            coordinatesDiv.className = "map3D-coordinates";
            coordinatesDiv.innerHTML = "<span id='cd_label' style='font-size:13px;text-align:center;font-family:微软雅黑;color:#edffff;'>暂无坐标信息</span>";
            //document.getElementById(this.mapDivId).appendChild(coordinatesDiv);
            $(".cesium-viewer").append(coordinatesDiv);
            var handler3D = new Cesium.ScreenSpaceEventHandler(
                viewer.scene.canvas);
            handler3D.setInputAction(function(movement) {
                var pick= new Cesium.Cartesian2(movement.endPosition.x,movement.endPosition.y);
                if(pick){
                    var cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(pick), viewer.scene);
                    if(cartesian){
                        //世界坐标转地理坐标（弧度）
                        var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
                        if(cartographic){
                            //海拔
                            var height = viewer.scene.globe.getHeight(cartographic);
                            //视角海拔高度
                            var he = Math.sqrt(viewer.scene.camera.positionWC.x * viewer.scene.camera.positionWC.x + viewer.scene.camera.positionWC.y * viewer.scene.camera.positionWC.y + viewer.scene.camera.positionWC.z * viewer.scene.camera.positionWC.z);
                            var he2 = Math.sqrt(cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z);
                            //地理坐标（弧度）转经纬度坐标
                            var point=[ cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180];
                            if(!height){
                                height = 0;
                            }
                            if(!he){
                                he = 0;
                            }
                            if(!he2){
                                he2 = 0;
                            }
                            if(!point){
                                point = [0,0];
                            }
                            coordinatesDiv.innerHTML = "<span id='cd_label' style='font-size:13px;text-align:center;font-family:微软雅黑;color:#edffff;'>"+"视角海拔高度:"+(he - he2).toFixed(2)+"米"+"&nbsp;&nbsp;&nbsp;&nbsp;海拔:"+height.toFixed(2)+"米"+"&nbsp;&nbsp;&nbsp;&nbsp;经度：" + point[0].toFixed(6) + "&nbsp;&nbsp;纬度：" + point[1].toFixed(6)+ "</span>";
                        }
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }

    },
    /*隐藏当前坐标*/
    hide3DCoordinates:function () {
        var coordinatesDiv = document.getElementById(this.mapDivId + "_coordinates");
        if (coordinatesDiv) {
            coordinatesDiv.style.display = "none";
        }
    },
    /**
     * 判断对象是否为空
     * @method isEmpty
     * @param  obj 对象参数值
     * @return flag判断标识
     */
    isEmpty:function(obj){
        for (var name in obj)
        {
            return false;
        }
        return true;
    },
    /**
     * 获取地形图配置列表
     * @method _getTerrainViewModels
     * @param  models 配置文件中的地形图列表
     * @return terrainViewModels
     */
    _getTerrainViewModels:function(models){
        var terrainViewModels = [];
        var viewer = this.cesiumViewer;
        if(models && models.length>0){
            for(var i=0;i<models.length;i++){//默认最多能识别配置2个地形图信息
                var terrain = _createTerrainProviderViewModel(models[i]);
                terrainViewModels.push(terrain);
                /*var model = models[i];
                switch (i) {
                case 0:
                    var terrain = _createTerrainProviderViewModel(models[0]);
                    terrainViewModels.push(terrain);
                    break;
                case 1:
                    var terrain = _createTerrainProviderViewModel(models[1]);
                    terrainViewModels.push(terrain);
                    break;
                default:
                    break;
                }*/
            }
        }
        return terrainViewModels;

        /**
         * 创建ProviderViewModel
         * @method _createTerrainProviderViewModel
         * @param  model,配置文件地形图信息
         * @return 返回指定地形图ProviderViewModel
         */
        function _createTerrainProviderViewModel(model){
            return new Cesium.ProviderViewModel(
                {
                    name : model.name,
                    iconUrl : Cesium.buildModuleUrl(model.iconUrl),
                    tooltip : model.name,
                    creationFunction : function() {
                        return _createTerrainProvider(model);
                    }
                });
        }
        /**
         * 创建指定地形图数据源
         * @method _createTerrainProvider
         * @param  model,配置文件地形图信息
         * @return 返回指定地形图数据源
         */
        function _createTerrainProvider(model){
            var provider ={};
            if(model.proxyUrl && model.proxyUrl.length>0)
                provider = {proxy:new Cesium.DefaultProxy(model.proxyUrl),url:model.Url,requestWaterMask:model.requestWaterMask};
            else
                provider = {url:model.Url,requestWaterMask:model.requestWaterMask};

            return new Cesium.CesiumTerrainProvider(provider);
        }
    },
    /**
     * 返回地图服务imageryProvider
     * @method returnProviderViewModel
     * @param  model 配置文件中的底图服务列表其中一个选项
     * @return imageryProvider
     */
    returnProviderViewModel:function(model){
        var provider ={};
        if(model.proxyUrl && model.proxyUrl.length>0)
            provider = {proxy : new Cesium.DefaultProxy(model.proxyUrl),url : model.Url};
        else
            provider = {url : model.Url};
        switch (model.type) {
            case 0://ArcGisMapServerImageryProvider
                var obj= {enablePickFeatures:false};
                provider = Object.assign(provider, obj);
                return new Cesium.ArcGisMapServerImageryProvider(provider);
                break;
            case 1://OpenStreetMapImageryProvider
                return Cesium.createOpenStreetMapImageryProvider(provider);
                break;
            case 2://WebMapTileServiceImageryProvider
                /*var obj= { layer:model.layer,style:model.style,format:model.format,tileMatrixSetID:model.tileMatrixSetID};
                provider = Object.assign(provider, obj);
                return new Cesium.WebMapTileServiceImageryProvider(provider);*/
                var obj= { layer:model.layer,style:model.style,format:model.format,tileMatrixSetID:model.tileMatrixSetID};
                provider = Object.assign(provider, obj);
                var tdtProvider = new TDTWMTSImageProvider(provider.url, false, 1, 18);
                return tdtProvider;
                break;
            case 3://TileMapServiceImageryProvider
                var obj= {credit:model.credit,fileExtension:model.fileExtension};
                provider = Object.assign(provider, obj);
                return Cesium.createTileMapServiceImageryProvider(provider);
                break;
            case 4://Cesium.UrlTemplateImageryProvider
                var obj= {credit:model.credit};
                provider = Object.assign(provider, obj);
                return new Cesium.UrlTemplateImageryProvider(provider);
                break;
            case 5://Cesium.WebMapServiceImageryProvider
                var obj= {credit:model.credit,layers:model.layers,tilingScheme:model.tilingScheme};
                provider = Object.assign(provider, obj);
                return new Cesium.WebMapServiceImageryProvider(provider);
                break;
            default:
                var obj= {enablePickFeatures:false};
                provider = Object.assign(provider, obj);
                return new Cesium.ArcGisMapServerImageryProvider(provider);
                break;
        }
    },
    /**
     * 获取切换地图服务配置列表
     * @method _getImageryViewModels
     * @param  models 配置文件中的底图服务列表
     * @return imageryViewModels
     */
    _getImageryViewModels:function(models){
        //debugger;
        var imageryViewModels = [];
        var viewer = this.cesiumViewer;
        if(models && models.length>0){
            for(var i=0;i<models.length;i++){//默认最多能识别配置地图信息文件的8个底图服务
                var imagery = _createProviderViewModel(models[i]);
                imageryViewModels.push(imagery);
                /*var model = models[i];
                switch (i) {
                case 0:
                    var imagery = _createProviderViewModel(models[0]);
                    imageryViewModels.push(imagery);
                    break;
                case 1:
                    var imagery = _createProviderViewModel(models[1]);
                    imageryViewModels.push(imagery);
                    break;
                case 2:
                    var imagery = _createProviderViewModel(models[2]);
                    imageryViewModels.push(imagery);
                    break;
                case 3:
                    var imagery = _createProviderViewModel(models[3]);
                    imageryViewModels.push(imagery);
                    break;
                case 4:
                    var imagery = _createProviderViewModel(models[4]);
                    imageryViewModels.push(imagery);
                    break;
                case 5:
                    var imagery = _createProviderViewModel(models[5]);
                    imageryViewModels.push(imagery);
                    break;
                case 6:
                    var imagery = _createProviderViewModel(models[6]);
                    imageryViewModels.push(imagery);
                    break;
                case 7:
                    var imagery = _createProviderViewModel(models[7]);
                    imageryViewModels.push(imagery);
                    break;
                default:
                    break;
                }*/
            }
        }
        return imageryViewModels;

        /**
         * 创建ProviderViewModel
         * @method _createProviderViewModel
         * @param  model,配置文件地图信息
         * @return 返回指定地图服务类型的ProviderViewModel
         */
        function _createProviderViewModel(model){
            return new Cesium.ProviderViewModel(
                {
                    name : model.name,
                    iconUrl : Cesium.buildModuleUrl(model.iconUrl),
                    tooltip : model.name,
                    creationFunction : function() {
                        return _createImageryProvider(model);
                    }
                });
        }
        /**
         * 创建指定地图服务类型的地图数据源，比如ArcGisMapServer、OpenStreetMap、BingMaps、MapBox、TileMapService、WebMapTileService等等
         * @method _createImageryProvider
         * @param  model,配置文件地图信息
         * @return 返回指定地图服务类型的地图数据源
         */
        function _createImageryProvider(model){
            var provider ={};
            if(model.proxyUrl && model.proxyUrl.length>0)
                provider = {proxy : new Cesium.DefaultProxy(model.proxyUrl),url : model.Url};
            else
                provider = {url : model.Url};
            switch (model.type) {
                case 0://ArcGisMapServerImageryProvider
                    var obj= {enablePickFeatures:false};
                    provider = Object.assign(provider, obj);
                    return new Cesium.ArcGisMapServerImageryProvider(provider);
                    break;
                case 1://OpenStreetMapImageryProvider
                    return Cesium.createOpenStreetMapImageryProvider(provider);
                    break;
                case 2://WebMapTileServiceImageryProvider
                    /*var obj= { layer:model.layer,style:model.style,format:model.format,tileMatrixSetID:model.tileMatrixSetID};
                    provider = Object.assign(provider, obj);
                    return new Cesium.WebMapTileServiceImageryProvider(provider);*/
                    var obj= { layer:model.layer,style:model.style,format:model.format,tileMatrixSetID:model.tileMatrixSetID};
                    provider = Object.assign(provider, obj);
                    var tdtProvider = new TDTWMTSImageProvider(provider.url, false, 1, 18);
                    return tdtProvider;
                    break;
                case 3://TileMapServiceImageryProvider
                    var obj= {credit:model.credit,fileExtension:model.fileExtension};
                    provider = Object.assign(provider, obj);
                    return Cesium.createTileMapServiceImageryProvider(provider);
                    break;
                case 4://Cesium.UrlTemplateImageryProvider
                    var obj= {credit:model.credit};
                    provider = Object.assign(provider, obj);
                    return new Cesium.UrlTemplateImageryProvider(provider);
                    break;
                case 5://Cesium.WebMapServiceImageryProvider
                    var obj= {credit:model.credit,layers:model.layers,tilingScheme:model.tilingScheme};
                    provider = Object.assign(provider, obj);
                    return new Cesium.WebMapServiceImageryProvider(provider);
                    break;
                default:
                    var obj= {enablePickFeatures:false};
                    provider = Object.assign(provider, obj);
                    return new Cesium.ArcGisMapServerImageryProvider(provider);
                    break;
            }
        }
    },
    /**
     * 添加ArcGisMapServer图层
     * @method addArcGisMapServerLayer
     * @param  url 地图url proxyUrl 代理请求url
     * @return
     */
    addArcGisMapServerLayer: function (url,proxyUrl) {
        if (url && url.replace(/(^s*)|(s*$)/g, "").length >0)
        {
            var provider ={};
            if(proxyUrl && proxyUrl.length>0)
                provider = {proxy:new Cesium.DefaultProxy(proxyUrl),url:url};
            else
                provider = {url:url};

            var layers = this.cesiumViewer.scene.imageryLayers;
            layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider(provider));
        }
    },
    /**
     * 添加地形图图层
     * @method addTerrainLayer
     * @param  url 地形图url proxyUrl 代理请求url
     * @return
     */
    addTerrainLayer: function (terrainObj) {
        var provider ={};
        if(terrainObj.proxyUrl && terrainObj.proxyUrl.length>0)
            provider = {proxy:new Cesium.DefaultProxy(terrainObj.proxyUrl),url:terrainObj.url,requestWaterMask:terrainObj.requestWaterMask,requestVertexNormals:terrainObj.requestVertexNormals};
        else
            provider = {url:terrainObj.url,requestWaterMask:terrainObj.requestWaterMask,requestVertexNormals:terrainObj.requestVertexNormals};
        
    	if(terrainObj.type == "createWorldTerrain"){//在线地形图
    		var terrainProvider = Cesium.createWorldTerrain(provider);
    		this.cesiumViewer.terrainProvider = terrainProvider;   		
    	}else{
            //if (terrainObj.url && terrainObj.url.replace(/(^s*)|(s*$)/g, "").length >0)
            if (terrainObj.url)
            {
                var terrainProvider = new Cesium.CesiumTerrainProvider(provider);
                this.cesiumViewer.terrainProvider = terrainProvider;
            }
    	}
    },
    /**
     * 移除地形图图层
     * @method romoveTerrainLayer
     * @param
     * @return
     */
    romoveTerrainLayer: function () {
        if (this.cesiumViewer.terrainProvider)
        {
            this.cesiumViewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        }
    },
    /**
     * 隐藏logo以及地图服务版权信息
     * @method hideMapLogo
     * @param
     * @return
     */
    hideMapLogo: function () {
        this.cesiumViewer._cesiumWidget._creditContainer.style.display = "none";
    },
    /**
     * 显示logo以及地图服务版权信息
     * @method showMapLogo
     * @param
     * @return
     */
    showMapLogo: function () {
        this.cesiumViewer._cesiumWidget._creditContainer.style.display = "block";
    },
    /**
     * 隐藏地图分屏控件
     * @method hideSplitScreen
     * @param
     * @return
     */
    hideSplitScreen: function () {
        this.cesiumViewer._vrButton._container.style.display = "none";
    },
    /**
     * 显示地图分屏控件
     * @method showSplitScreen
     * @param
     * @return
     */
    showSplitScreen: function () {
        this.cesiumViewer._vrButton._container.style.display = "block";
    },
    /**
     * 设置地图底图容器标题以及字体大小
     * @method setBaseLayerPickerTitle
     * @param  title 标题
     * @param  fontsize 字体大小
     * @return
     */
    setBaseLayerPickerTitle: function (title,fontsize) {
        if (jQuery) {
            //替换底图显示的字体以及大小
            $(".cesium-baseLayerPicker-sectionTitle").html(title);
            $(".cesium-baseLayerPicker-sectionTitle").css("font-size", fontsize);
        }
    },
    /**
     * 绘制面
     * @method drawPolygon
     * @param  name 名称
     * @param  geos 几何(经纬度)数组
     * @return 绘制的面对象
     */
    drawPolygon: function (name,geos) {
        var polygon = viewer.entities.add({
            name : name,
            polygon : {
                hierarchy : Cesium.Cartesian3.fromDegreesArray(geos),
                material : Cesium.Color.RED.withAlpha(0.25)
            }
        });
        return polygon;
    },
    /**
     * 批量加载3D模型
     * @method add3DEntityModels
     * @param  models 3D模型数组
     * @return
     */
    add3DEntityModels: function (models) {
        //var heading = Cesium.Math.toRadians(45.0);
        //var pitch = Cesium.Math.toRadians(15.0);
        //var roll = Cesium.Math.toRadians(0.0);
        //var orientation = Cesium.Transforms.headingPitchRollQuaternion(
        //position, heading, pitch, roll);
        if(models && models.length>0){
            for(var i=0;i<models.length;i++){
                var type = null;
                if(models[i].type){
                    type = models[i].type;
                }
                var entity = this.cesiumViewer.entities.add({
                    name : models[i].name,
                    id:models[i].id+Math.random().toString(36).substr(2),
                    type : type,
                    position : models[i].position,
                    //orientation : orientation,
                    model : {
                        uri : models[i].uri,
                        //distanceDisplayCondition : new Cesium.DistanceDisplayCondition(100, 5000),//设置模型可见范围，100米到5000米
                        //maximumScale:12,
                        //incrementallyLoadTextures:false,//确定在加载模型后,是否继续加载纹理
                    }
                });
                //this.cesiumViewer.trackedEntity = entity;//建议不跟踪定位3D模型，不然锁定视角操作不灵活
            }
        }
    },
    /**
     * 加载GLFT模型
     * @method add3DGlft
     * @param
     * @return
     */
    add3DGlft: function (obj) {
        //加载3dModel
        this.add3DEntityModels(obj.models);
        //跳转位置
        this.flyToPosition(obj.position);
    },
    /**
     * 加载3DTile模型
     * @method add3DTileModels
     * @param  url 3DTile模型url,boundingSphere 跳转定位的包围球
     * @return
     */
    add3DTileModels: function (url,boundingSphere) {
        if(boundingSphere)
            this.cesiumViewer.camera.flyToBoundingSphere(boundingSphere, {duration: 0});
        // Add tileset. Do not forget to reduce the default screen space error to 2
        var tileset = this.cesiumViewer.scene.primitives.add(new Cesium.Cesium3DTileset({
            url: url,
            maximumScreenSpaceError: 2,//默认16,最大屏幕空间错误
            //maximumNumberOfLoadedTiles: 1000,
            maximumMemoryUsage:512//默认512,内存MB的最大数量
            //maximumScreenSpaceError: 8,
            //maximumNumberOfLoadedTiles: 10
        }));
    },
    /**
     * 测试加载指定的3DTitles模型
     * @method add3DTiles
     * @param
     * @return
     */
    add3DTiles: function (obj) {
        var T = this;
        var tileset = this.cesiumViewer.scene.primitives.add(new Cesium.Cesium3DTileset({
            url:obj.url,
            maximumScreenSpaceError: 2,//默认16,最大屏幕空间错误
            //maximumNumberOfLoadedTiles: 1000,
            maximumMemoryUsage:512//默认512,内存MB的最大数量
        }));
        tileset.readyPromise.then(function(tileset) {
            T.cesiumViewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
            T.cesiumViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        	//T.cesiumViewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.5, -0.2, tileset.boundingSphere.radius * 4.0));
        });
    },
    /**
     * 批量加载图片符号
     * @method addPictureMarkerSymbols
     * @param  {Array} symbols 图片符号数组
     * @return
     */
    addPictureMarkerSymbols: function (symbols) {
        if(symbols && symbols.length>0){
            for(var i=0;i<symbols.length;i++){
                var type = null;
                if(symbols[i].type){
                    type = symbols[i].type;
                }
                this.cesiumViewer.entities.add({
                    id:symbols[i].id,
                    name:symbols[i].name,
                    type:type,
                    position : symbols[i].position,
                    description:symbols[i].description,
                    billboard : {
                        image : symbols[i].url,
                        width : symbols[i].width,
                        height : symbols[i].height
                    },
                    label : {
                        text : symbols[i].name,
                        //font : '13pt monospace',
                        font : '13px sans-serif',
                        //fillColor:Cesium.Color.BLUE,
                        //outlineColor:Cesium.Color.WHITE,
                        style : Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth : 1,
                        verticalOrigin : Cesium.VerticalOrigin.TOP,
                        pixelOffset : new Cesium.Cartesian2(0, 16)
                    }
                });
            }
        }
    },
    /**
     * 三维地图模式切换
     * @method morphTo3DMap
     * @param  extent 当前模式下地图范围[xmin,ymin,xmax,ymax]
     * @return
     */
    morphTo3DMap:function(extent){
        var extent3D;
        if(this.spatialReferenceWkid != 4326){
            var cartographic1 = proj4('EPSG:'+this.spatialReferenceWkid, 'EPSG:4326', [extent[0], extent[1]]);
            var cartographic2 = proj4('EPSG:'+this.spatialReferenceWkid, 'EPSG:4326', [extent[2], extent[3]]);
            extent3D = new Cesium.Rectangle(cartographic1[0], cartographic1[1], cartographic2[0], cartographic2[1]);
        }else{
            extent3D = new Cesium.Rectangle(extent[0], extent[1], extent[2], extent[3]);
        }
        //设置三维地图范围跳转
        this.flyToRectangle(extent3D);
    },
    /**
     * 二维地图模式切换
     * @method morphTo2DMap
     * @param
     * @return extent,返回当前模式下地图范围[xmin,ymin,xmax,ymax]
     */
    morphTo2DMap: function () {
        //获取当前三维地图范围
        var Rectangle = this.cesiumViewer.camera.computeViewRectangle();
        //地理坐标（弧度）转经纬度坐标
        var extent=[ Rectangle.west / Math.PI * 180, Rectangle.south / Math.PI * 180, Rectangle.east / Math.PI * 180, Rectangle.north / Math.PI * 180];
        if(this.spatialReferenceWkid != 4326){
            var cartographic1 = proj4('EPSG:4326', 'EPSG:'+this.spatialReferenceWkid, [extent[0], extent[1]]);
            var cartographic2 = proj4('EPSG:4326', 'EPSG:'+this.spatialReferenceWkid, [extent[2], extent[3]]);
            extent = new Cesium.Rectangle(cartographic1[0], cartographic1[1], cartographic2[0], cartographic2[1]);
        }
        return extent;
    },
    /**
     * 弹出气泡窗口
     * @method infoWindow
     * @param  obj{position(必填):屏幕坐标,destination(必填):跳转目的点,content(必填):气泡窗口内容,css(可填):设置css的width,height}
     * @return 返回选中的模型Entity
     */
    infoWindow: function (obj) {
        var picked = this.cesiumViewer.scene.pick(obj.position);
        if (Cesium.defined(picked)) {
            var viewer = this.cesiumViewer;
            var id = Cesium.defaultValue(picked.id, picked.primitive.id);
            if (id instanceof Cesium.Entity) {
                if(obj.destination){
                    this.cesiumViewer.camera.flyTo({//初始化跳转某个地方
                        destination : obj.destination
                    });
                }
                //填充内容
                $(".cesium-selection-wrapper").show();
                $('#trackPopUpLink').empty();
                $('#trackPopUpLink').append(obj.content);
                function positionPopUp (c) {
                    var x = c.x - ($('#trackPopUpContent').width()) / 2;
                    var y = c.y - ($('#trackPopUpContent').height());
                    $('#trackPopUpContent').css('transform', 'translate3d(' + x + 'px, ' + y + 'px, 0)');
                }
                var c = new Cesium.Cartesian2(obj.position.x, obj.position.y);
                $('#trackPopUp').show();
                positionPopUp(c); // Initial position at the place item picked
                var removeHandler = viewer.scene.postRender.addEventListener(function () {
                    var changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, id._position._value);
                    // If things moved, move the popUp too
                    if(c && changedC && c.x && changedC.x && c.y && changedC.y){
                        if ((c.x !== changedC.x) || (c.y !== changedC.y)) {
                            positionPopUp(changedC);
                            c = changedC;
                        }
                    }

                });
                // PopUp close button event handler
                $('.leaflet-popup-close-button').click(function() {
                    $('#trackPopUp').hide();
                    $('#trackPopUpLink').empty();
                    $(".cesium-selection-wrapper").hide();
                    removeHandler.call();
                    return false;
                });
                return id;
            }
        }
    },
    /**
     * 地图跳转-地图点Point
     * @method flyToPoint
     * @param  longitude 经度; latitude 纬度; height 高度;
     * @return
     * 调用用例
     flyToPoint(-115.0, 37.0, 1000);
     */
    flyToPoint:function(longitude,latitude,height){
        this.cesiumViewer.camera.flyTo({//初始化跳转某个地方
            destination : Cesium.Cartesian3.fromDegrees(longitude, latitude,
                height)
        });
    },
    /**
     * 地图跳转-地图位置
     * @method flyToPosition
     * @param  position 位置
     * @return
     */
    flyToPosition:function(position){
        this.cesiumViewer.camera.flyTo({//初始化跳转某个地方
            destination :position
        });
    },
    /**
     * 地图跳转-地图范围Rectangle
     * @method flyToRectangle
     * @param  对象Rectangle(west, south, east, north);
     * @return
     * 调用用例
     * var rectangle = new Rectangle(-115.0, 37.0, -114.235, 38.23);
     flyToRectangle(rectangle);
     */
    flyToRectangle:function(rectangle){
        //地图范围跳转
        this.cesiumViewer.camera.flyTo({
            destination : Cesium.Rectangle.fromDegrees(rectangle.west, rectangle.south, rectangle.east, rectangle.north)
        });
    },
    /**
     * 隐藏图层控制器
     * @method hide3DLayers
     * @param
     * @return
     */
    hide3DLayers: function () {
        var layer= document.getElementById("layersButton");
        if (layer) {
            layer.style.display = "none";
        }
    },
    /**
     * 显示图层控制器
     * @method show3DLayers
     * @param  layersconfig 图层控制器数据源
     * @return
     */
    show3DLayers: function (layersconfig) {
        var cesium = this;
        if(!cesium.isLoad3DLayers){
            cesium.isLoad3DLayers = showLayersView();
        }
        //显示图层控制器
        function showLayersView(){
            cesium.layer3DList=[];
            this.treeObj = null;
            //加载图层目录树
            InitTree();
            return true;
        }
        //初始化图层目录树
        function InitTree(){
            var setting = {
                check: {
                    enable: true
                },
                data: {
                    simpleData: {
                        enable: true
                    }
                },
                callback: {
                    onCheck: function (e, treeId, treeNode) {
                        if (treeNode.checked) {//勾选状态下,显示地图控件
                            if (treeNode.children) { //勾选专题目录
                                for (var i = 0; i < treeNode.children.length; i++) {
                                	if(treeNode.children[i].children){
                                		var curnode = treeNode.children[i];
                                		for(var j = 0; j < curnode.children.length; j++){
                                    		loadServerTypeMap(curnode.children[j].position,curnode.children[j].id, curnode.children[j].type, curnode.children[j].layerurl, curnode.children[j].layerid, curnode.children[j].proxyUrl,curnode.children[j].IsWebMercatorTilingScheme);                                   			
                                		}                            		
                                	}else{
                                        loadServerTypeMap(treeNode.children[i].position,treeNode.children[i].id, treeNode.children[i].type, treeNode.children[i].layerurl, treeNode.children[i].layerid, treeNode.children[i].proxyUrl,treeNode.children[i].IsWebMercatorTilingScheme);
                                	}
                                    //loadServerTypeMap(treeNode.children[i].position,treeNode.children[i].id, treeNode.children[i].type, treeNode.children[i].layerurl, treeNode.children[i].layerid, treeNode.children[i].proxyUrl,treeNode.children[i].IsWebMercatorTilingScheme);
                                }
                            }
                            else {//勾选叶节点
                                loadServerTypeMap(treeNode.position,treeNode.id, treeNode.type, treeNode.layerurl, treeNode.layerid, treeNode.proxyUrl,treeNode.IsWebMercatorTilingScheme);

                            }
                        }
                        else { //去掉勾选框,隐藏地图控件
                            if (treeNode.children) { //专题目录
                                for (var i = 0; i < treeNode.children.length; i++) {
                                	if(treeNode.children[i].children){
                                		var curnode = treeNode.children[i];
                                		for(var j = 0; j < curnode.children.length; j++){
                                			deleteServerTypeMap(curnode.children[j].id);                                   			
                                		}                            		
                                	}else{
                                		deleteServerTypeMap(treeNode.children[i].id);
                                	}
                                    //deleteServerTypeMap(treeNode.children[i].id);
                                }
                            }
                            else {//叶节点
                                deleteServerTypeMap(treeNode.id);
                            }
                        }
                    }
                }
            };
            var ztreeRoleAuth = $("#ztreeThemeServerOfLayer");
            var ztree = $.fn.zTree.init(ztreeRoleAuth, setting, layersconfig);
            this.treeObj = $.fn.zTree.getZTreeObj("ztreeThemeServerOfLayer");
            this.treeObj.expandAll(true);
            //加载已经勾选的图层
            var nodes = this.treeObj.getCheckedNodes(true);
            if(nodes.length>0){
                for(var i=0;i<nodes.length;i++){
                    if(!nodes[i].isParent){//节点图层
                        loadServerTypeMap(nodes[i].id, nodes[i].type, nodes[i].layerurl, nodes[i].layerid, nodes[i].proxyUrl,nodes[i].IsWebMercatorTilingScheme);
                    }
                }
            }
        }
        /**
         * 删除指定ID的图层
         */
        function deleteServerTypeMap(id){
            switch(typeof(id))
            {
                case "number":
                    if(cesium.layer3DList.length>0){
                        for(var i=0;i<cesium.layer3DList.length;i++){
                            if(cesium.layer3DList[i].id == id){
                                cesium.cesiumViewer.scene.imageryLayers.remove(cesium.layer3DList[i].layer);
                            }
                        }
                    }
                    break;
                case "string":
                    var len = cesium.cesiumViewer.dataSources.length;
                    if(len>0){
                        for(var i=0;i<len;i++){
                            var dataSource = cesium.cesiumViewer.dataSources.get(i);
                            if(dataSource._name && dataSource._name == id){
                                cesium.cesiumViewer.dataSources.remove(dataSource);
                            }
                        }
                    }
                    break;
                case "undefined":
                    break;
            }
        }
        /**
         * 加载不同类型地图服务的底图
         @ position
         @ id 图层的id标识
         @ servertype 地图服务类型(0代表ArcGisMapServerImageryProvider;1代表createOpenStreetMapImageryProvider;
         2代表WebMapTileServiceImageryProvider;3代表createTileMapServiceImageryProvider;
         4 代表UrlTemplateImageryProvider;5 代表WebMapServiceImageryProviderr(WMS))
         @ url 地图服务的url
         @ layerid 地图图层的id
         @ proxyUrl 代理请求url
         @ tilingScheme 地图坐标系,WebMercatorTilingScheme(摩卡托投影坐标系3857);GeographicTilingScheme(世界地理坐标系4326)
         */
        function loadServerTypeMap(position, id, servertype, url, layerid, proxyUrl,IsWebMercatorTilingScheme){
            //跳转位置
        	cesium.flyToPosition(position);
            
            var layers = cesium.cesiumViewer.scene.imageryLayers;
            var layer = null;
            switch (servertype) {
                case 0://ArcGisMapServerImageryProvider
                    var curlayer = layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
                        proxy : new Cesium.DefaultProxy(proxyUrl),
                        url : url,
                        layers:layerid,
                        enablePickFeatures : false
                    }));
                    layer = {layer:curlayer,id:id};
                    break;
                case 1://OpenStreetMapImageryProvider
                    var curlayer = layers.addImageryProvider(Cesium.createOpenStreetMapImageryProvider({
                        url : url
                    }));
                    layer = {layer:curlayer,id:id};
                    break;
                case 2://WebMapTileServiceImageryProvider
                    break;
                case 3://createTileMapServiceImageryProvider
                    break;
                case 4://UrlTemplateImageryProvider
                    break;
                case 5://WebMapServiceImageryProvider
                    var m_tilingScheme = new Cesium.GeographicTilingScheme();
                    if(IsWebMercatorTilingScheme){
                        m_tilingScheme = new Cesium.WebMercatorTilingScheme();
                    }
                    var curlayer = layers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
                        url: url,
                        layers: layerid,
                        //tilingScheme:tilingScheme,
                        tilingScheme:m_tilingScheme,
                        parameters : {
                            service:"WMS",
                            version:"1.1.1",
                            request:"GetMap",
                            transparent : true,
                            format : 'image/png'
                        },
                        show: false
                    }));
                    layer = {layer:curlayer,id:id};
                    break;
                case 6://kml,kmz
                    var options = {
                        camera : cesium.cesiumViewer.scene.camera,
                        canvas : cesium.cesiumViewer.scene.canvas
                    };
                    cesium.cesiumViewer.dataSources.add(Cesium.KmlDataSource.load(url, options)).then(function(dataSource){
                        cesium.cesiumViewer.camera.flyHome();
                    });
                    break;
                case 7://geoJson
                    /*var options = {
                        camera : cesium.cesiumViewer.scene.camera,
                        canvas : cesium.cesiumViewer.scene.canvas
                    };
                    cesium.cesiumViewer.dataSources.add(Cesium.KmlDataSource.load(url, options)).then(function(dataSource){
                        cesium.cesiumViewer.camera.flyHome();
                    });*/
                    /*var dataSource = Cesium.GeoJsonDataSource.load('../../../../Apps/SampleData/simplestyles.geojson');
                    viewer.dataSources.add(dataSource);
                    viewer.zoomTo(dataSource);*/
                    cesium.cesiumViewer.dataSources.add(Cesium.GeoJsonDataSource.load(url)).then(function(dataSource){
                        cesium.cesiumViewer.zoomTo(dataSource);
                    });
                    break;
                default://ArcGisMapServerImageryProvider
                    var curlayer = layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
                        proxy : new Cesium.DefaultProxy(proxyUrl),
                        url : url,
                        layers:layerid,
                        enablePickFeatures : false
                    }));
                    layer = {layer:curlayer,id:id};
                    break;
            }
            if(layer)
                cesium.layer3DList.push(layer);
        }

    },
    /**
     * 显示地图热点定位器
     * @method show3DLocator
     * @param  obj
     * @return none
     */
    show3DLocator: function (obj) {
        var cesium = this;
        if(!cesium.isLoadLocation){
            cesium.isLoadLocation = showView();
        }
        function showView(){
            //读取配置文件,动态创建地图热点定位器菜单
            $(".pub_syn_rt3D").empty();
            var content = "";
            if(obj && obj.models.length>0){
                for(var i=0;i<obj.models.length;i++){
                    content += "<a href='javascript:void(0)' name='"+obj.models[i].name+"' id='"+i+"'>"+obj.models[i].name+"</a>";
                }
            }
            $(".pub_syn_rt3D").append(content);
            //获取所有的定位名称a并且绑定click事件
            $(".syn_location3D").find("a").bind("click", function () {
                var keyword = $(this).attr("name");
                var num = $(this).attr("id");
                num = parseInt(num);
                var pointXY = obj.models[num].location;
                //添加热点定位图标
                cesium.removeEntitiesByKeyWord("location");
                //var id = "location"+Math.random().toString(36).substr(2);
                cesium.flyToPoint(pointXY[0], pointXY[1], 3000);
                var symbols=[];
                var objLocations ={
                    id:obj.models[num].id,
                    name:obj.models[num].name,
                    type:obj.type,
                    position:Cesium.Cartesian3.fromDegrees(pointXY[0],pointXY[1]),
                    url:obj.url,
                    description:"",
                    width:obj.width,
                    height:obj.height
                };
                symbols.push(objLocations);
                cesium.addPictureMarkerSymbols(symbols);

            });
            return true;
        }
    },
    /**
     * 显示地图热点定位器
     * @method load3DLocator
     * @param  obj
     * @return none
     */
    load3DLocator: function (obj) {
        var cesium = this;
        if ($("#viewDiv").length >0) {
            closeView();
        } else {
            showView();
        }
        function showView(){
            //创建地图热点定位器窗口模板内容
            var locationWin = '<div class="syn_tit3D"><span>热点定位器</span><div id="viewHtmlClose" class="closeButton3D"></div></div>';
            locationWin +='<div class="syn_con3D"><div class="pub_syn3D"><div class="pub_syn_rt3D"></div></div></div>';
            var div;
            if ($("#viewDiv").length > 0) {
                div = $("#viewDiv");
            } else {
                div = document.createElement("div");
                div.className = "syn_location3D";
                div.id = "viewDiv";
            }
            if (div.innerHTML != "") {
                document.body.removeChild(div);
            }
            div.innerHTML = locationWin;
            //$(cesium.mapDivId).append(div);
            $("#"+cesium.mapDivId).append(div);
            //document.body.appendChild(div);
            //读取配置文件,动态创建地图热点定位器菜单
            var content = "";
            if(obj && obj.models.length>0){
                for(var i=0;i<obj.models.length;i++){
                    content += "<a href='javascript:void(0)' name='"+obj.models[i].name+"' id='"+i+"'>"+obj.models[i].name+"</a>";
                }
            }
            $(".pub_syn_rt3D").append(content);
            document.getElementById("viewHtmlClose").onclick = function () {
                closeView();
            };
            //获取所有的定位名称a并且绑定click事件
            $(div).find("a").bind("click", function () {
                var keyword = $(this).attr("name");
                var num = $(this).attr("id");
                num = parseInt(num);
                var pointXY = obj.models[num].location;
                //添加热点定位图标
                cesium.removeEntitiesByKeyWord("location");
                //var id = "location"+Math.random().toString(36).substr(2);
                cesium.flyToPoint(pointXY[0], pointXY[1], 3000);
                var symbols=[];
                var objLocations ={
                    id:obj.models[num].id,
                    name:obj.models[num].name,
                    type:obj.type,
                    position:Cesium.Cartesian3.fromDegrees(pointXY[0],pointXY[1]),
                    url:obj.url,
                    description:"",
                    width:obj.width,
                    height:obj.height
                };
                symbols.push(objLocations);
                cesium.addPictureMarkerSymbols(symbols);

            });
        }
        function closeView(){
            $("#viewDiv").remove();
            $('#trackPopUp').hide();//隐藏气泡窗口
            cesium.removeEntitiesByKeyWord("location");
        }
    },
    /**
     * 隐藏地图热点定位器
     * @method hide3DLocator
     * @param
     * @return
     */
    hide3DLocator: function () {
        var location = document.getElementById("locationButton");
        if (location) {
            location.style.display = "none";
        }
    },
    /**
     * 显示地图卷帘
     * @method showCesiumSlider
     * @param
     * @return
     */
    showCesiumSlider: function (index) {
        var viewer = this.cesiumViewer;
        var cesiumSlider = document.getElementById("cesiumSlider");
        if (cesiumSlider) {
            cesiumSlider.style.display = "block";
            this.showLayerByID("sliderMap");
        }else{
            //创建地图卷帘菜单
            var html='<div id="cesiumSlider"></div>'
            $(".cesium-viewer").append(html);
            $("#cesiumSlider").css("display", "block");
            //
            //var layers = T.cesiumViewer.scene.imageryLayers;
            //curlayer = layers.addImageryProvider(T.returnProviderViewModel(MapConfig.mapInitParams.imageryViewModels[data.id]));
            //
            var layers = viewer.imageryLayers;
            // var sliderLayer = layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
            //     url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
            // }));
            var sliderLayer = layers.addImageryProvider(this.returnProviderViewModel(MapConfig.mapInitParams.imageryViewModels[index]));
            sliderLayer.splitDirection = Cesium.ImagerySplitDirection.LEFT; // Only show to the left of the slider
            this.cesiumLayerList.push({layer:sliderLayer,id:"sliderMap"});
            // Sync the position of the slider with the split position
            var slider = document.getElementById('cesiumSlider');
            viewer.scene.imagerySplitPosition = (slider.offsetLeft) / slider.parentElement.offsetWidth;
            var handler = new Cesium.ScreenSpaceEventHandler(slider);
            var moveActive = false;
            function move(movement) {
                if(!moveActive) {
                    return;
                }
                var relativeOffset = movement.endPosition.x ;
                var splitPosition = (slider.offsetLeft + relativeOffset) / slider.parentElement.offsetWidth;
                slider.style.left = 100.0 * splitPosition + '%';
                viewer.scene.imagerySplitPosition = splitPosition;
            }
            handler.setInputAction(function() {
                moveActive = true;
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
            handler.setInputAction(function() {
                moveActive = true;
            }, Cesium.ScreenSpaceEventType.PINCH_START);
            handler.setInputAction(move, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.setInputAction(move, Cesium.ScreenSpaceEventType.PINCH_MOVE);
            handler.setInputAction(function() {
                moveActive = false;
            }, Cesium.ScreenSpaceEventType.LEFT_UP);
            handler.setInputAction(function() {
                moveActive = false;
            }, Cesium.ScreenSpaceEventType.PINCH_END);
        }
    },
    /**
     * 隐藏地图卷帘
     * @method hideCesiumSlider
     * @param
     * @return
     */
    hideCesiumSlider: function () {
        var cesiumSlider = document.getElementById("cesiumSlider");
        if (cesiumSlider) {
            cesiumSlider.style.display = "none";
            this.hideLayerByID("sliderMap");
        }
    },
    /**
     * 删除id包括指定关键字的Entity
     * @method removeEntitiesByIds
     * @param  keyword 关键字
     * @return
     */
    removeEntitiesByKeyWord:function(keyword){
        var entities = this.cesiumViewer.entities._entities._array;
        if(entities.length>0){
            for(var i=0;i<entities.length;i++){
                if(entities[i].id.indexOf(keyword)!=-1){
                    this.cesiumViewer.entities.remove(entities[i]);
                }
            }
        }
    },
    /**
     * 删除指定id的底图
     * @method removeLayerByID
     * @param  id
     * @return
     */
    removeLayerByID:function(id){
        if(this.cesiumLayerList.length>0){
            for(var i=0;i<this.cesiumLayerList.length;i++){
                if(this.cesiumLayerList[i].id == id){
                    this.cesiumViewer.scene.imageryLayers.remove(this.cesiumLayerList[i].layer);
                }
            }
        }
    },
    /**
     * 显示指定id的底图
     * @method showLayerByID
     * @param  id
     * @return
     */
    showLayerByID:function(id){
        if(this.cesiumLayerList.length>0){
            for(var i=0;i<this.cesiumLayerList.length;i++){
                if(this.cesiumLayerList[i].id == id){
                    this.cesiumLayerList[i].layer.show = true;
                }
            }
        }
    },
    /**
     * 隐藏指定id的底图
     * @method hideLayerByID
     * @param  id
     * @return
     */
    hideLayerByID:function(id){
        if(this.cesiumLayerList.length>0){
            for(var i=0;i<this.cesiumLayerList.length;i++){
                if(this.cesiumLayerList[i].id == id){
                    this.cesiumLayerList[i].layer.show = false;
                }
            }
        }
    },
	/**
     * 清空地图绘制要素
     * @method removeEntitiesByIds
     * @return
     */
    clearMap:function(){
        var T = this;
        $('#trackPopUp').hide();
        $(".cesium-selection-wrapper").hide();
        T.removeEntitiesByKeyWord("location");
        T.cesiumViewer.entities.removeAll();//清空所有模型
        var primitives = T.cesiumViewer.scene.primitives._primitives;
        var length = primitives.length;
        var m_primitives = [];
        for (var i = 0; i < length ; ++i) {
            var p = primitives[i];
            if(p && p._billboards && p._billboards.length>0){
                m_primitives.push(p);
            }
            /*else if(p && p._billboardCollection && p._billboardCollection._billboards && p._billboardCollection._billboards.length>0){
                m_primitives.push(p);
            }*/
            else if(p && p._labels && p._labels.length>0){
                m_primitives.push(p);
            }
        }
        if(m_primitives.length>0){
            for(var j=0;j<m_primitives.length;j++){
                var p = m_primitives[j];
                T.cesiumViewer.scene.primitives.remove(p);
            }
        }
    },
    /**
     * 飞行漫游路径
     * @method showFly3DPaths
     * @param  pathsData 飞行路径信息,格式如下:{"orientation":{"heading":2.411783930363565,"pitch":-0.21097267398444197,"roll":0.0015622392231300353},"position": {"x":-2206260.239730831,"y":5510911.392077349,"z":2331987.10863007}, "geometry":{"type": "LineString", "coordinates": [[101.80089882736969, 26.60700234866561], [101.80082205161088, 26.607156056057718]]} }
     * @param  position 飞行路径跳转位置
     * @return
     */
    showFly3DPaths:function(pathsData){
        var T = this;
        this.clearFly3DPaths();
        //$('.cesium-viewer-animationContainer').show();
        /*T.cesiumViewer.camera.flyTo({
            destination: pathsData.position,
            //orientation: {
                //heading: Cesium.Math.toRadians(0),
                //pitch: Cesium.Math.toRadians(-60),
                //roll: 0.0
            //},
            orientation:pathsData.orientation,
            complete: function () {
                // 到达位置后执行的回调函数
                executeFly3D();
            },
            duration: 3
        });*/
        T.cesiumViewer.camera.setView({
            destination : pathsData.position,
            orientation: pathsData.orientation,
        });
        setTimeout(function () {
            executeFly3D();
        }, 200);
        function executeFly3D() {
            if(pathsData && pathsData.geometry){
                var positionA = pathsData.geometry.coordinates;
                var position = [];
                if(positionA.length>0){
                    for (var i = 0; i < positionA.length; i++) {
                        var x = positionA[i][0];
                        var y = positionA[i][1];
                        position.push({ x: x, y: y });
                    }
                }else{
                    return;
                }
                function computeCirclularFlight() {
                    var property = new Cesium.SampledPositionProperty();
                    for (var i = 0; i < position.length; i++) {
                        if (i == 0) {
                            var time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
                            //var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 1170);
                            var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 0);
                            property.addSample(time, _position);
                        }
                        if (i < 10000 && i > 0) {
                            var position_a = new Cesium.Cartesian3(property._property._values[i * 3 - 3], property._property._values[i * 3 - 2], property._property._values[i * 3 - 1]);
                            if (i < 976) {
                                //var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 1170);
                                var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 0);
                            }
                            else if (i > 975 && i < 986) {
                                //var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 1170 + 20 * (i - 980));
                                var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 0);
                            }
                            else if (i > 985) {
                                //var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 1170 + 200);
                                var _position = Cesium.Cartesian3.fromDegrees(position[i].x, position[i].y, 0);
                            }

                            var positions = [Cesium.Ellipsoid.WGS84.cartesianToCartographic(position_a), Cesium.Ellipsoid.WGS84.cartesianToCartographic(_position)];
                            var a = new Cesium.EllipsoidGeodesic(positions[0], positions[1]);
                            var long = a.surfaceDistance;
                            var _time = long/50;
                            var time = Cesium.JulianDate.addSeconds(property._property._times[i - 1], _time, new Cesium.JulianDate());

                            property.addSample(time, _position);
                        }
                    }
                    /*property.setInterpolationOptions({
                       interpolationDegree: 5,
                       interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
                    });*/
                    //console.log(property._property._values);
                    //console.log(property);
                    return property;
                }
                var start = Cesium.JulianDate.fromDate(new Date(2018, 3, 15, 16));
                var stop = Cesium.JulianDate.addSeconds(start, 30000, new Cesium.JulianDate());

                //Make sure viewer is at the desired time.
                T.cesiumViewer.clock.startTime = start.clone();
                T.cesiumViewer.clock.stopTime = stop.clone();
                T.cesiumViewer.clock.currentTime = start.clone();
                T.cesiumViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
                //T.cesiumViewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED; //
                //T.cesiumViewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK; //
                //T.cesiumViewer.clock.multiplier = 10;//值越大，飞行越快
                T.cesiumViewer.clock.multiplier = 0.6;
                T.cesiumViewer.clock.canAnimate = false;
                T.cesiumViewer.clock.shouldAnimate = true;//设置时间轴动态效果

                var _position = computeCirclularFlight();

                T.entityFly = T.cesiumViewer.entities.add({
                    //Set the entity availability to the same interval as the simulation time.
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: start,
                        stop: stop
                    })]),
                    position: _position,
                    orientation: new Cesium.VelocityOrientationProperty(_position),
                    /*model: {
                        uri:GLOBAL.domainResource+"/gis/cesium/SampleData/models/CesiumAir/Cesium_Air.gltf",
                        scale: 6,
                        minimumPixelSize: 64,
                        //heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                    },*/
                    point:{
                        color:Cesium.Color.RED,
                        outlineColor:Cesium.Color.WHITE,
                        outlineWidth:2,
                        pixelSize:15,
                    },
                    //Show the path as a pink line sampled in 1 second increments.
                    path: {
                        resolution: 1,
                        material: new Cesium.PolylineGlowMaterialProperty({
                            glowPower: 0.1,
                            color: Cesium.Color.YELLOW
                        }),
                        //width: 30
                        width: 10
                    }
                });
                T.cesiumViewer.trackedEntity = T.entityFly;
                setTimeout(function () {
                    T.cesiumViewer.camera.zoomOut(500.0);//缩小地图，避免底图没有数据
                }, 100);
            }else{
                return;
            }
        }
    },
    /**
     * 清空漫游路径
     * @method stopFly3DPaths
     * @param
     * @return
     */
    clearFly3DPaths:function(){
        this.cesiumViewer.trackedEntity = undefined;
        bxmap.FlyCesium.isDrawFly = false;
        this.cesiumViewer.entities.removeAll();//清空所有模型
        //清空绘制飞行路线
        if(this.drawPolyline){
            this.cesiumViewer.scene.primitives.remove(this.drawPolyline);
            this.drawPolyline = null;
        }
    },
    /**
     * 退出飞行漫游路径
     * @method stopFly3DPaths
     * @param
     * @return
     */
    stopFly3DPaths:function(){
        var start = Cesium.JulianDate.fromDate(new Date());
        this.cesiumViewer.clock.startTime = start.clone();
        var stop = Cesium.JulianDate.addSeconds(start, 300000000, new Cesium.JulianDate());
        this.cesiumViewer.clock.stopTime = stop.clone();
        //this.cesiumViewer.entities.remove(this.entityFly);
        this.flyToRectangle(this.initExtent);
        this.clearFly3DPaths();
        bxmap.FlyCesium.draw3DObj = null;
    },
    /**
     * 暂停飞行漫游路径
     * @method pauseFly3DPaths
     * @return
     */
    pauseFly3DPaths:function(){
        var clockViewModel = this.cesiumViewer.clockViewModel;
        if (clockViewModel.shouldAnimate) {
            clockViewModel.shouldAnimate = false;
        } else if (this.cesiumViewer.clockViewModel.canAnimate) {
            clockViewModel.shouldAnimate = true;
        }
    },
    /**
     * 向前飞行漫游路径
     * @method playForwardFly3DPaths
     * @return
     */
    playForwardFly3DPaths:function(){
        var clockViewModel = this.cesiumViewer.clockViewModel;
        var multiplier = clockViewModel.multiplier;
        if (multiplier < 0) {
            clockViewModel.multiplier = -multiplier;
        }
        clockViewModel.shouldAnimate = true;
    },
    /**
     * 向后飞行漫游路径
     * @method playForwardFly3DPaths
     * @return
     */
    playReverseFly3DPaths:function(){
        var clockViewModel = this.cesiumViewer.clockViewModel;
        var multiplier = clockViewModel.multiplier;
        if (multiplier > 0) {
            clockViewModel.multiplier = -multiplier;
        }
        clockViewModel.shouldAnimate = true;
    },
    /**
     * 设定飞行漫游路径
     * @method DrawFly3DPaths
     * @return
     */
    DrawFly3DPaths:function(drawHelper){
        var T = this;
        this.clearFly3DPaths();
        drawHelper.startDrawingPolyline({
            callback: function(positions) {
                T.drawPolyline = new DrawHelper.PolylinePrimitive({
                    positions: positions,
                    width: 5,
                    type:"plot",
                    geodesic: true
                });
                T.cesiumViewer.scene.primitives.add(T.drawPolyline);
                T.drawPolyline.setEditable();
                //构造设定路线的返回信息
                var coordinates =[];
                var position = null;
                var heading = null;
                var pitch = null;
                var roll = null;
                for(var i= 0;i<positions.length;i++){
                    var cartographic = Cesium.Cartographic.fromCartesian(positions[i]);//世界坐标转地理坐标（弧度）
                    var point=[ cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180];//地理坐标（弧度）转经纬度坐标
                    //console.log(point);
                    coordinates.push(point);
                }
                //orientation":{"heading":2.411783930363565,"pitch":-0.21097267398444197,"roll":0.0015622392231300353},"position": {"x":-2206260.239730831,"y":5510911.392077349,"z":2331987.10863007},
                position = drawHelper._cameraPosition;
                heading = drawHelper._cameraHeading;
                pitch = drawHelper._cameraPitch;
                roll = drawHelper._cameraRoll;
                var pathsData = {"orientation":{"heading":heading,"pitch":pitch,"roll":roll},"position": position,"geometry": { "type": "LineString","coordinates":coordinates}};
                if(bxmap.FlyCesium){
                    bxmap.FlyCesium.draw3DObj = T.draw3DObj  = pathsData;
                    bxmap.FlyCesium.isDrawFly = true;
                }
                //return T.draw3DObj;

            }
        });
    },




});

/*
自定义加载天地图服务类TDTWMTSImageProvider*/
var TDTWMTSImageProvider = function TDTWMTSImageProvider(urlformat, addone, minlevel, maxlevel, description, leveldiv, urlformat2) {
    var defaultCredit = new Cesium.Credit('WMTS');
    description = Cesium.defaultValue(description, {});
    this._7 = new Cesium.GeographicTilingScheme({
        numberOfLevelZeroTilesX: 2,
        numberOfLevelZeroTilesY: 1
    });
    this._3 = 256;
    this._4 = 256;
    this._10 = Cesium.defaultValue(description.fileExtension, 'jpg');
    this._9 = description.proxy;
    this._12 = description.tileDiscardPolicy;
    this._2 = minlevel;
    this._1 = maxlevel;
    this._8 = new Cesium.Rectangle(0 - Math.PI, 0 - Math.PI / 2, Math.PI, Math.PI / 2);
    this._5 = new Cesium.Rectangle(0 - Math.PI, 0 - Math.PI / 2, Math.PI, Math.PI / 2);
    this._6 = true;
    this.baseurl = urlformat;
    this.needaddone = addone;
    if (leveldiv) {
        this._0 = leveldiv;
        this.baseurl2 = urlformat2
    }
    var credit = Cesium.defaultValue(description.credit, defaultCredit);
    if (typeof credit === 'string') {
        credit = new Cesium.Credit(credit)
    }
    this._11 = credit
};
Cesium.defineProperties(TDTWMTSImageProvider.prototype, {
    tileWidth: {
        get: function () {
            return this._3
        }
    },
    tileHeight: {
        get: function () {
            return this._4
        }
    },
    defaultAlpha: {
        get: function () {
            return 1
        }
    },
    hasAlphaChannel: {
        get: function () {
            return true
        }
    },
    maximumLevel: {
        get: function () {
            return this._1
        }
    },
    minimumLevel: {
        get: function () {
            return this._2
        }
    },
    tilingScheme: {
        get: function () {
            return this._7
        }
    },
    extent: {
        get: function () {
            return this._8
        }
    },
    rectangle: {
        get: function () {
            return this._5
        }
    },
    ready: {
        get: function () {
            return this._6
        }
    },
    minimumTerrainLevel: {
        get: function () {
            return 0
        }
    },
    maximumTerrainLevel: {
        get: function () {
            return 17
        }
    }
});
TDTWMTSImageProvider.prototype.requestImage = function (x, y, level) {
    if (this.needaddone) {
        x += 1;
        y += 1;
        level += 1
    }
    var tempurl = this.baseurl;
    if (this._0) if (level > this._0) tempurl = this.baseurl2;
    var url = tempurl.replace("{x}", x);
    url = url.replace("{l}", y % 8);
    url = url.replace("{y}", y);
    url = url.replace("{z}", level + 1);
    return Cesium.ImageryProvider.loadImage(this, url)
};
