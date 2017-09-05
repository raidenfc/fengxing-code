var ITEMS_LOAD_SWITCH = true; //首页加载更多分页开关
var TIPS_TIMER; //弹窗提示开关
var AJAX_URL = '/'; //ajax地址
var AJAX_time = 10000; //ajax时间
var AJAX_token = { 'X-CSRF-TOKEN' : $('meta[name="csrf-token"]').attr('content') }; //ajax token

$(function(){

    //===================================================公用
    var $body = $('body');
    var url = window.location.href;

    //----------搜索
    $(document).on('focus','.search input',function(){
        var $search = $('.search');
        var $searchTips = $('.search-tips');
        if($searchTips.length <= 0){
            $search.append('<div class="search-tips"><div class="s-header"><div class="s-search"><input type="text" placeholder="请输入商品名称"><div class="search-btn">搜索</div></div><div class="fh">取消</div></div><ul></ul></div>');
            $('.s-header input').focus();
        }
        var str = $(this).val();
        searchTips(str);
    });
    $(document).on('touchmove','.search-tips',function(){
        event.preventDefault();
        return false;
    });
    //提示
    $(document).on('input','.search input',function(){
        var str = $(this).val();
        searchTips(str);
    });

    //关闭搜索提示
    $(document).on('touchstart','.search-tips .fh',function(event){
        event.preventDefault();
        $('.search-tips').remove();
    });

    //点击提示搜索类别
    $(document).on('tap','.search-tips li',function(){
        url = window.location.href;
        var typeId = $(this).attr('data-typeid');

        if(url.indexOf('/list') > -1){
            hotList(1,null,1,null,typeId);
            var $searchTips = $('.search-tips');
            if($searchTips.length > 0){
                $searchTips.remove();
            }
        }else{
            window.location = '/list?type_id=' + typeId;
        }
    });

    //搜索关键字
    $(document).on('tap','.s-search .search-btn',function(event){
        var val = $('.s-search input').val();
        if(val != ''){
            window.location='/list?keyword='+val;
        }
    });
    $(document).on('keyup','.search input',function(event){
        if(event.keyCode === 13){
            var val = $(this).val();
            window.location='/list?keyword='+val;
            /*  hotList(1,null,1,val);
             var $searchTips = $('.search-tips');
             if($searchTips.length > 0){
             $searchTips.remove();
             }*/
        }
    });

    //----------多选按钮
    $(document).on('tap','.checkbox-main .checkbox',function(){
        checkboxFun($(this));
    });

    //----------全选按钮
    $(document).on('tap','.checkbox-all',function(){
        checkboxFun($(this));
    });

    //----------商品数量调整
    //增加
    $(document).on('tap','.buy-num-xm .add',function(){
        cartNum('add',$(this));
    });

    //减少
    $(document).on('tap','.buy-num-xm .cut',function(){
        cartNum('cut',$(this));
    });

    //手动填写
    $(document).on('blur','.buy-num-xm .num input',function(){
        cartNum('mt',$(this));
    });

    //----------购买控件
    $(document).on('tap','.items-box .buy-btn,.items-page-type .change',function(){
        buyBtn($(this));
    });
    $(document).on('touchstart','.add-cart-inner .bg',function(event){
        event.preventDefault();
        $(this).css('opacity','0');
        $('.add-cart-inner .inner').css('transform','translate3d(0,600px,0)');
        setTimeout(function(){
            $('.add-cart-inner').remove();
            $('.items-box').removeClass('select-items-box');
        },400);
    });
    $(document).on('tap','.specs-tag',function(){
        var $specsTag = $(this).parent().find('.specs-tag');
        $specsTag.removeClass('select');
        $(this).addClass('select');
        changeSku();
    });

    //----------点击立即购买
    $(document).on('tap','.add-cart-inner .buy-btn .buy',function(){
        if(!$(this).parent().hasClass('die-btn')){
            var $addCartInner = $(this).parents('.add-cart-inner');
            var $dl = $addCartInner.find('.specs dl');
            var cartInfo = [];
            var html = '';

            cartInfo.push($addCartInner.attr('data-sku_id'));
            cartInfo.push($addCartInner.find('.pic img').attr('src'));
            cartInfo.push($addCartInner.find('.title').text());
            for(var i=0;i<$dl.length;i++){
                html += '<span>' + $dl.eq(i).find('.select').text() + '</span>';
            }
            cartInfo.push(html);
            cartInfo.push($addCartInner.find('.items-price').text());
            cartInfo.push($addCartInner.find('.buy-num-xm .num input').val());

            //选中的信息存入localStorage
            localStorage.setItem("cartInfoTemp", cartInfo.join('$_$').toString());

            //跳转到订单页面
            window.location = '/order/confirm';
        }
    });

    //----------点击添加购物车
    $(document).on('tap','.add-cart-inner .buy-btn .add-cart',function(){
        if(!$(this).parent().hasClass('die-btn')){
            var $addCartInner = $(this).parents('.add-cart-inner');
            var skuId = $addCartInner.attr('data-sku_id');
            var num = $addCartInner.find('.buy-num-xm .num input').val();
            addCart(skuId,num,$addCartInner);
        }
    });

    //----------再次购买
    $(document).on('tap','.purchase',function(){
        var $itemsCartBox = $(this).parents('.items-cart-box');
        var $t = $itemsCartBox.find('.t');

        for(var i=0;i<$t.length;i++){
            var id = $t.eq(i).find('.items-pic').attr('data-id');
            addCart(id,1);
        }

        setTimeout(function(){
            window.location = '/cart';
        },500);
    });

    //----------添加用户地址
    $(document).on('tap','.add-address',function(){
        addAddress();
    });
    $(document).on('tap','.save-address',function(){
        saveAddress($(this).parents('.alert-add-address-inner'));
    });
    $(document).on('tap','.edit-address',function(){
        editAddress($(this).parents('.alert-add-address-inner'));
    });
    $(document).on('tap','.alert-add-address-inner .close,.alert-add-address-inner .bg',function(){
        $('.alert-add-address-inner').remove();
    });


    //===================================================首页
    if($body.hasClass('index')){

        //----------今日推荐
        todayItems(1);

        //----------今日推荐加载更多
        window.onscroll = function(){
            var winHeight = window.innerHeight;
            var domOffsetTop = $(".today-items-inner .loading-inner")[0].getBoundingClientRect().top;

            if(domOffsetTop > 0 && domOffsetTop < winHeight){
                var $itemsList = $('.items-list');
                var page = $itemsList.attr('data-page');
                var totalPage = $itemsList.attr('data-totalpage');
                if(ITEMS_LOAD_SWITCH && (page < totalPage)){
                    todayItems(parseInt(page) + 1);
                }
            }

        };

        //----------首页专卖商品
        zmShop();

        //----------首页焦点图
        headSlide();

        //----------首页专题广告
        brandAds();
    }


    //===================================================购物车
    if($body.hasClass('cart')){

        //----------获取购物车
        getCartList();

        //----------购物车提交
        $(document).on('tap','.cart-bar .btn',function(){
            postCartList();
        });

        //----------删除购物车
        $(document).on('tap','.cart-main .delete-items',function(){
            deleteCart($(this));
        });
    }


    //===================================================收货地址
    if($body.hasClass('address')){

        //----------获取用户地址
        getAddressList();

        //----------删除用户地址
        $(document).on('tap','.address-box .delete-items',function(){
            deleteAddress($(this));
        });

        //----------选择用户地址
        $(document).on('tap','.set-default',function(){
            defaultAddress($(this));
        });
        //地址编辑
        $(document).on('tap','.edit',function(){
            var data=$(this).attr('data');
            showEditAddress(JSON.parse(data));
        });
        $(document).on('tap','.back-btn',function() {
            var url = window.location.href;
            var redirectURL = url.indexOf('redirectURL=') > -1 ? getUrlCs(url, 'redirectURL') : '/order/confirm';
            redirectURL = decodeURIComponent(redirectURL);
            window.location = redirectURL;
        });
    }


    //===================================================用户中心
    if($body.hasClass('acc-center')){

        //----------获取用户信息
        getUserCenterInfo();
    }


    //===================================================全部订单
    if($body.hasClass('order-list')){

        //----------获取订单
        getOrderList(1);

        //----------今日推荐加载更多
        window.onscroll = function(){
            var winHeight = window.innerHeight;
            var domOffsetTop = $(".loading-inner")[0].getBoundingClientRect().top;

            if(domOffsetTop > 0 && domOffsetTop < winHeight){
                var $orderSm = $('.order-sm');
                var page = $orderSm.attr('data-page');
                var totalPage = $orderSm.attr('data-totalpage');
                if(ITEMS_LOAD_SWITCH && (page < totalPage)){
                    getOrderList(parseInt(page) + 1);
                }
            }
        };

        //----------保存商品信息
        $(document).on('tap','.need-evaluation',function(){
            var $t = $(this).parents('.t');
            var goodsName = $t.find('.info dt').text();
            var orderId = $(this).parents('.items-cart-box').attr('data-id');
            var goodsImg = $t.find('.items-pic img').attr('src');
            var goodsId = $t.find('.items-pic').attr('data-id');
            localStorage.setItem('evaluationGoods',goodsName + '?#?' + goodsImg + '?#?' + goodsId + '?#?' + orderId);
            window.location = $(this).attr('data-url');
        });

        //----------取消订单
        $(document).on('tap','.cancel-order',function(){
            if(window.confirm('你确定要取消订单？')){
                cancelOrder($(this));
            }else{
                return false;
            }
        });

        //----------删除订单
        $(document).on('tap','.del-order',function(){
            if(window.confirm('你确定要删除订单？')){
                deleteOrder($(this));
            }else{
                return false;
            }
        });

        //----------确认收货
        $(document).on('tap','.confirm-receipt',function(){
            if(window.confirm('你确定收到商品了？')){
                confirmOrder($(this));
            }else{
                return false;
            }
        });
    }


    //===================================================提交订单
    if($body.hasClass('post-order')){

        //----------获取订单信息
        getOrderPage();

        //----------获取用户默认地址
        getAddressDefault();

        //----------选择优惠卷
        $(document).on('tap','.coupons-inner',function(){
            window.location = '/coupons?redirectURL=' + window.location.href;
        });

        //----------选择收货地址
        $(document).on('tap','.address-inner .address',function(){
            window.location = '/order/address?redirectURL=' + window.location.href;
        });

        //----------创建订单
        $(document).on('tap','.pay-inner .pay-btn',function(){
            addOrderPay();
        });

    }


    //===================================================优惠卷
    if($body.hasClass('coupons')){

        //----------优惠卷TAG切换
        $(document).on('tap','.coupons-nav li',function(){
            var $couponsSm = $('.coupons-sm');
            var index = $(this).index();

            $('.coupons-nav li').removeClass('select');
            $(this).addClass('select');
            $couponsSm.removeClass('select-main');
            $couponsSm.eq(index).addClass('select-main');
        });

        //----------获取待使用优惠卷
        getCouponsUse();

        //----------获取已过期优惠卷
        $(document).on('tap','.coupons-nav .expired',function(){
            getCouponsExpired();
        });

        //----------获取已使用优惠卷
        $(document).on('tap','.coupons-nav .used',function(){
            getCouponsUsed();
        });

        //----------查看优惠卷是否能使用
        $(document).on('tap','.coupons-box',function(){
            if(!$(this).hasClass('expired-coupons')){
                couponsCanUse($(this));
            }
        });

    }


    //===================================================评价
    if($body.hasClass('evaluation')){

        //----------选星星
        $(document).on('tap','.evaluation-star div',function(){
            var index = $(this).index();
            var $evaluationStar = $(this).parents('.evaluation-star');
            $evaluationStar.attr('class','evaluation-star star-' + (index + 1));
            $evaluationStar.attr('data-star',index + 1);
        });

        //----------提交评价
        $(document).on('tap','.evaluation .post-evaluation',function(){
            $(this).html('提交中...');
            $(this).off('tap');
            postEvaluation(this);
        });
        //----------读取商品信息
        var evaluationGoods = localStorage.getItem('evaluationGoods');
        url = window.location.href;
        if(evaluationGoods && url.indexOf('id=') > -1){
            var $evaluationItems = $('.evaluation-items');
            var goodsName = evaluationGoods.split('?#?')[0];
            var goodsImg = evaluationGoods.split('?#?')[1];
            var goodsId = evaluationGoods.split('?#?')[2];
            var orderId = evaluationGoods.split('?#?')[3];
            var urlId = url.indexOf('id=') > -1 ? url.split('id=')[1] : '';

            if(urlId && (urlId === goodsId)){
                $evaluationItems.find('.items-pic').html('<img src="' + goodsImg + '">');
                $evaluationItems.find('.items-pic').attr('data-id',goodsId);
                $evaluationItems.find('.info dt').html(goodsName);
                $evaluationItems.parents('.evaluation-main').attr('data-id',orderId);
            }else{
                addTips('抱歉，请重试');
                setTimeout(function(){
                    window.location = '/order/list/all';
                },2000);
            }
        }else{
            addTips('抱歉，请重试');
            setTimeout(function(){
                window.location = '/order/list/all';
            },2000);
        }
    }
    //---------------建议评反馈
    if($body.hasClass('en-evaluation')){
        //----------催单操作
        $(document).on('tap','#order-reminder',function(){
            postReminder();
        });
    }
    //---------------建议评反馈
    if($body.hasClass('advice')){
        //----------
        $(document).on('tap','.advice .post-evaluation',function(){
            postAdvice();
        });
    }
    //===================================================商品详情页
    if($body.hasClass('items-details')){

        //----------获取商品详情
        getItemsDetails();

        //----------获取购物车数量
        getCartList();

        //----------获取用户默认地址
        getAddressDefault_();

        //----------评论加载更多
        window.onscroll = function(){
            var winHeight = window.innerHeight;
            var domOffsetTop = $(".loading-inner")[0].getBoundingClientRect().top;

            if(domOffsetTop > 0 && domOffsetTop < winHeight){
                var $evaluationList = $('.evaluation-list');
                var page = $evaluationList.attr('data-page');
                var totalPage = $evaluationList.attr('data-totalpage');
                if(ITEMS_LOAD_SWITCH && (page < totalPage)){
                    getEvaluationList(parseInt(page) + 1);
                }
            }

        };

        //----------选择收货地址
        $(document).on('tap','.items-page-address .change',function(){
            window.location = '/order/address?redirectURL=' + window.location.href;
        });

        //----------点击添加购物车
        $(document).on('tap','.items-details .buy-btn .add-cart',function(){
            if(!$(this).parent().hasClass('die-btn')){
                var $itemsBox = $('.items-box');
                var skuId = $itemsBox.attr('data-sku_id');
                var num = $itemsBox.find('.buy-num-xm .num input').val();
                addOneCart(skuId,1);
            }
        });

        //----------点击导航
        $(document).on('tap','.items-page-nav li a',function(){
            var parent = $(this).parents('li');
            var index = parent.index();
            var $li = $('.items-page-nav li');
            $li.removeClass('select');
            $li.eq(index).addClass('select');
        });

        //----------点击立即购买
        $(document).on('tap','.items-details .buy-btn .buy',function(){
            if(!$(this).parent().hasClass('die-btn')){
                var $itemsBox = $('.items-box');
                var $typeSelect = $('.type-select');
                var type = $typeSelect.html() ? $typeSelect.html().split(' ') : '';
                var cartInfo = [];
                var html = '';

                cartInfo.push($itemsBox.attr('data-sku_id'));
                cartInfo.push($itemsBox.attr('data-img'));
                cartInfo.push($itemsBox.find('.items-page-info strong').text());
                for(var i=0;i<type.length;i++){
                    html += '<span>' + type[i] + '</span>';
                }
                cartInfo.push(html);
                cartInfo.push($itemsBox.find('.items-price').text());
                cartInfo.push('1');

                //选中的信息存入localStorage
                localStorage.setItem("cartInfoTemp", cartInfo.join('$_$').toString());

                //跳转到订单页面
                window.location = '/order/confirm';
            }
        });
    }


    //===================================================热门推荐
    if($body.hasClass('hot-list')){

        //----------热门推荐
        url = window.location.href;
        if(url.indexOf('type_id=') > -1){
            var typeId = getUrlCs(url,'type_id');
        }else{
            var typeId = null;
        }
        if(url.indexOf('cate_id=') > -1){
            var cateId = getUrlCs(url,'cate_id');
        }else{
            var cateId = null;
        }
        if(url.indexOf('is_recommend=') > -1){
            var isRecommend = 1;
        }else{
            var isRecommend = null;
        }
        if(url.indexOf('keyword=') > -1){
            var keyword = getUrlCs(url,'keyword');
        }else{
            var keyword = '';
        }
        hotList(1,cateId,1,keyword,typeId,isRecommend);

        //----------商品分类
        itemsType(cateId);

        //----------热门推荐加载更多
        window.onscroll = function(){
            var winHeight = window.innerHeight;
            var domOffsetTop = $(".loading-inner")[0].getBoundingClientRect().top;

            if(domOffsetTop > 0 && domOffsetTop < winHeight){
                var $itemsList = $('.items-list');
                var page = $itemsList.attr('data-page');
                var totalPage = $itemsList.attr('data-totalpage');
                if(ITEMS_LOAD_SWITCH && (page < totalPage)){
                    var typeId = $itemsList.attr('data-typeid') || '';
                    var cateId = $itemsList.attr('data-cateid') || '';
                    var keyword = $itemsList.attr('data-keyword') || '';
                    hotList(parseInt(page) + 1,cateId,null,keyword,typeId);
                }
            }

        };

        //----------点击分类
        $(document).on('tap','.sx-list-inner .list li',function(){
            $('.sx-list-inner .list li').removeClass('select');
            $(this).addClass('select');
            hotList(1,$(this).attr('data-id'),1,'');
            $('.sx-list-inner .bg').trigger('touchstart');
        });

        //----------筛选
        /*        $(document).on('tap','.list-sx',function(){
         $('.sx-list-inner').show();
         setTimeout(function(){
         $('.sx-list-inner .bg').css('opacity','0.64');
         $('.sx-list-inner .list').css('transform','translate3d(0,0,0)');
         },30);

         //阻止滑动
         $(document).on('touchmove','.sx-list-inner',function(){
         event.preventDefault();
         return false;
         });
         });*/

        $(document).on('touchstart','.sx-list-inner .bg',function(event){
            event.preventDefault();
            $(this).css('opacity','0');
            $('.sx-list-inner .list').css('transform','translate3d(-300px,0,0)');
            setTimeout(function(){
                $('.sx-list-inner').hide();
            },400);
        });
    }
	if($body.hasClass('cate-list')){
        itemsTypeCate(1,0);
        $(document).on('tap','#wrapper-vertical li',function(){
            var cateId= $(this).attr('data-id');
            $(this).addClass('select').siblings().removeClass('select');
            itemsTypeCate(cateId,1);
        });
        $(document).on('tap','#wrapper-category li',function(){
            var url=$(this).attr('data-href');
            window.location.href=url;
        });
	}
    //===================================================支付
    if($body.hasClass('pay')){
        var payOrderId = getUrlCs(url,'order_id');
        var payOrderSn = getUrlCs(url,'order_sn');
        var payId = $('.pay-type-box.select').attr('data-id');
        $('.pay-btn').attr('href','/pay/' + payId + '?order_id=' + payOrderId + '&order_sn=' + payOrderSn);

        $(document).on('tap','.pay-type-box',function(){
            var $payTypeBox = $('.pay-type-box');
            $payTypeBox.removeClass('select');
            $(this).addClass('select');
            var payId = $('.pay-type-box.select').attr('data-id');
            $('.pay-btn').attr('href','/pay/' + payId + '?order_id=' + payOrderId + '&order_sn=' + payOrderSn);
        });
    }

    //----------点击领取优惠券
    if($body.hasClass('get-coupons')) {
        $(document).on('tap', '.coupons-box', function () {
            getCoupon($(this));
        });
    }
    if($body.hasClass('coupons-one')){
        $(document).on('tap', '.coupons-box', function () {
            getCoupon($(this));
        });
    }
});
//===================================================【商品分类】
function itemsTypeCate(cateId,is_allow){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/goods/filter',
        data:{pid:cateId,is_allow:is_allow},
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';
                var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
                height = height- $("header").height();
                if(data.data.length > 0){
                    html += '<ul class="list-vertical">';
                    for(var i=0;i<data.data.length;i++){
                        if(is_allow==0){
                            if(i==0){
                                itemsTypeCate(data.data[i].id,1);
                                html += '<li class="select" data-id="' + data.data[i].id + '"><a>' + data.data[i].title + '</a></li>';
                            }else{
                                html += '<li data-id="' + data.data[i].id + '"><a>' + data.data[i].title + '</a></li>';
                            }
                        }else{
                            html += '<li data-id="' + data.data[i].id + '" data-href="/list?cate_id='+data.data[i].id+'"><a><div class="cate-item"><div class="thumb"><img src="'+data.data[i].thumb+'"></div><div class="name">' + data.data[i].title + '</div></div></a></li>';
                        }
                    }
                    html += '</ul>';
                    if(is_allow==0) {
                        var myScroll1 = new IScroll('#wrapper-vertical', {mouseWheel: true, click: true});
                        $("#wrapper-vertical").css({height: height + "px"});
                        $('#wrapper-vertical').html(html);
                    }else{
                        var myScroll2 = new IScroll('#wrapper-category', {  mouseWheel: true, click: true});
                        $("#wrapper-category").css({height:height+"px"});
                        $('#wrapper-category').html(html);
                    }
                }else{
                    $('.list-sx').remove();
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}

//===================================================【焦点图组件】
//构造函数
function SLIDESHOW(container,params){
    this.dom = container; //焦点图元素
    this.pagination = params.pagination; //是否显示指示器
    this.loop = params.loop; //是否循环显示
    this.silderShow = this.dom.getElementsByClassName("slides")[0]; //焦点图容器
    this.btnWarp = this.dom.getElementsByClassName("btn")[0] || this.dom.getElementsByClassName("btn-num")[0]; //指示器容器
    this.btnNum = this.btnWarp.className === 'btn-num' ? 1 : 0; //指示器显示模式 数字或圆点
    this.imgWidth = parseInt(this.dom.offsetWidth); //焦点图容器的宽度（移动的单位距离）
    this.imgNum = this.silderShow.getElementsByClassName("slide-li").length; //焦点图的数量
    this.activeNum = 1; //指示器
    this.dataTransform = 0; //保存偏移值
    var $slides = this.silderShow; //焦点图容器
    var touchstart_x = 0; //滑动开始时的x坐标
    var touchstart_y = 0; //滑动开始时的y坐标
    var touchmoveX = 0; //滑动的x轴距离
    var touchmove_x = 0; //滑动时的x轴距离
    var touchmove_y = 0; //滑动时的y轴距离
    var touchend_x = 0; //滑动结束时的x坐标
    var moveSW = false; //是否滑动的开关
    var touchstart_time = 0; //滑动开始时的时间
    var touchend_time = 0; //滑动结束时的时间
    var touch_time = 0; //滑动耗时
    var sw = false; //如果滑动耗时在150毫秒以下，距离在60以上，切换焦点图
    var touch_fx = false; //根据起点和终点返回方向
    var t = this;
    var html = "";

    //创建指示器
    if(!this.pagination){
        this.btnWarp.style.display = "none";
    }

    if(this.btnNum){
        html += "<var>1</var>/" + this.imgNum;
    }else{
        html += "<ul>";
        for(var i=0;i<this.imgNum;i++){
            html += "<li></li>";
        }
        html += "</ul>";
    }
    this.btnWarp.innerHTML = html;
    if(!this.btnNum){
        this.btnWarp.getElementsByTagName("li")[0].className = "active";
    }

    //创建克隆DOM
    if(this.loop){
        var sourceNode = this.silderShow.getElementsByClassName("slide-li")[0]; // 获得被克隆的节点对象
        var clonedNode = sourceNode.cloneNode(true); // 克隆节点
        sourceNode.parentNode.appendChild(clonedNode); // 在父节点插入克隆的节点
    }

    //滑动开始
    this.silderShow.addEventListener('touchstart', function(event) {

        //重置
        touch_time = 0;
        touchmoveX = 0;

        //阻止事件冒泡
        event.stopPropagation();

        //打开滑动的开关
        moveSW = true;

        //关闭过渡效果
        $slides.style.transitionDuration = "0s";

        //记录坐标
        touchstart_x = event.changedTouches[0].pageX;
        touchstart_y = event.changedTouches[0].pageY;

        //记录时间
        touchstart_time = new Date();

    }, false);

    //滑动中
    this.silderShow.addEventListener('touchmove', function(event) {

        //阻止事件冒泡
        event.stopPropagation();

        if(moveSW){

            //记录坐标
            touchmove_x = event.changedTouches[0].pageX;
            touchmove_y = event.changedTouches[0].pageY;

            //每次滑动只获取一次
            if(!touch_fx){
                //根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右，0：未滑动
                touch_fx = getSlideDirection(touchstart_x,touchstart_y,touchmove_x,touchmove_y);
            }

            //左右滑动焦点图
            if(touch_fx === 3 || touch_fx === 4){

                //阻止浏览器默认动作
                event.preventDefault();

                //滑动距离
                touchmoveX = parseInt(event.changedTouches[0].pageX) - parseInt(touchstart_x);
                var x = t.dataTransform + touchmoveX;
                $slides.style.transform = "translate3d(" + x + "px,0,0)";

                if(t.loop){
                    //图片循环显示
                    //向前翻循环
                    if(x > 0 && x < 50){
                        //重置到最后一张
                        t.dataTransform = t.imgWidth * t.imgNum * -1;
                    }

                    //向后翻循环
                    if(x < (t.imgWidth * t.imgNum * -1)){
                        //重置到第一张
                        t.dataTransform = 0;
                    }
                }
            }

            //上下滚动页面
            else{
                moveSW = false;
            }
        }
    }, false);

    //滑动结束
    this.silderShow.addEventListener('touchend', function(event) {

        //阻止事件冒泡
        event.stopPropagation();

        //关闭滑动的开关
        moveSW = false;

        //删除获取的滑动方向
        touch_fx = false;

        //打开过度效果
        $slides.style.transitionDuration = "0.5s";

        //记录坐标
        touchend_x = event.changedTouches[0].pageX;

        //记录时间
        touchend_time = new Date();

        //记录滑动耗时
        touch_time = touchend_time.getTime() - touchstart_time.getTime();

        //如果滑动耗时在150毫秒以下，距离在60以上，切换焦点图
        if(touch_time <= 150 && Math.abs(touchmoveX) > 60){
            sw = true;
        }else{
            sw = false;
        }

        //发送移动的数值
        t.domMove(touchmoveX,sw);

    }, false);
}

//焦点图容器的移动
SLIDESHOW.prototype.domMove = function(num,sw){
    var moveNum;
    var index;
    var needWidth = this.imgWidth / 2;

    //滑动超过半个宽度，或有特殊指令，切换焦点图
    if(Math.abs(num) > needWidth || sw){

        //上一个
        if(num > 0 && (this.loop ? true : this.activeNum > 1)){
            //if(num > 0){
            moveNum = this.dataTransform + this.imgWidth * 1;
            this.moveAnimate(moveNum);
        }

        //下一个
        else if(num < 0 && (this.loop ? true : this.activeNum < this.imgNum)){
            //else if(num < 0){
            moveNum = this.dataTransform + this.imgWidth * -1;
            this.moveAnimate(moveNum);
        }

        //不动
        else{
            this.moveAnimate(this.dataTransform);
        }

    }else{
        //不动
        this.moveAnimate(this.dataTransform);
    }
};

//焦点图的移动动画
SLIDESHOW.prototype.moveAnimate = function(moveNum){

    //移动动画
    this.silderShow.style.transform = "translate3d(" + moveNum + "px,0,0)";
    this.dataTransform = moveNum;

    //当前下标值
    this.activeNum = Math.abs(this.dataTransform) / this.imgWidth + 1;

    //指示器动画
    var $btnLi = this.btnWarp.getElementsByTagName("li");
    for(var i=0;i<$btnLi.length;i++){
        $btnLi[i].className = "";
    }

    var showIndex = this.activeNum > this.imgNum ? 0 : this.activeNum - 1;

    if(this.btnNum){
        this.btnWarp.getElementsByTagName("var")[0].innerHTML = showIndex + 1;
    }else{
        $btnLi[showIndex].className = "active";
    }
};

//根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右,0：未滑动
function getSlideDirection(startX,startY,endX,endY) {
    var dy = startY - endY;
    var dx = endX - startX;
    var result = 0;

    //如果滑动距离太短
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        //未滑动
        return result;
    }

    //返回滑动的角度
    var angle = Math.atan2(dy,dx) * 180 / Math.PI;;

    if (angle >= -45 && angle < 45) {
        //向右
        result = 4;
    }

    else if (angle >= 45 && angle < 135) {
        //向上
        result = 1;
    }

    else if (angle >= -135 && angle < -45) {
        //向下
        result = 2;
    }

    else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
        //向左
        result = 3;
    }

    return result;
}


//===================================================【URL中获取参数】
function getUrlCs(url,e){
    var val = "";
    if(url.indexOf("?") > -1){
        var en = url.split("?")[1];
        var wn = en.split("&");
        for(var i=0;i<wn.length;i++){
            if(wn[i].split("=")[0] === e){
                val = wn[i].split("=")[1];
                break;
            }
        }
    }
    return val;
}


//===================================================【滑动删除】
function deleteBar(dom){
    var moveSW = false; //是否滑动的开关
    var touchmoveX = 0; //滑动的x轴距离
    var touchstart_x = 0; //滑动开始时的x坐标
    var touchstart_y = 0; //滑动开始时的y坐标
    var touchmove_x = 0; //滑动时的x轴距离
    var touchmove_y = 0; //滑动时的y轴距离
    var touch_fx = false; //根据起点和终点返回方向

    $(document).on('touchstart',dom,function(){
        //重置
        touchmoveX = 0;

        //阻止事件冒泡
        event.stopPropagation();

        //打开滑动的开关
        moveSW = true;

        //记录坐标
        touchstart_x = event.changedTouches[0].pageX;
        touchstart_y = event.changedTouches[0].pageY;
    });

    $(document).on('touchmove',dom,function(){
        //阻止事件冒泡
        event.stopPropagation();

        if(moveSW){
            //记录坐标
            touchmove_x = event.changedTouches[0].pageX;
            touchmove_y = event.changedTouches[0].pageY;

            //每次滑动只获取一次
            if(!touch_fx){
                //根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右，0：未滑动
                touch_fx = getSlideDirection(touchstart_x,touchstart_y,touchmove_x,touchmove_y);
            }

            //打开删除
            if(touch_fx === 3){
                event.preventDefault();
                $(this).css('transform','translate3d(-' + 1.5 + 'rem,0,0)');
            }
            //关闭删除
            else if(touch_fx === 4){
                event.preventDefault();
                $(this).css('transform','translate3d(0,0,0)');
                $('.add-cart-inner .inner').css('transform','translate3d(0,0,0)');
            }
            else{
                moveSW = false;
            }
        }
    });

    $(document).on('touchend',dom,function(){
        //阻止事件冒泡
        event.stopPropagation();

        //关闭滑动的开关
        moveSW = false;

        //删除获取的滑动方向
        touch_fx = false;
    });
}


//===================================================【多选 全选】
function checkboxFun(e){
    var $checkboxInner = $('.checkbox-inner');
    var tmp = true;

    //多选
    if(e.hasClass('checkbox')){
        var $parent = e.parents('.checkbox-inner');
        var $checkboxAll = $('.checkbox-all');

        $parent.toggleClass('select');

        for(var i=0;i<$checkboxInner.length;i++){
            if(!$checkboxInner.eq(i).hasClass('select')){
                tmp = false;
                break;
            }
        }

        if(tmp){
            $checkboxAll.addClass('select');
        }else{
            $checkboxAll.removeClass('select');
        }
    }

    //全选
    else if(e.hasClass('checkbox-all')){
        for(var i=0;i<$checkboxInner.length;i++){
            if(!$checkboxInner.eq(i).hasClass('select')){
                tmp = false;
                break;
            }
        }

        for(var i=0;i<$checkboxInner.length;i++){
            if(tmp){
                $checkboxInner.eq(i).removeClass('select');
            }else{
                $checkboxInner.eq(i).addClass('select');
            }
        }

        e.toggleClass('select');
    }

    //计算价格
    cartPrice();
}


//===================================================【购物车计算价格】
function cartPrice(){
    if($('body').hasClass('cart')){
        var $checkboxInner = $('.checkbox-inner');
        var zPrice = 0;
        var sg = 0;
        for(var i=0;i<$checkboxInner.length;i++){
            if($checkboxInner.eq(i).hasClass('select')){
                var price = $checkboxInner.eq(i).find('.items-price').text();
                var num = $checkboxInner.eq(i).find('.buy-num-xm .num input').val();
                zPrice = accAdd(zPrice,accMul(price,num));
                sg += parseInt(num);
            }
        }

        $('.cart-bar .total-price-red,.cart-bar .total-price-gray').html(zPrice);
        $('.cart-bar .total-num').html(sg);
    }
}


//===================================================【获取购物车列表】
function getCartList(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/cart',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                if($('body').hasClass('items-details')){
                    var num = 0;
                    for(var i=0;i<data.data.length;i++){
                        num += data.data[i].goods_num;
                    }
                    var numHtml = num > 0 ? '<var>' + num + '</var>' : '';
                    $('.buy-btn .var').html(numHtml);
                }else{
                    var html = '';
                    for(var i=0;i<data.data.length;i++){
                        html += '<div class="cart-box items-inner checkbox-inner select" data-sku_id="' + data.data[i].goods_id + '" data-kc="' + data.data[i].goods_num + '">';
                        html += '<div class="inner"><div class="checkbox"></div>';
                        html += '<div class="items-pic">';
                        html += '<a href="' + data.data[i].url + '"><img src="' + data.data[i].cover + '"></a></div>';
                        html += '<div class="info"><dl>';
                        html += '<dt><a href="' + data.data[i].url + '">' + data.data[i].title + '</a></dt>';
                        html += '<dd class="type">';

                        if(data.data[i].attr){
                            for(var j=0;j<data.data[i].attr.length;j++){
                                html += '<span>' + data.data[i].attr[j].val + '</span>';
                            }
                        }

                        html += '</dd><dd class="price"><span class="yuan">￥</span><span class="items-price">' + data.data[i].price + '</span></dd></dl></div>';
                        html += '<div class="buy-num-xm">';
                        html += '<div class="dp cut">&#45;</div>';
                        html += '<div class="dp num"><input type="text" maxlength="2" value="' + data.data[i].goods_num + '"></div>';
                        html += '<div class="dp add">&#43;</div></div><div class="delete-items">删除</div></div></div>';
                    }
                    $('.cart-main').html(html);

                    //计算购物数量
                    cartPrice();

                    //滑动删除
                    deleteBar('.cart-box .inner');
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【提交购物车选中的商品】
function postCartList(){
    var $checkboxInner = $('.checkbox-inner');
    var cartArray = [];

    if($checkboxInner.length > 0){
        for(var i=0;i<$checkboxInner.length;i++){
            if($checkboxInner.eq(i).hasClass('select')){
                var cartInfo = [];
                cartInfo.push($checkboxInner.eq(i).attr('data-sku_id'));
                cartInfo.push($checkboxInner.eq(i).find('.items-pic img').attr('src'));
                cartInfo.push($checkboxInner.eq(i).find('.info dt').text());
                cartInfo.push($checkboxInner.eq(i).find('.info .type').html());
                cartInfo.push($checkboxInner.eq(i).find('.items-price').text());
                cartInfo.push($checkboxInner.eq(i).find('.buy-num-xm .num input').val());

                cartArray.push(cartInfo.join('$_$'));
            }
        }

        //选中的信息存入localStorage
        localStorage.setItem("cartInfoTemp", cartArray.toString());

        //跳转到订单页面
        window.location = '/order/confirm';
    }
}


//===================================================【添加购物车】
function addCart(skuId,num,$addCartInner){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/cart/update',
        data: {
            goods_id : skuId,
            goods_num : num
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){

                addTips('添加成功',1,800);

                if($addCartInner){
                    $addCartInner.find('.bg').trigger('touchstart');
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【添加购物车 + 1】
function addOneCart(skuId,num){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/cart/addto',
        data: {
            goods_id : skuId,
            goods_num : num
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){

                addTips('添加成功',1,800);

                if($('body').hasClass('items-details')){
                    var num = 0;
                    for(var i=0;i<data.data.length;i++){
                        num += data.data[i].goods_num;
                    }
                    var numHtml = num > 0 ? '<var>' + num + '</var>' : '';
                    $('.buy-btn .var').html(numHtml);
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【更新购物车】
function updateCart(skuId,num){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/cart/update',
        data: {
            goods_id : skuId,
            goods_num : num
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){

            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【删除购物车】
function deleteCart(e){
    var $cartBox = e.parents('.cart-box');
    var skuId = $cartBox.attr('data-sku_id');
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/cart/remove',
        data: {
            goods_id : skuId
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                $cartBox.remove();
                cartPrice();
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【购买控件】
function buyBtn(e){
    var html = '';
    var $body = $('body');
    var $itemsBox = e.parents('.items-box');
    var attribute = eval($itemsBox.find('.json-attribute').html());
    var itemsDetailsPage = $body.hasClass('items-details') ? 1 : 0;
    var saveMark;

    //详情页 保存SKU
    if(itemsDetailsPage){
        saveMark = $('.items-box').attr('data-mark') ? $('.items-box').attr('data-mark').split('-') : '';
    }

    $itemsBox.addClass('select-items-box');

    html += '<div class="add-cart-inner" data-kc="">';
    html += '<div class="inner"><div class="items">';
    html += '<div class="pic"><img src=""></div>';
    html += '<div class="info">';
    html += '<span class="title"></span>';
    html += '<span class="price"><span class="yuan">￥</span><span class="items-price"></span></span></div></div>';
    html += '<div class="specs">';

    for(var i=0;i<attribute.length;i++){
        html += '<dl class="sp-' + (i + 1) + '"><dt>' + attribute[i].name + '</dt><dd>';

        for(var j=0;j<attribute[i].item.length;j++){
            var sk;
            if(!itemsDetailsPage){
                sk = j === 0 ? 'select' : '';
            }else{
                //详情页 保存SKU
                sk = attribute[i].item[j].id == saveMark[i] ? 'select' : '';
            }

            html += '<div class="specs-tag ' + sk + '" data-id="' + attribute[i].item[j].id + '">' + attribute[i].item[j].name + '</div>';
        }

        html += '</dd></dl>';
    }

    html += '</div>';
    html += '<div class="buy-num"><div class="title">购买数量</div><div class="buy-num-xm"><div class="dp cut">&#45;</div><div class="dp num"><input type="number" maxlength="3" value="1"></div><div class="dp add">&#43;</div></div></div>';
    html += '<div class="buy-btn"><div class="pay-btn buy"><div>立即购买</div></div><div class="pay-btn add-cart"><div>加入购物车</div></div></div></div><div class="bg"></div></div>';
    $body.append(html);
    setTimeout(function(){
        $('.add-cart-inner .bg').css('opacity','0.64');
        $('.add-cart-inner .inner').css('transform','translate3d(0,0,0)');
    },0);

    //阻止滑动
    $(document).on('touchmove','.add-cart-inner',function(){
        event.preventDefault();
        return false;
    });

    //找出对应的sku
    changeSku();
}


//===================================================【购买控件 找出对应的sku】
function changeSku(){
    //找出对应的mark
    var $selectItemsBox = $('.select-items-box');
    var $addCartInner = $('.add-cart-inner');
    var $dl = $addCartInner.find('.specs dl');
    var mark = [];
    var type = [];
    var NumAscSort=function(a,b)
    {
        return a - b;
    }
    for(var i=0;i<$dl.length;i++){
        var spec_id=parseInt($dl.eq(i).find('dd .select').attr('data-id'));
        mark.push(spec_id);
        type.push($dl.eq(i).find('dd .select').text());
    }
    mark.sort(NumAscSort);
    mark = mark.join('-');
    //找出对应的sku
    var rel = {};
    var sku = eval($selectItemsBox.find('.json-sku').html());
    for(var i=0;i<sku.length;i++){
        if(sku[i].mark === mark){
            rel.name = sku[i].name;
            rel.pic = sku[i].main_picture;
            rel.price = sku[i].market_price;
            rel.store = sku[i].store;
            rel.id = sku[i].id;
        }
    }

    //赋值
    $addCartInner.find('.info .title').html(rel.name);
    $addCartInner.find('.pic img').attr('src',rel.pic);
    $addCartInner.find('.info .items-price').html(rel.price);
    $addCartInner.attr('data-kc',rel.store);
    $addCartInner.attr('data-sku_id',rel.id);

    //没库存
    if(rel.store === 0){
        $('.add-cart-inner .buy-btn').addClass('die-btn');
    }else{
        $('.add-cart-inner .buy-btn').removeClass('die-btn');
    }

    //商品详情页 改变商品数据
    if($('body').hasClass('items-details')){
        var $itemsBox = $('.items-box');
        $itemsBox.find('.items-page-info strong').html(rel.name);
        $itemsBox.find('.items-page-info .items-price').html(rel.price);
        $itemsBox.attr('data-sku_id',rel.id);
        $itemsBox.attr('data-mark',mark);
        $itemsBox.attr('data-kc',rel.store);
        $itemsBox.attr('data-img',rel.pic);
        $itemsBox.find('.items-page-type .type-select').html(type.join(' '));

        //没库存
        if(rel.store === 0){
            $('.items-main .buy-btn').addClass('die-btn');
        }else{
            $('.items-main .buy-btn').removeClass('die-btn');
        }
    }
}


//===================================================【商品数量调整】
function cartNum(str,e){
    var $val;
    var v;
    var $body = $('body');
    var kc = $body.hasClass('cart') ? parseInt(e.parents('.cart-box').attr('data-kc')) : parseInt($('.add-cart-inner').attr('data-kc'));

    //增加
    if(str === 'add'){
        $val = e.prev().find("input");
        v = $val.val();
        if(v < kc){
            $val.val(parseInt(v) + 1);
        }
    }

    //减少
    else if(str === 'cut'){
        $val = e.next().find("input");
        v = $val.val();
        if(v > 1){
            $val.val(parseInt(v) - 1);
        }
    }

    //手动
    else if(str === 'mt'){
        v = e.val();
        if(!Number(v) || v > kc || v < 0){
            e.val(1);
        }
    }

    //购物车页面
    if($body.hasClass('cart')){

        //计算价格
        cartPrice();

        //更新购物车
        var $cartBox = e.parents('.cart-box');
        var skuId = $cartBox.attr('data-sku_id');
        var skuNum = $cartBox.find('.buy-num-xm .num input').val();
        updateCart(skuId,skuNum);
    }
}


//===================================================【今日推荐】
function todayItems(page){
    ITEMS_LOAD_SWITCH = false;
    $.ajax({
        type: 'post',
        data: {
            page : page
        },
        url: AJAX_URL + 'api/goods/recommend',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';
                for(var i=0;i<data.data.data.length;i++){
                    html += '<li>';
                    html += '<div class="items-box">';
                    html += '<div class="items-pic">';
                    html += '<a href="' + data.data.data[i].url + '"><img src="' + data.data.data[i].main_picture + '"></a>';
                    html += '</div><div class="items-text">' + data.data.data[i].name + '</div>';
                    html += '<div class="items-gm">';
                    html += '<span class="price"><span class="yuan">￥</span>' + data.data.data[i].market_price + '</span>';

                    if(parseInt(data.data.data[i].sum_store) > 0){
                        html += '<div class="buy-btn">购买</div></div>';
                    }else{
                        html += '<div class="buy-btn stock">缺货</div></div>';
                        html += '<div class="qh"><div class="n"></div><div class="stock-mask"></div></div>';
                    }
                    html += '<span class="json-attribute hidden">' + JSON.stringify(data.data.data[i].attribute) + '</span>';
                    html += '<span class="json-sku hidden">' + JSON.stringify(data.data.data[i].sku) + '</span>';
                    html += '</div>';
                    html += '</li>';
                }

                var $itemsList = $('.items-list');
                var $todayItemsInner = $('.today-items-inner');
                $itemsList.find('ul').append(html);
                $(".today-items-inner .loading-inner").html('');

                //分页
                $itemsList.attr('data-page',page);
                $itemsList.attr('data-totalpage',data.data.total_page);

                ITEMS_LOAD_SWITCH = true;

            }else{
                addTips(data.msg);
                ITEMS_LOAD_SWITCH = true;
            }
        },
        beforeSend : function(){
            $(".today-items-inner .loading-inner").html('<div class="loading"><div class="icon"></div>加载中...</div>');
        }
    });
}


//===================================================【首页专卖商品】
function zmShop(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/ad/monopoly',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';

                html += '<div class="slide-inner slides">';
                for(var i=0;i<data.data.data.length;i++){
                    html += '<div class="slide-box slide-li">';
                    html += '<div class="ads-l"><a href="' + data.data.data[i][0].link + '"><img src="' + data.data.data[i][0].code + '"></a></div>';
                    html += '<div class="ads-r">';
                    html += '<div class="im"><a href="' + data.data.data[i][1].link + '"><img src="' + data.data.data[i][1].code + '"></a></div>';
                    html += '<div class="im"><a href="' + data.data.data[i][2].link + '"><img src="' + data.data.data[i][2].code + '"></a></div>';
                    html += '<div class="im"><a href="' + data.data.data[i][3].link + '"><img src="' + data.data.data[i][3].code + '"></a></div>';
                    html += '<div class="im"><a href="' + data.data.data[i][4].link + '"><img src="' + data.data.data[i][4].code + '"></a></div>';
                    html += '</div></div>';
                }
                html += '</div><div class="btn"></div>';

                $('.monopoly-slide').html(html);

                if(data.data.data.length > 1){
                    var monopolySlide = new SLIDESHOW($('.index-main .monopoly-slide')[0],{
                        //是否显示指示器
                        pagination: true,
                        //是否循环显示
                        loop: true
                    });
                }

            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【首页焦点图】
function headSlide(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/ad/focus',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';

                html += '<ul class="slides">';
                for(var i=0;i<data.data.length;i++){
                    html += '<li class="slide-li"><a href="' + data.data[i].link + '"><img src="' + data.data[i].code + '"></a></li>';
                }
                html += '</ul><div id="btn" class="btn"></div>';

                $('.head-slide').html(html);
                var headSlide = new SLIDESHOW($('.index-main .head-slide')[0],{
                    //是否显示指示器
                    pagination: true,
                    //是否循环显示
                    loop: true
                });

            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【首页专题广告】
function brandAds(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/ad/brand',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';

                for(var i=0;i<data.data.length;i++){
                    html += '<a href="' + data.data[i].link + '"><div class="ads"><img alt="' + data.data[i].media_type_name + '" src="' + data.data[i].code + '"></div></a>';
                }
                $('.brand-ads').html(html);
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【提示】
function addTips(e,smile,time){
    var $alertPopInner = $('.alert-pop-inner');
    var timeZ = time || 2000;
    if($alertPopInner.length < 1){
        var t = smile ? '<div class="icon ok-icon"></div><span>' + e + '</span>' : '<div class="icon error-icon"></div><span>' + e + '</span>';
        var html = '<div class="alert-pop-inner hidden"><div class="pop-inner">' + t + '</div><div class="bg"></div></div>';
        $('body').append(html);

        $alertPopInner = $('.alert-pop-inner');
        $alertPopInner.removeClass('hidden');
        $alertPopInner.find('.pop-inner').css({
            'margin-top' : '-' + (parseInt($alertPopInner.find('.pop-inner').height())) / 100 + 'rem'
        });

        TIPS_TIMER = setTimeout(function(){
            $alertPopInner.remove();
        },timeZ);

        //阻止滑动
        $(document).on('touchmove','.alert-pop-inner',function(){
            event.preventDefault();
            return false;
        });

    }else{
        $alertPopInner.remove();
    }
}


//===================================================【获取用户信息】
function getUserCenterInfo(){
    $.ajax({
        type: 'get',
        url: AJAX_URL + 'api/user/userinfo',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';

                //用户信息
                var $accCenterMain = $('.acc-center-main');
                if(data.data.user.message.count){
                    html += '<div class="avatar"><img src="' + data.data.user.avatar + '"></div><dl><dt>' + data.data.user.nickname + '</dt><dd><a href="' + data.data.user.bind_account_url + '">帐号设置</a></dd></dl><a href="'+data.data.user.message.url+'"><div class="message"><span class="num">'+data.data.user.message.count+'</span></div></a>';
                }else{
                    html += '<div class="avatar"><img src="' + data.data.user.avatar + '"></div><dl><dt>' + data.data.user.nickname + '</dt><dd><a href="' + data.data.user.bind_account_url + '">帐号设置</a></dd></dl><a href="'+data.data.user.message.url+'"><div class="message"></div></a>';
                }
                $accCenterMain.find('.acc-inner').html(html);

                //订单信息
                html = data.data.order.unpaid.count > 0 ? '<span class="num">' + data.data.order.unpaid.count + '</span>' : '';
                $accCenterMain.find('.icon-not-paid').html(html);
                html = data.data.order.unreceived.count > 0 ? '<span class="num">' + data.data.order.unreceived.count + '</span>' : '';
                $accCenterMain.find('.icon-not-goods').html(html);
                html = data.data.order.uncomment.count > 0 ? '<span class="num">' + data.data.order.uncomment.count + '</span>' : '';
                $accCenterMain.find('.icon-not-evaluation').html(html);

                //财富信息
                html = '<li><a href="'+data.data.fortune.total.url+'"><div class="jm">' + data.data.fortune.total.name + '：<span class="red">' + data.data.fortune.total.count + '</span>元</div></a></li>';
                html += '<li><a href="'+data.data.fortune.coupon.url+'"><div class="jm">' + data.data.fortune.coupon.name + '：<span class="red">' + data.data.fortune.coupon.count + '</span></div></a></li>';
                html += '<li><a href="'+data.data.fortune.points.url+'"><div class="jm">' + data.data.fortune.points.name + '：<span class="red">' + data.data.fortune.points.count + '</span></div></a></li>';
                html += '<li><a href="'+data.data.fortune.commission.url+'"><div class="jm">' + data.data.fortune.commission.name + '：<span class="red">' + data.data.fortune.commission.count + '</span></div></a></li>';
                $accCenterMain.find('.wealth-inner ul').html(html);

                //收货地址
                html = '<a href="'+data.data.address.default.url+'"><span class="adr">' + data.data.address.default.value + '</span><span class="tit">'+data.data.address.default.name+'</span><span class="sj"></span></a>';
                $accCenterMain.find('.address-de').html(html);
                //默认学校
                html = '<a href="'+data.data.areas.default.url+'"><span class="adr">' + data.data.areas.default.value + '</span><span class="tit">'+data.data.areas.default.name+'</span><span class="sj"></span></a>';
                $accCenterMain.find('.areas-de').html(html);
                //最近浏览
                html = '<a href="'+data.data.recent_view.url+'"><span class="tit">' + data.data.recent_view.value + '</span><span class="sj"></span></a>';
                $accCenterMain.find('.recent-view').html(html);
                //意见反馈
                html = '<a href="'+data.data.my_advice.url+'"><span class="tit">' + data.data.my_advice.value + '</span><span class="sj"></span></a>';
                $accCenterMain.find('.my-advice').html(html);

            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【获取用户默认地址】
function getAddressDefault(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/address',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';

                if(data.data){
                    for(var i=0;i<data.data.length;i++){
                        if(data.data[i].is_default === 1){
                            html += '<div class="address-inner" data-id="' + data.data[i].id + '"><div class="address"><dl>';
                            html += '<dt>' + data.data[i].area_name + '  ' + data.data[i].address + '</dt><dd>';
                            html += '<span>' + data.data[i].consignee + '</span>';
                            html += '<span>' + data.data[i].mobile + '</span>';
                            html += '</dd></dl><div class="sj"></div></div></div>';
                            break;
                        }
                    }
                }else{
                    html += '<div class="address-inner" data-id="null"><div class="add-address"><s></s>添加收货地址</div></div>';
                }

                $('.address-box-inner').html(html);

            }else{
                addTips(data.msg);
            }
        }
    });
}

function getAddressDefault_(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/address',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                if($('body').hasClass('items-details')){
                    var html = '';
                    var $itemsPageAddress = $('.items-page-address');

                    if(data.data){
                        for(var i=0;i<data.data.length;i++){
                            if(data.data[i].is_default === 1){
                                html += '<div class="title">送至<span class="address-select">' + data.data[i].area_name + '  ' + data.data[i].address + '</span></div><div class="change">更改</div>';
                                break;
                            }
                        }
                    }else{
                        html += '<div class="title">暂无地址</div><div class="add-address">添加</div>';
                    }

                    $itemsPageAddress.html(html);
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【获取用户地址】
function getAddressList(){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/address',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '<div class="order-evaluation-main"><div class="address-inner" data-id="null"><div class="add-address"><s></s>添加收货地址</div></div></div>';
                if(data.data){
                    for(var i=0;i<data.data.length;i++){
                        var ifDef = data.data[i].is_default === 1 ? 1 : 0;
                        var def = ifDef ? '<div class="default"></div>' : '';
                        var defClass = ifDef ? '' : 'address-box-touch';

                        html += '<div class="address-box ' + defClass + '" data-id="' + data.data[i].id + '">';
                        html += '<div class="inner">' + def + '<div class="info"><dl>';
                        html += '<dt>' + data.data[i].area_name + '  ' + data.data[i].address + '</dt>';
                        html += '<dd>' + data.data[i].consignee + '  ' + data.data[i].mobile + '<dd>';
                        html += '</dl></div>';
                        if(!ifDef){
                            html += '<div class="delete-items">删除</div>';
                            html += '<a class="set-default" data-id="' + data.data[i].id + '">设为默认地址</a>';
                        }
                        html += '<a class="edit" data-id="' + data.data[i].id + '" data=\''+JSON.stringify(data.data[i])+'\'>编辑</a></div></div>';
                 }

                    $('.address-main').html(html);

                    //删除
                    deleteBar('.address-box-touch .inner');
                }else{
                    $('.address-main').html(html);
                    addTips('暂无收货地址');
                }

                $('.address-box-inner').html(html);

            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【选择用户地址】
function defaultAddress(e){
    var id = e.attr('data-id');
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/address/set',
        dataType: 'json',
        data: {
            id : id
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var url = window.location.href;
                var redirectURL = url.indexOf('redirectURL=') > -1 ?getUrlCs(url,'redirectURL'): '/order/confirm';
                redirectURL =decodeURIComponent(redirectURL);
                window.location = redirectURL;
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【删除用户地址】
function deleteAddress(e){
    var $addressBox = e.parents('.address-box');
    var id = $addressBox.attr('data-id');
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/address/remove',
        dataType: 'json',
        data: {
            id : id
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                $addressBox.remove();
                addTips('删除成功');
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【弹出添加用户地址面板】
function addAddress(){
    /*<div class="tm"><div class="tit">地址</div><div class="val school-val"><select class="select-school"></select></div></div>*/
    if($('.alert-add-address-inner').length <= 0){
        if($('body').hasClass('items-details')){
            var itemId= $('#item').attr('item-id');
            var redirectURL="/item/"+itemId;
            redirectURL =decodeURIComponent(redirectURL);
            setTimeout(function(){
                window.location = '/order/address?redirectURL='+redirectURL;
            },100);
        }
        callAddress();
    }
}

function showEditAddress(data){
    var id = data.id;
    var consignee=data.consignee;
    var address =data.address_full;
    var mobile =data.mobile;
    var dormitory = data.dormitory;
    var number = data.number;
    var html = '<div class="alert-add-address-inner"><input type="hidden" class="id" value="'+id+'"><div class="inner"><div class="close"></div><div class="table"><div class="tm"><div class="tit">收货人</div><div class="val"><input class="consignee" value="'+consignee+'" type="text" placeholder="请输入姓名"></div></div><div class="tm"><div class="tit">联系方式</div><div class="val"><input class="mobile" value="'+mobile+'" type="text" placeholder="手机或者固话"></div></div><div class="tm"><div class="tit">详细地址</div><div class="val"><input class="address" value="'+address+'"  type="text" placeholder="详细地址"></div></div><div class="tm"><div class="tit">寝楼名称</div><div class="val"><input class="dormitory" type="text" value="'+dormitory+'" placeholder="寝室楼名称"></div></div><div class="tm"><div class="tit">寝楼号码</div><div class="val"><input class="number" type="text" value="'+number+'" placeholder="寝室楼号码"></div></div></div><div class="edit-address">保存地址</div></div><div class="bg"></div></div>';
    $('body').append(html);
}

//===================================================【添加用户地址】
function saveAddress(e){
    var consignee = e.find('.consignee').val();
    /* var $option = e.find('.select-school').find('option');*/
    var address = e.find('.address').val();
    var mobile = e.find('.mobile').val();
    var dormitory = e.find('.dormitory').val();
    var number = e.find('.number').val();
    /*    for(var i=0;i<$option.length;i++){
     if($option.eq(i).attr('selected')){
     var areaId = $option.eq(i).attr('id');
     break;
     }
     }*/

    if(consignee && address && mobile && dormitory && number){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/address/create',
            data: {
                consignee : consignee,
                /*  area_id : areaId,*/
                address : address,
                mobile : mobile,
                dormitory : dormitory,
                number:number
            },
            dataType: 'json',
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    if($('body').hasClass('address')){
                        getAddressList();
                    }
                    else if($('body').hasClass('post-order')){
                        getAddressDefault();
                    }
                    else if($('body').hasClass('items-details')){
                        getAddressDefault_();
                    }

                    addTips('添加地址成功',1);

                    $('.alert-add-address-inner').remove();
                }else{
                    addTips(data.msg);
                }
            }
        });
    }else{
        alert('请填写完整');
    }
}

//===================================================【编辑用户地址】
function editAddress(e){
    var id        = e.find('.id').val();
    var consignee = e.find('.consignee').val();
    /* var $option = e.find('.select-school').find('option');*/
    var address = e.find('.address').val();
    var mobile = e.find('.mobile').val();
    var dormitory = e.find('.dormitory').val();
    var number = e.find('.number').val();
    /*    for(var i=0;i<$option.length;i++){
     if($option.eq(i).attr('selected')){
     var areaId = $option.eq(i).attr('id');
     break;
     }
     }*/

    if(id&&consignee && address && mobile && dormitory && number){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/address/edit',
            data: {
                id :id,
                consignee : consignee,
                /*  area_id : areaId,*/
                address : address,
                mobile : mobile,
                dormitory : dormitory,
                number:number
            },
            dataType: 'json',
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    if($('body').hasClass('address')){
                        getAddressList();
                    }
                    else if($('body').hasClass('post-order')){
                        getAddressDefault();
                    }
                    else if($('body').hasClass('items-details')){
                        getAddressDefault_();
                    }

                    addTips('地址编辑成功',1);

                    $('.alert-add-address-inner').remove();
                }else{
                    addTips(data.msg);
                }
            }
        });
    }else{
        alert('请填写完整');
    }
}
//===================================================【获取订单信息】
function getOrderPage(){
    var cartInfoTemp = localStorage.getItem('cartInfoTemp');
    var couponsTemp = localStorage.getItem('couponsTemp');
    var html = '';

    if(cartInfoTemp){
        var cartInfo = cartInfoTemp.split(',');
        for(var i=0;i<cartInfo.length;i++){
            var tempVar = cartInfo[i].split('$_$');
            html += '<div class="items-inner" data-sku_id="' + tempVar[0] + '">';
            html += '<div class="items-pic"><img src="' + tempVar[1] + '"></div>';
            html += '<div class="info"><dl>';
            html += '<dt>' + tempVar[2] + '</dt>';
            html += '<dd class="type">' + tempVar[3] + '</dd>';
            html += '<dd class="price"><span class="yuan">￥</span><span class="items-price">' + tempVar[4] + '</span>&nbsp;<span class="num">x<span class="items-num">' + tempVar[5] + '</span></span></dd>';
            html += '</dl></div></div>';
        }

        $('.items-list-inner').html(html);

        //优惠卷
        if(couponsTemp){
            var couponsId = couponsTemp.split('&')[0];
            var couponsMoney = couponsTemp.split('&')[1];
            $('.coupons-inner').attr('data-id',couponsId);
            $('.coupons').removeClass('hidden');
            $('.coupons .c-coupons').html(couponsMoney);
            $('.coupons-inner .coupons-tips').html('已抵用' + couponsMoney + '元');
        }

        //计算总价
        var $itemsInner = $('.items-inner');
        var zPrice = 0;
        for(var i=0;i<$itemsInner.length;i++){
            var price = parseFloat($itemsInner.eq(i).find('.items-price').text());
            var coupons = parseFloat($('.coupons .c-coupons').text());
            var num = parseInt($itemsInner.eq(i).find('.items-num').text());
            zPrice = accAdd(zPrice,accMul(price,num));

        }

        var cPrice = accSub(zPrice,coupons) > 0 ? accSub(zPrice,coupons) : 0;
        $('.c-price').html(zPrice);
        $('.z-price').html(cPrice);

        //订单总金额存入sessionStorage，优惠券需判断订单金额
        sessionStorage.order_price = cPrice;

    }else{
        //无订单信息
        addTips('暂无订单信息');
        setTimeout(function(){
            window.location = '/cart';
        },2000);
    }
}


//===================================================【创建订单】
function addOrderPay(){
    var goods = [];
    var addressId = $('.address-inner').attr('data-id') || '';
    var couponsId = $('.coupons-inner').attr('data-id') || '';
    var notes = $('.notes-input input').val() || '';
    var $itemsInner = $('.items-inner');
    for(var i=0;i<$itemsInner.length;i++){
        var skuId = $itemsInner.eq(i).attr('data-sku_id');
        var num = $itemsInner.eq(i).find('.items-num').text();
        goods.push(skuId + '|' + num);
    }

    if(addressId != 'null'){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/order/create',
            dataType: 'json',
            data: {
                goods : goods.join(','),
                address_id : addressId,
                coupons_id : couponsId,
                notes : notes
            },
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    //删除保存的订单信息，并跳转到支付页面
                    localStorage.removeItem("cartInfoTemp");
                    localStorage.removeItem("couponsTemp");

                    //创建付款url
                    window.location = '/order/pay?order_id=' + data.data.id + '&order_sn=' + data.data.sn;
                }else{
                    addTips(data.msg);
                }
            }
        });
    }else{
        addTips('请添加地址');
    }
}


//===================================================【获取待使用优惠卷】
function getCouponsUse(){
    var $couponsSm = $('.coupons-sm').eq(0);
    var couponsTemp = localStorage.getItem('couponsTemp');
    if(couponsTemp){
        var tId = couponsTemp.split('&')[0];
    }

    if($couponsSm.html() === ''){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/coupon',
            dataType: 'json',
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    var html = '<div class="coupons-list">';

                    for(var i=0;i<data.data.data_ready.length;i++){
                        var select = data.data.data_ready[i].id.toString() === tId ? 'select' : '';
                        html += '<div class="coupons-box ' + select + '" data-money="' + data.data.data_ready[i].money +'" data-id="' + data.data.data_ready[i].id +'">';
                        html += '<div class="checkbox"></div>';
                        html += '<div class="coupons-money">';
                        html += '<span class="y">￥</span>' + data.data.data_ready[i].money +'</div>';
                        html += '<div class="coupons-info"><dl>';
                        html += '<dt>'+data.data.data_ready[i].name+'(最低消费金额：<font color="#8b0000">'+data.data.data_ready[i].min_cost+'</font>元)'+'</dt>';
                        html += '<dd>有效期：' + data.data.data_ready[i].use_start_date +'-' + data.data.data_ready[i].use_end_date +'</dd>';
                        html += '</dl></div></div>';
                    }
                    html += '</div>';

                    $couponsSm.html(html);
                    $('.coupons-nav ul').html('<li class="use select">待使用(' + data.data.count_ready +')</li><li class="expired">已过期(' + data.data.count_expire +')</li><li class="used">已使用(' + data.data.count_used +')</li>');



                }else{
                    addTips(data.msg);
                }
            }
        });
    }else{
        var $couponsBox = $couponsSm.find('.coupons-box');
        $couponsBox.removeClass('select');
        for(var i=0;i<$couponsBox.length;i++){
            if($couponsBox.eq(i).attr('data-id') === tId){
                $couponsBox.eq(i).addClass('select');
                break;
            }
        }

    }
}


//===================================================【获取已过期优惠卷】
function getCouponsExpired(){
    var $couponsSm = $('.coupons-sm').eq(1);

    if($couponsSm.html() === ''){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/coupon/exp',
            dataType: 'json',
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    var html = '<div class="coupons-list">';
                    for(var i=0;i<data.data.data_expire.length;i++){
                        html += '<div class="coupons-box expired-coupons" data-id="' + data.data.data_expire[i].id +'">';
                        html += '<div class="coupons-money">';
                        html += '<span class="y">￥</span>' + data.data.data_expire[i].money +'</div>';
                        html += '<div class="coupons-info"><dl>';
                        html += '<dt>'+data.data.data_expire[i].name+'(最低消费金额：<font color="#8b0000">'+data.data.data_expire[i].min_cost+'</font>元)'+'</dt>';
                        html += '<dd>有效期：' + data.data.data_expire[i].use_start_date +'-' + data.data.data_expire[i].use_end_date +'</dd>';
                        html += '</dl></div></div>';
                    }
                    html += '</div>';

                    $couponsSm.html(html);
                }else{
                    addTips(data.msg);
                }
            }
        });
    }
}


//===================================================【获取已使用优惠卷】
function getCouponsUsed(){
    var $couponsSm = $('.coupons-sm').eq(2);

    if($couponsSm.html() === ''){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/coupon/used',
            dataType: 'json',
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    var html = '<div class="coupons-list">';
                    for(var i=0;i<data.data.data_used.length;i++){
                        html += '<div class="coupons-box expired-coupons" data-id="' + data.data.data_used[i].id +'">';
                        html += '<div class="coupons-money">';
                        html += '<span class="y">￥</span>' + data.data.data_used[i].money +'</div>';
                        html += '<div class="coupons-info"><dl>';
                        html += '<dt>'+data.data.data_used[i].name+'(最低消费金额：<font color="#8b0000">'+data.data.data_used[i].min_cost+'</font>元)'+'</dt>';
                        html += '<dd>有效期：' + data.data.data_used[i].use_start_date +'-' + data.data.data_used[i].use_end_date +'</dd>';
                        html += '</dl></div></div>';
                    }
                    html += '</div>';

                    $couponsSm.html(html);
                }else{
                    addTips(data.msg);
                }
            }
        });
    }
}


//===================================================【查看优惠卷是否能使用】
function couponsCanUse(e){
    var id = e.attr('data-id');
    var couponsMoney = e.attr('data-money');

    var cartInfoTemp = localStorage.getItem('cartInfoTemp');
    var cartInfo = cartInfoTemp.split(',');
    var goods_ids = new Array;
    for(var i=0;i<cartInfo.length;i++){
        var tempVar = cartInfo[i].split('$_$');
        goods_ids.push(tempVar[0]);
    }

    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/coupon/check',
        data: {
            id : id,
            order_price : sessionStorage.order_price,
            goods_ids : goods_ids
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var $couponsBox = e.parents('.coupons-sm').find('.coupons-box');
                $couponsBox.removeClass('select');
                e.addClass('select');

                //选中的优惠卷信息存入localStorage
                localStorage.setItem('couponsTemp',id + '&' + couponsMoney);

                var url = window.location.href;
                var redirectURL = url.indexOf('redirectURL=') > -1 ? getUrlCs(url,'redirectURL') : '/order/confirm';
                redirectURL =decodeURIComponent(redirectURL);
                setTimeout(function(){
                    window.location = redirectURL;
                },100);
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【获取全部订单】
function getOrderList(page){
    ITEMS_LOAD_SWITCH = false;
    var $orderSm = $('.order-sm');
    var id = $('.order-nav .select').attr('data-id');
    var totalpage = $orderSm.attr('data-totalpage');

    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/order',
        data: {
            t : id,
            p : page,
            n : 5
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';
                for(var i=0;i<data.data.data.length;i++){
                    html += '<div class="items-cart-box" data-id="' + data.data.data[i].id + '">';
                    for(var j=0;j<data.data.data[i].goods.length;j++){
                        html += '<div class="t"><div class="items-pic" data-id="' + data.data.data[i].goods[j].id + '"><a href="' + data.data.data[i].goods[j].url + '"><img src="' + data.data.data[i].goods[j].cover + '"></a></div>';
                        html += '<div class="info"><dl><dt><a href="' + data.data.data[i].goods[j].url + '">' + data.data.data[i].goods[j].title + '</a></dt><dd class="attr">';
                        for(var k=0;k<data.data.data[i].goods[j].attr.length;k++){
                            html += '<span>' + data.data.data[i].goods[j].attr[k].val + '</span>';
                        }
                        html += '</dd><dd><span class="price"><span class="yuan">￥</span>' + data.data.data[i].goods[j].price + '</span>&nbsp;<span class="num">x' + data.data.data[i].goods[j].num + '</span></dd></dl></div>';
                        if(id === 'all' || id === 'uncomment'){
                            if(data.data.data[i].goods[j].is_comment === 1){
                                html += '<a class="evaluation commented">已评价</a>';
                            }else if(data.data.data[i].status===9){
                                html += '<a class="evaluation need-evaluation red-btn" data-url="/order/comment?id=' + data.data.data[i].goods[j].id + '">评价</a>';
                            }else{}
                        }
                        html += '</div>';
                    }
                    html += '<div class="b clearfix"><span class="fitness">状态：<span>'+ data.data.data[i].status_string +'</span></span>';

                    if(id === 'all'){
                        if(data.data.data[i].status===9) {
                            html += '<a class="commission-share red-btn" href="#">佣金分享</a>';
                            html += '<a class="purchase">再次购买</a>';
                        }
                        if(data.data.data[i].status===0){
                            html += '<a data-order_id="' + data.data.data[i].id + '" class="cancel-order">取消订单</a>';
                            html += '<a class="pay-order red-btn" href="/order/pay?order_id=' + data.data.data[i].id + '&order_sn=' + data.data.data[i].sn + '">付款</a>';
                        }
                        if(data.data.data[i].status>=1&&data.data.data[i].status<3){
                            html += '<a class="purchase" href="/order/detail/' + data.data.data[i].id + '">查看物流</a>';
                        }
                        if(data.data.data[i].status===3) {
                            html += '<a class="purchase" href="/order/detail/' + data.data.data[i].id + '">查看物流</a>'
                            html += '<a data-order_id="' + data.data.data[i].id + '" class="confirm-receipt red-btn">确认收货</a>';
                        }
                    }
                    else if(id === 'unpaid'){
                        html += '<a data-order_id="' + data.data.data[i].id + '" class="cancel-order">取消订单</a>';
                        html += '<a class="pay-order red-btn" href="/order/pay?order_id=' + data.data.data[i].id + '&order_sn=' + data.data.data[i].sn + '">付款</a>';
                    }
                    else if(id === 'paid'){
                        html += '<a class="logistics" href="/order/detail/' + data.data.data[i].id + '">查看物流</a>';
                    }
                    else if(id === 'unreceived'){
                        html += '<a class="logistics" href="/order/detail/' + data.data.data[i].id + '">查看物流</a>';
                        html += '<a data-order_id="' + data.data.data[i].id + '" class="confirm-receipt red-btn">确认收货</a>';
                    }
                    else if(id === 'uncomment'){
                        html += '<a class="commission-share red-btn" href="#">佣金分享</a>';
                        html += '<a class="purchase">再次购买</a>';
                        html += '<a data-order_id="' + data.data.data[i].id + '" class="del-order">删除订单</a>';
                    }

                    html += '</div></div>';
                }

                $orderSm.find('.items-cart-list').append(html);
                $(".loading-inner").html('');
                $orderSm.attr('data-page',data.data.page);
                $orderSm.attr('data-totalpage',data.data.total_page);
                ITEMS_LOAD_SWITCH = true;

            }else{
                addTips(data.msg);
                ITEMS_LOAD_SWITCH = true;
            }
        },
        beforeSend : function(){
            $(".loading-inner").html('<div class="loading"><div class="icon"></div>加载中...</div>');
        }
    });
}


//===================================================【提交评价】
function postEvaluation(obj){
    var $evaluationMain = $('.evaluation-main');
    var goodsId = $evaluationMain.find('.items-pic').attr('data-id');
    var content = $evaluationMain.find('.evaluation-val textarea').val() || '';
    var score = $evaluationMain.find('.pj-star').attr('data-star');
    var orderId = $evaluationMain.attr('data-id');
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/comment/goods/create',
        data: {
            goods_id : goodsId,
            content : content,
            score : score,
            order_id : orderId
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                localStorage.removeItem('evaluationGoods');
                addTips('提交评论成功',1);
                $(obj).on('tap');
                $(obj).html('提交评价');
                setTimeout(function(){
                    window.location = '/order/list';
                },2000);

            }else{
                $(obj).on('tap');
                $(obj).html('提交评价');
                addTips(data.msg);
            }
        }
    });
}
function postReminder() {
    var $evaluationMain = $('.order-evaluation-main');
    var orderId = $evaluationMain.attr('data-id');
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/order/reminder',
        data: {
            order_id : orderId
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                addTips('提交催单成功',1);
                setTimeout(function(){
                    window.location.reload();
                },2000);

            }else{
                addTips(data.msg);
            }
        }
    });
}
//===================================================【提交评价】
function postAdvice(){
    var $adviceMain = $('.advice-main');
    var content = $adviceMain.find('.advice-val textarea').val() || '';
    var score = $adviceMain.find('.select-level').val();
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/advice/create',
        data: {
            content : content,
            score : score
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                addTips('提交评论成功',1);
                setTimeout(function(){
                    window.location = '/advice/history';
                },2000);

            }else{
                addTips(data.msg);
            }
        }
    });
}

//===================================================【获取商品详情】
function getItemsDetails(){
    var url = window.location.href;
    var id = $('#item').attr('item-id');

    if(id){
        $.ajax({
            type: 'post',
            url: AJAX_URL + 'api/goods/show',
            data: {
                id : id
            },
            dataType: 'json',
            timeout: AJAX_time,
            headers: AJAX_token,
            success: function(data){
                if(data.code === 200){
                    var html = '';

                    //图片信息
                    for(var i=0;i<data.data.album.length;i++){
                        html += '<li class="slide-li"><img src="' + data.data.album[i] + '"></li>';
                    }
                    $('.items-page-pic .slides').html(html);
                    var headSlide = new SLIDESHOW($('.items-page-cs .head-slide')[0],{
                        //是否显示指示器
                        pagination: true,
                        //是否循环显示
                        loop: true
                    });

                    //商品信息 默认选中第一个商品
                    //var nameArray = [];
                    //var idArray = [];
                    //for(var i=0;i<data.data.attribute.length;i++){
                    //    nameArray.push(data.data.attribute[i].item[0].name);
                    //    idArray.push(data.data.attribute[i].item[0].id);
                    //}
                    //$('.items-page-type .type-select').html(nameArray.join(' '));
                    //for(var i=0;i<data.data.sku.length;i++){
                    //    if(data.data.sku[i].mark === idArray.join('-')){
                    //        html = '<strong>' + data.data.sku[i].name + '</strong><div class="i"><span class="yuan">￥</span><span class="items-price">' + data.data.sku[i].market_price + '</span></div>';
                    //        html += '<span class="json-attribute hidden">' + JSON.stringify(data.data.attribute) + '</span>';
                    //        html += '<span class="json-sku hidden">' + JSON.stringify(data.data.sku) + '</span>';
                    //
                    //        var $itemsBox = $('.items-box');
                    //        $itemsBox.find('.items-page-info').html(html);
                    //        $itemsBox.attr('data-sku_id',data.data.sku[i].id);
                    //        $itemsBox.attr('data-mark',data.data.sku[i].mark);
                    //        $itemsBox.attr('data-img',data.data.sku[i].main_picture);
                    //        break;
                    //    }
                    //}
                    //$('.items-page-details').html(data.data.intro);
                    var $itemsBox = $('.items-box');
                    //商品信息 选中商品
                    for(var i=0;i<data.data.sku.length;i++){
                        if(data.data.sku[i].id == id){
                            html = '<strong>' + data.data.sku[i].name + '</strong><div id="meta" class="i"><span class="yuan">￥</span><span class="items-price">' + data.data.sku[i].market_price + '</span></div>';
                            html += '<span class="json-attribute hidden">' + JSON.stringify(data.data.attribute) + '</span>';
                            html += '<span class="json-sku hidden">' + JSON.stringify(data.data.sku) + '</span>';

                            $itemsBox.find('.items-page-info').html(html);
                            $itemsBox.attr('data-sku_id',data.data.sku[i].id);
                            $itemsBox.attr('data-mark',data.data.sku[i].mark);
                            $itemsBox.attr('data-img',data.data.sku[i].main_picture);
                            $itemsBox.attr('data-kc',data.data.sku[i].store);

                            //没库存
                            if(data.data.sku[i].store === 0){
                                $('.items-main .items-page-info #meta').addClass('hide');
                                $('.items-main .items-page-info').append('<p class="lack-store">商品缺货</p>');
                                $('.items-main .buy-btn').addClass('die-btn');
                            }else{
                                $('.items-main .items-page-info #meta').removeClass('hide');
                                $('.items-main .buy-btn').removeClass('die-btn');
                                $('.items-main .items-page-info .lack-store').remove();
                            }

                            break;
                        }
                    }
                    var dataMark = $itemsBox.attr('data-mark').split('-');
                    var nameArray = [];
                    for(var i=0;i<data.data.attribute.length;i++){
                        for(var j=0;j<data.data.attribute[i].item.length;j++){
                            if(data.data.attribute[i].item[j].id == dataMark[i]){
                                nameArray.push(data.data.attribute[i].item[j].name);
                            }
                        }
                    }
                    $('.items-page-type .type-select').html(nameArray.join(' '));

                    //商品表格属性
                    html = '';
                    for(var i=0;i<data.data.spec.length;i++){
                        html += '<tr><td class="h">' + data.data.spec[i].name + '</td><td>';
                        for(var j=0;j<data.data.spec[i].item.length;j++){
                            var s = j === 0 ? '' : '、';
                            html += data.data.spec[i].item[j].name + s;
                        }
                        html += '</td></tr>';
                    }
                    $('.items-page-details').html('<div class="sx-table"><table>' + html + '</table></div>');
                    $('.items-page-details').append(data.data.intro);

                    //获取商品评论
                    getEvaluationList(1);

                }else{
                    addTips(data.msg);
                }
            }
        });
    }else{
        addTips('暂无商品信息');
        setTimeout(function(){
            window.location = '/';
        },2000);
    }
}


//===================================================【获取商品评论】
function getEvaluationList(page){
    ITEMS_LOAD_SWITCH = false;
    var url = window.location.href;
    var id = url.indexOf('item/') > -1 ? url.split('item/')[1] : '';
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/comment/goods',
        data: {
            goods_id : id,
            goods_common_id : '',
            n : 3,
            p : page
        },
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';
                var $itemsPageEvaluation = $('.items-page-evaluation');

                if(data.data.data.length > 0){
                    var total = data.data.total > 0 ? '（' + data.data.total + '）' : '';
                    $itemsPageEvaluation.find('.title').html('<span class="tit-p">好评率<span>'+data.data.score_rate+'%</span></span>评价' + total);

                    for(var i=0;i<data.data.data.length;i++){
                        html += '<div class="evaluation-box"><div class="t"><div class="evaluation-star-min star-' + data.data.data[i].score + '">';
                        html += '<div class="s-1"></div><div class="s-2"></div><div class="s-3"></div><div class="s-4"></div><div class="s-5"></div></div>';
                        html += '<div class="user-avatar"><img src="' + data.data.data[i].user.avatar + '"></div>';
                        html += '<div class="user-name">' + data.data.data[i].user.nickname + '</div>';
                        html += '<div class="user-university">' + data.data.data[i].area.name + '</div></div>';
                        html += '<div class="b">' + data.data.data[i].content + '</div></div>';
                    }

                    var $evaluationList = $itemsPageEvaluation.find('.evaluation-list');
                    $evaluationList.append(html);

                    //分页
                    $evaluationList.attr('data-page',page);
                    $evaluationList.attr('data-totalpage',data.data.total_page);
                }else{
                    $itemsPageEvaluation.find('.title').html('<span class="tit-p">好评率<span>100%</span></span>评价' + 0);
                    $itemsPageEvaluation.find('.evaluation-list').html('<div class="evaluation-box"><p>购买商品后可以发表评论哦！</p></div>');
                }

                $(".loading-inner").html('');

                ITEMS_LOAD_SWITCH = true;
            }else{
                addTips(data.msg);
                ITEMS_LOAD_SWITCH = true;
            }
        },
        beforeSend : function(){
            $(".loading-inner").html('<div class="loading"><div class="icon"></div>加载中...</div>');
        }
    });
}


//===================================================【热门推荐】
function hotList(page,cateId,empty,keyword,typeId,isRecommend){
    ITEMS_LOAD_SWITCH = false;
    $.ajax({
        type: 'post',
        data: {
            cate_id : cateId,
            type_id : typeId,
            keyword : decodeURIComponent(keyword),
            is_recommend:isRecommend,
            page : page
        },
        url: AJAX_URL + 'api/goods/category',
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';
                for(var i=0;i<data.data.data.length;i++){
                    html += '<li>';
                    html += '<div class="items-box">';
                    html += '<div class="items-pic">';
                    html += '<a href="' + data.data.data[i].url + '"><img src="' + data.data.data[i].main_picture + '"></a>';
                    html += '</div><div class="items-text">' + data.data.data[i].name + '</div>';
                    html += '<div class="items-gm">';
                    html += '<span class="price"><span class="yuan">￥</span>' + data.data.data[i].market_price + '</span>';

                    if(parseInt(data.data.data[i].sum_store) > 0){
                        html += '<div class="buy-btn">购买</div></div>';
                    }else{
                        html += '<div class="buy-btn stock">缺货</div></div>';
                        html += '<div class="qh"><div class="n"></div><div class="stock-mask"></div></div>';
                    }
                    html += '<span class="json-attribute hidden">' + JSON.stringify(data.data.data[i].attribute) + '</span>';
                    html += '<span class="json-sku hidden">' + JSON.stringify(data.data.data[i].sku) + '</span>';
                    html += '</div>';
                    html += '</li>';
                }

                var $itemsList = $('.items-list');
                var _cateId = cateId || '';
                var _typeId = typeId || '';
                $itemsList.attr('data-cateid',_cateId);
                $itemsList.attr('data-typeid',_typeId);
                $itemsList.attr('data-keyword',keyword);

                //点击左侧分类
                if(empty){
                    $itemsList.find('ul').html(html);
                }

                //正常获取
                else{
                    $itemsList.find('ul').append(html);
                }
                $(".loading-inner").html('');

                //分页
                $itemsList.attr('data-page',page);
                $itemsList.attr('data-totalpage',data.data.total_page);

                ITEMS_LOAD_SWITCH = true;

            }else{
                addTips(data.msg);
                ITEMS_LOAD_SWITCH = true;
            }
        },
        beforeSend : function(){
            $(".loading-inner").html('<div class="loading"><div class="icon"></div>加载中...</div>');
        }
    });
}


//===================================================【商品分类】
function itemsType(cateId){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/goods/filter',
        data:{cate_id:cateId},
        dataType: 'json',
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';

                if(data.data.length > 0){
                    html += '<ul>';
                    for(var i=0;i<data.data.length;i++){
                        if(cateId&&parseInt(cateId)===parseInt(data.data[i].id)){
                            html += '<li data-id="' + data.data[i].id + '"class="select">' + data.data[i].title + '</li>';
                        }else{
                            html += '<li data-id="' + data.data[i].id + '">' + data.data[i].title + '</li>';
                        }
                    }
                    html += '</ul>';
                    var width = parseInt(data.data.length)*1.5+1.5;
                    $('#scroller').css({width:width+"rem"});
                    $('#scroller').html(html);
                    myScroll = new IScroll('#wrapper', { eventPassthrough: true, scrollX: true, scrollY: false, preventDefault: false,click:true });
                }else{
                    $('.list-sx').remove();
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}

//===================================================【搜索提示】
function searchTips(keyword){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/search/tips',
        dataType: 'json',
        data: {
            keyword : keyword
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var html = '';
                var $searchTips = $('.search-tips');
                if(data.data.length > 0){
                    for(var i=0;i<data.data.length;i++){
                        html += '<li data-typeid="' + data.data[i].type_id + '" data-cateid="' + data.data[i].cate_id + '">' + data.data[i].type_name + '</li>';
                    }
                    $('.search-tips ul').html(html);
                }
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【取消订单】
function cancelOrder(e){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/order/cancel',
        dataType: 'json',
        data: {
            order_id : e.attr('data-order_id')
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                e.parents('.items-cart-box').hide();
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【删除订单】
function deleteOrder(e){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/order/delete',
        dataType: 'json',
        data: {
            order_id : e.attr('data-order_id')
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                e.parents('.items-cart-box').hide();
            }else{
                addTips(data.msg);
            }
        }
    });
}


//===================================================【确认收货】
function confirmOrder(e){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/order/complete',
        dataType: 'json',
        data: {
            order_id : e.attr('data-order_id')
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                var $itemsCartBox = e.parents('.items-cart-box');
                $itemsCartBox.find('.fitness').html('状态：<span>已签收</span>');
                e.hide();
            }else{
                addTips(data.msg);
            }
        }
    });
}

//==============================================【领取优惠券】
function getCoupon(e){
    $.ajax({
        type: 'post',
        url: AJAX_URL + 'api/coupon/get',
        dataType: 'json',
        data: {
            coupon_id : e.attr('data-coupon_id')
        },
        timeout: AJAX_time,
        headers: AJAX_token,
        success: function(data){
            if(data.code === 200){
                e.find(".already_get").show();
				addTips(data.msg);
            }else{
                e.find(".already_get").show();
                addTips(data.msg);
            }
        }
    });
}


//==============================================【浮点计算】
/**
 ** 乘法函数，用来得到精确的乘法结果
 ** 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
 ** 调用：accMul(arg1,arg2)
 ** 返回值：arg1乘以 arg2的精确结果
 **/
function accMul(arg1, arg2) {
    var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length;
    }
    catch (e) {
    }
    try {
        m += s2.split(".")[1].length;
    }
    catch (e) {
    }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
}

/**
 ** 除法函数，用来得到精确的除法结果
 ** 说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
 ** 调用：accDiv(arg1,arg2)
 ** 返回值：arg1除以arg2的精确结果
 **/
function accDiv(arg1, arg2) {
    var t1 = 0, t2 = 0, r1, r2;
    try {
        t1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
    }
    try {
        t2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
    }
    with (Math) {
        r1 = Number(arg1.toString().replace(".", ""));
        r2 = Number(arg2.toString().replace(".", ""));
        return (r1 / r2) * pow(10, t2 - t1);
    }
}

/**
 ** 减法函数，用来得到精确的减法结果
 ** 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的减法结果。
 ** 调用：accSub(arg1,arg2)
 ** 返回值：arg1加上arg2的精确结果
 **/
function accSub(arg1, arg2) {
    var r1, r2, m, n;
    try {
        r1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
        r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
    n = (r1 >= r2) ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m).toFixed(n);
}

/**
 ** 加法函数，用来得到精确的加法结果
 ** 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
 ** 调用：accAdd(arg1,arg2)
 ** 返回值：arg1加上arg2的精确结果
 **/
function accAdd(arg1, arg2) {
    var r1, r2, m, c;
    try {
        r1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
        r2 = 0;
    }
    c = Math.abs(r1 - r2);
    m = Math.pow(10, Math.max(r1, r2));
    if (c > 0) {
        var cm = Math.pow(10, c);
        if (r1 > r2) {
            arg1 = Number(arg1.toString().replace(".", ""));
            arg2 = Number(arg2.toString().replace(".", "")) * cm;
        } else {
            arg1 = Number(arg1.toString().replace(".", "")) * cm;
            arg2 = Number(arg2.toString().replace(".", ""));
        }
    } else {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", ""));
    }
    return (arg1 + arg2) / m;
}
