define(function (require, exports, module) {
    // video 默认不显示
    $("#trailer").css("display","none");
    $("#trailer").css("z-index","-112"); 
    $(".menu-list .first-menu").click(function(){
        $(this).addClass("active").siblings().removeClass("active");
        if(!$(".window-left").hasClass('fold')){
            $(this).find("ul").slideToggle(500);
            $(this).siblings().find("ul").hide();
        }
    })
    $(".menu-list .second-menu").click(function(){
        var $this = $(this);
        $(".second-menu").each(function () {
            if($(this).hasClass("current")){
                $(this).removeClass("current");
            }
        })
        $this.addClass("current").siblings().removeClass("current");
        $this.parents(".first-menu").addClass("active").siblings().removeClass("active")
    })
    /*阻止事件冒泡*/
    $(".menu-list .first-menu ul").bind("click",function(event){
        event.stopPropagation();
    });
    $(".go-back a").click(function () {
        $(".menu-list .first-menu").find("ul").hide();
        //收起状态
        if($(".window-left").hasClass('fold')){
            $(".window-left").animate({width:"200px"},300,'swing');
            $(".window-left").removeClass('fold');
            $("#back").removeClass('iconicon-test').addClass('iconshuangjiantouzuo');
            // 收起之后将右侧的宽度增加
            $("#left").css("width","15%");
            $("#cesiumMap").css("width","85%");
        }else{
            $(".window-left").animate({width:"60px"},300,'swing');
            $(".window-left").addClass('fold');
            $("#back").removeClass('iconshuangjiantouzuo').addClass('iconicon-test');
            $("#left").css("width","5%");
            $("#cesiumMap").css("width","95%");
        }
    })
    
    var Map3d = require('./cesiumap');
    Map3d.init();  	
});