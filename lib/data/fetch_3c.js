var http = require('http');
var url  = require('url');
var fs = require('fs');
var jsdom = require('jsdom');
var jquery = fs.readFileSync("./jquery-1.6.3.min.js").toString();

// encode
var Buffer = require('buffer').Buffer;
var Iconv = require('iconv').Iconv;

GLOBAL.DEBUG = true;

//mongo db driver
var Mongolian = require('mongolian');
//var db = new Mongolian("127.0.0.1:27017").db('mydb');
var db = new Mongolian("127.0.0.1:27017").db('top-production');
var products = db.collection("products");
var product_url = 'http://www.360buy.com/products/';
var index = 1;

// create index
//products.ensureIndex({category_id: 1});
//products.ensureIndex({kid: 1});

//所有数据库数据的hash缓存
var hash_products = {};

products.find().toArray(function(err, array){
  console.log("products.length = ", array.length);
  for(var i = 0; i < array.length; i++)
    hash_products[array[i].kid] = array[i];

  // main process
  db.collection("categories").find().forEach(function(category){
    console.log(":::::" + category.kid);
    var p_urls = category.urls;
    for(var j = 0; j < p_urls.length; j++)
      httpGetList(p_urls[j].url, p_urls[j].visa, category.kid)
  });

});

function httpGetList(_url, visa, kid){
  httpGet(_url, function(buf){
  jsdom.env({html: buf, src: [jquery], done: function(errors, window){
    var $ = window.jQuery;
    //console.log("ul li length = ", $('ul.list-h li').length);
    $('ul.list-h li').each(function(i){
      var p = {category_id: kid};
      p.img_path = $('.p-img img', this).attr('src2') || $('.p-img img', this).attr('src');
      var p_a = $('.p-name a', this);
      p.name = p_a.text();
      p.path = p_a.attr('href');
      p.comment_counter = parseInt($('.extra a', this).text().match(/[0-9]+/g)[0]);

      //(function(p){
        httpGet(p.path, function(buf){
        
          var pprice = buf.match(/￥[0-9\.]+/g);
          if(pprice != null){
          p.price = pprice[0].substr(1);
          var id = p.path.split('/');
          id = id[id.length - 1].split('.')[0];
          p.kid = id + "_" + visa;
          console.log("index::::::::::;" + id);
          saveOrUpdateProduct(p);
          }
        });
      //})(p);

    });
    var p = $('div.pagin a.next');
    if(p.length > 0){
      httpGetList(product_url + $(p[0]).attr('href'), visa, kid);
    }
  }});
  });
}

function saveOrUpdateProduct(p){
  var pp = {price: p.price, created_at: new Date()};
  if(hash_products[p.kid] == undefined){
    p.prices = [pp];
    products.insert(p);
  }else{
    var product = hash_products[p.kid];
    if(product.prices == undefined){
      product.prices = [pp];
      products.save(product);
      return ;
    }
    var last = product.prices[product.prices.length - 1];
    if(p.kid == "508358_360buy"){
      console.log("last:::" + last)
      console.log(":::last.price=", last.price, "::::p.price", p.price)
    }
    if(last.price != p.price){
      product.prices.push(pp);
      products.save(product);
    }
    //
  }
}

function httpGet(p_url, callback){
  ////console.log(p_url);
  http.get(url.parse(p_url), function(res){
    var buffers = [], size = 0;
    res.on('data', function(buffer){
      buffers.push(buffer);
      size += buffer.length;
    })
    .on('end', function(){
      var buffer = new Buffer(size), pos = 0;
      for(var i = 0, l = buffers.length; i < l; i++) {
        buffers[i].copy(buffer, pos);
        pos += buffers[i].length;
      }

      // 'content-type': 'text/html;charset=gbk'
      // 百度返回的页面数据流竟然还无法使用gbk完全解码。。
      var icon = new Iconv('GB2312', 'UTF-8//TRANSLIT//IGNORE');
      var utf8_buffer = icon.convert(buffer);
      ////console.log(utf8_buffer.toString());
      callback(utf8_buffer.toString());
    });
  }).on('error', function(e){
    console.log("http.get error:::" + e.message);
  });
}
