$m = {
  loading: function(){
    $('#error .tip').html('loading...');
    $('#error').show();
  },
  tip: function(info){
    var error = $('#error');
    $('.tip', error).html(info);
    error.show();
    setTimeout(function(){
      $('.tip', error).html('');
      error.hide();
    }, 10000);
  },
  post: function(url, params, callback){
    this.loading();
    csrf_key = $('meta[name=csrf-param]').attr('content');
    csrf_value = $('meta[name=csrf-token]').attr('content');
    params[csrf_key] = csrf_value;
    $.post(url + '.json', params, function(json){
      if(typeof json.error != 'undefined'){
        var error = [];
        if(json.error instanceof Array){
          error = json.error;
        }else if(typeof json.error == 'string'){
          error.push(json.error);
        }else{
          error = 'error type not defined';
        }
        $m.tip(error.join('<br/>'));
      }else{
        $m.tip('操作成功');
        callback(json);
      }
    });
  },
  get: function(args){
    if(arguments.length == 3)
      $.get(arguments[0] + '.json', arguments[1], arguments[2]);
    else
      $.get(arguments[0] + '.json', arguments[1]);
  },
  cancel_event: function(event){
    //event = window.event || event;             
    if(window.event){
      window.event.cancelBubble = true;
    }else{
      event.stopPropagation();
    }
  },
  stop_default: function(e){
    // Prevent the default browser action (W3C)
    if (e && e.preventDefault)
        e.preventDefault();
    else
        window.event.returnValue = false;
    return false;
  },
  textarea_select: function(obj, start, end){
    if(obj.createTextRange){//IE浏览器
      var range = obj.createTextRange();
      range.moveEnd("character",end);
      range.moveStart("character", start);
      range.select();
    }else{//非IE浏览器
      obj.setSelectionRange(start, end);
      obj.focus();
    }
  },
  bind_scroll_bottom: function(callback){
    //设置滚动到页面底部
    $(window).scroll(function(){
      if($m.scroll_bottom()){
        callback();
      }
    });
  },
  scroll_bottom: function(){
    var scrollTop = 0;
    var clientHeight = 0; 
    var scrollHeight = 0;
 
    if(document.documentElement && document.documentElement.scrollTop) {  
        scrollTop = document.documentElement.scrollTop;  
    } else if (document.body) {  
	scrollTop = document.body.scrollTop;  
    }  
 
    if(document.body.clientHeight && document.documentElement.clientHeight) {  
        clientHeight = (document.body.clientHeight < document.documentElement.clientHeight) ? document.body.clientHeight : document.documentElement.clientHeight;          
    } else {  
        clientHeight = (document.body.clientHeight > document.documentElement.clientHeight) ? document.body.clientHeight : document.documentElement.clientHeight;      
    }
 
    scrollHeight = Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
 
    if(scrollTop + clientHeight + 1 >= scrollHeight) {  
        return true;  
    } else {  
        return false; 
    }
  },
  // mouse postion inside
  inside: function(event, slf) {
    var offset = slf.position();
    offset.right = offset.left + slf.outerWidth();
    offset.bottom = offset.top + slf.outerHeight();
    return event.pageY < offset.bottom &&
           event.pageY > offset.top &&
           event.pageX < offset.right &&
           event.pageX > offset.left;
  }

};

//Array#map
Array.prototype.map = function(callback){
  var new_array = [];
  for(var i = 0; i < this.length; i++)
    new_array.push(callback(this[i], i));
  return new_array;
};
Array.prototype.map_if = function(callback){
  var new_array = [];
  for(var i = 0; i < this.length; i++){
    if(callback(this[i], i))
      new_array.push(this[i]);
  }
  return new_array;
};
Array.prototype.include = function(callback){
  for(var i = 0; i < this.length; i++){
    //alert(i)
    if(callback(this[i], i))
      return this[i];
  }
  return false;
};
Array.prototype.each = function(callback){
  for(var i = 0; i < this.length; i++)
    callback(this[i], i);
};
var $_map = {
  map_if: function(map, callback){
    var new_array = {};
    for(var i in map){
      if(callback(map[i], i))
        new_array[i] = map[i];
    }
    return new_array;
  },
  include: function(map, callback){
    for(var i in map){
      if(typeof i != 'object' && callback(map[i]))
        return map[i];
    }
    return false;
  }
};
String.prototype.replace_all = function(a, b){
  return this.replace(a, b);
};
String.prototype.to_obj = function(){
  return eval('('+ this +')');
};

// page
var $_page = {
  index: 1,
  finished: true, //是否执行完more操作

  more: function(args){
    var callback = function(j){};
    var url = window.location.href;
    var params = {};
    if (arguments.length == 2){
      callback = arguments[1];
      url = arguments[0];
    }else if(arguments.length == 1){
      callback = arguments[0];
      var urls = url.split('?');
      url = urls[0];
      if(urls.length > 1){
        //alert(urls[1].split('&').length)
        urls[1].split('&').each(function(uri){
          var kv = uri.split('=');
          params[kv[0]] = decodeURIComponent(kv[1]);
        });
      }
    }


    if(!this.finished) return ;
    this.finished = false;
    $('#scroll-loading').show();
    setTimeout(function(){
      params.page = $_page.index++;

      $m.get(url, params, function(json){

        if(json == '404' || /<html/g.test(json)){
          json = [];
        }
        $('#scroll-loading').hide();
        var resultAry = callback(json);
        if(resultAry[1].length <= 0){
          $('#scroll-noresult').show();
          return ;
        }
        $('#w-box-contents').append(resultAry[1]);
        $_page.finished = true;

        //设置$_page.index的值为结果集的最后的值
        //$_page.index = resultAry[0][resultAry[0].length - 1].id;
      });
    }, 500);
    
  }
};

jQuery.cookie = function(name, value, options) {
  if (typeof value != 'undefined') {
    options = options || {};
    if (value === null) {
      value = '';
      options = $.extend({}, options);
      options.expires = -1;
    }
    var expires = '';
    if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
      var date;
      if (typeof options.expires == 'number') {
        date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      } else {
        date = options.expires;
      }
      expires = '; expires=' + date.toUTCString();
    }
    var path = options.path ? '; path=' + (options.path) : '';
    var domain = options.domain ? '; domain=' + (options.domain) : '';
    var secure = options.secure ? '; secure' : '';
    document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
  } else {
    var cookieValue = null;
      if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
          var cookie = jQuery.trim(cookies[i]);
          if (cookie.substring(0, name.length + 1) == (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
    return cookieValue;
  }
};

var $_highcharts = {
  shangjia: {"360buy": "京东商城", "newegg": "新蛋商城", "tao3c": "高鸿商城", "coo8": "库巴购物", "suning": "苏宁易购"},
  product_line: function(json){
    var categories = [];
    var series = [];
    var subseries = [];
    json.prices.each(function(ele){
      categories.push(ele.created_at.substring(0, 10));
      //alert(ele.price)
      subseries.push(parseInt(ele.price));
    });
    var tname = json.kid.toString().split('_')[1];
    series.push({name: this.shangjia[tname], data: subseries})
    //this.line(id, "价格变化趋势图", "", categories, "价格(￥)", series);
    this.line(json.kid.toString(), "", "", categories, "价格(￥)", series);
  },
  line: function(id, title, subtitle, categories, ytitle, series){
    this.create(id, 'line', title, subtitle, categories, ytitle, series);
  },
  create: function(id, type, title, subtitle, categories, ytitle, series){
    new Highcharts.Chart({
      chart: {renderTo: id, defaultSeriesType: type},
      title: {text: title},
      /** legend: {
        layout: 'vertical',
        align: 'left',
        x: 120,
        verticalAlign: 'top',
        y: 100,
        floating: true,
        backgroundColor: '#FFFFFF'
      },**/
      //subtitle: {text: subtitle},
      xAxis: {categories: categories},
      yAxis: {title: {text: ytitle}},
      tooltip: {enabled: false},
      plotOptions: {line: {dataLabels: { enabled: true}}, enableMouseTracking: false},
      series: series
    });   
  }
}

$(function(){
  //back to top
  $(window).scroll(function(){

    var top = document.body.scrollTop || document.documentElement.scrollTop;
    if(top > 60){
    //if($m.scroll_bottom()){
      $('#backtotop').show().unbind('click').bind('click', function(){
        $('html,body').animate({scrollTop: '0'}, 100);
        return false;
      });
    }else 
      $('#backtotop').hide();
  });
})
