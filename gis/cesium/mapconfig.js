/* --------------------------------地图初始信息配置-------------------------------- */
function MapConfig() { }
/*!
 *三维部分配置文件
 *cesium
 */
MapConfig.mapInitParams = {
        extent: {//初始化范围
            xmin: 112.2720152869,
            ymin: 37.692958923,
            xmax: 112.3061148297,
            ymax: 37.7139097655
        },
        spatialReference: {//地图空间参考坐标系
	        wkid: 4326   //EPSG:4326(WGS84) EPSG:3857(Pseudo-Mercator) 伪墨卡托投影
	    },
	    /*备注说明:配置底图列表
	     *type代表地图服务类型(0代表ArcGisMapServerImageryProvider;1代表createOpenStreetMapImageryProvider;
	                     2代表WebMapTileServiceImageryProvider;3代表createTileMapServiceImageryProvider;
	                     4 代表UrlTemplateImageryProvider;5 代表WebMapServiceImageryProviderr)
	     *proxyUrl代理请求服务
	     *iconUrl图标
	     *name显示名称
	     *Url地图Url
	     */
         imageryViewModels:[
                           {"id":0,"label":"影像图",className:"imgType",type:0,proxyUrl:'',Url:'http://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'},
                           {"id":1,"label":"街道图",className:"vecType",type:0,proxyUrl:'',Url:'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer'},
                           {"id":2,"label":"WMS",className:"imgType",type:5,proxyUrl:'',Url:'http://192.168.31.81:8180/geoserver/gwc/service/wms',credit:'wms服务',layers: 'worldMap'},
                           {"id":3,"label":"OSM",className:"vecType",type:1,proxyUrl:'',Url:'https://a.tile.openstreetmap.org/'},
                           {"id":4,"label":"天地街道",className:"vecType",type:2,proxyUrl:'',Url:'http://t{l}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=tiles&tk=7786923a385369346d56b966bb6ad62f',layer: 'tdtVecBasicLayer',style: 'default',format: 'image/jpeg',tileMatrixSetID:'tdtMap'},
                           {"id":5,"label":"天地影像",className:"imgType",type:2,proxyUrl:'',Url:'http://t{l}.tianditu.gov.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=tiles&tk=7786923a385369346d56b966bb6ad62f',layer: 'tdtImgBasicLayer',style: 'default',format: 'image/jpeg',tileMatrixSetID:'tdtMap'},
        ],
	    
}
//Cesium动态叠加createWorldTerrain地形图,针对cesium 1.52版本api
//MapConfig.terrainObj = {type:"createWorldTerrain",requestWaterMask:false,requestVertexNormals:false,proxyUrl:""};//在线地形
MapConfig.terrainObj = {type:"CesiumTerrainProvider",url:"http://192.168.31.81:8180/cesium/worldTerrain",requestWaterMask:false,requestVertexNormals:false,proxyUrl:""};//离线地形
/*地图图层菜单目录构造*/
/*
 *name-图层名称
 *layerurl-图层服务配置
 *type代表地图服务类型:
 0代表ArcGisMapServerImageryProvider;
 1代表createOpenStreetMapImageryProvider;
 2代表WebMapTileServiceImageryProvider;
 3代表createTileMapServiceImageryProvider;
 4 代表UrlTemplateImageryProvider;
 5 代表WebMapServiceImageryProviderr(WMS);
 6 代表kml,kmz;
 7 代表geoJson;
 *layerid-图层id
 */
MapConfig.Layers = [
    { id: 1, pId: 0, name: "全球地理信息数据服务",checked:false },
    { id: 2, pId: 1, name: "基础空间数据",checked:false },
    {
        id: 11,
        pId: 2,
        name: "视频",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_SP",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    {
        id: 12,
        pId: 2,
        name: "港路",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_DL",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    
    {
        id: 13,
        pId: 2,
        name: "岸线",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_HAX",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    {
        id: 14,
        pId: 2,
        name: "泊位",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_BW",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    
    {
        id: 15,
        pId: 2,
        name: "码头",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_MT",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    {
        id: 16,
        pId: 2,
        name: "港池",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_GC",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    
    {
        id: 17,
        pId: 2,
        name: "护岸",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_HA",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    },
    {
        id: 18,
        pId: 2,
        name: "防波堤",//WMS-T
        layerurl: "http://192.168.31.81:8180/geoserver/gwc/service/wms",
        layerid: "YJZPSYS:YJ_ZPYG_FBD",
        position:Cesium.Cartesian3.fromDegrees(111.825662, 21.581396,3000),//图层定位位置,经纬度以及高度
        IsWebMercatorTilingScheme:true,//是否创建摩卡托投影坐标系,默认是地理坐标系
        type: 5,
        checked: false
    }
];
//配置热点定位信息
MapConfig.locations= {
    url:GLOBAL.domainResource+"/gis/cesium/images/red.png",
    width:26,
    height:48,
    type: "infoWindow",
    models: [
        {id: "location_1",  name: "小回沟煤业办公楼", location: [112.297872,37.712038]},
        {id: "location_2",  name: "小回沟煤业公司", location: [112.302931,37.708495]},
        {id: "location_3",  name: "清徐县人民政府", location: [112.365783,37.614585]}
    ]
};
/*三维倾斜摄影配置信息*/
MapConfig.Tiles3D = {
    url:"http://192.168.31.81:8180/cesium/3DModel/test/3Dtiles/xhg/tileset.json"
};
/*三维模型gltf配置信息*/
MapConfig.Obj3D = {
    position:Cesium.Cartesian3.fromDegrees(111.828682, 21.579571,3000),//阳江闸坡
    models:[
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object02.gltf"
        },       
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object03.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object05.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object06.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object07.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object08.gltf"
            //uri :"192.168.3.203/3DModel/test/gltf_zapo/BJ_JZW_PHDC_20.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object09.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object10.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object11.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Object12.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/Plane01.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_DB_01.gltf"
            //uri :"192.168.3.203/3DModel/test/gltf_zapo/BJ_JZW_PHDC_20.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_DB_02.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_DB_03.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_DB_04.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_DB_05.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_GX_01.gltf"
            //uri :"192.168.3.203/3DModel/test/gltf_zapo/BJ_JZW_PHDC_20.gltf"
        },
        
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_JZ_18.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_JZ_19.gltf"
        },     
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_JZ_21.gltf"
        }, 
           
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_LH_01.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_LH_02.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_LH_03.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_LH_04.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_LH_05.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_MT_01.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_01.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_02.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_03.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_04.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_05.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_06.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_07.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_08.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_09.gltf"
        },
        
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_10.gltf"
        },
        {
            id:"3D_gltf",
            name : "测试3D模型",
            position : Cesium.Cartesian3.fromDegrees(111.828682, 21.579571),
            uri :"http://192.168.31.81:8180/cesium/3DModel/test/gltf_zapo/ZP_YG_11.gltf"
        }
       
    ]
};
