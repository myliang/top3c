var http = require('http');
var url  = require('url');
var fs = require('fs');
var jsdom = require('jsdom');
var jquery = fs.readFileSync("./jquery-1.6.3.min.js").toString();
var solr = require('solr');
var solrClient = solr.createClient();

// encode
var Buffer = require('buffer').Buffer;
var Iconv = require('iconv').Iconv;

GLOBAL.DEBUG = true;

//mongo db driver
var Mongolian = require('mongolian');
//var db = new Mongolian("127.0.0.1:27017").db('mydb');
var db = new Mongolian("127.0.0.1:27017").db('top-development');
//var db = new Mongolian("127.0.0.1:27017").db('top-production');
var products = db.collection("products");
var product_url = {
  "360buy": 'http://www.360buy.com/products/',
  "tao3c": 'http://www.tao3c.com',
  "newegg": 'http://www.newegg.com.cn',
  "suning": 'http://www.suning.com/emall/',
  "coo8": 'http://www.coo8.com'
}
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

function out_p(p){
  for(var i in p)
    console.log("::", i, "=", p[i]);
}

//
var $_parse = {
  "360buy": function($, visa, kid, win_url){
    //console.log("ul li length = ", $('ul.list-h li').length);
    $('ul.list-h li').each(function(i){
      var p = {category_id: kid};
      p.img_path = $('.p-img img', this).attr('src2') || $('.p-img img', this).attr('src');
      var p_a = $('.p-name a', this);
      p.name = p_a.text();
      p.path = p_a.attr('href');
      p.comment_counter = parseInt($('.extra a', this).text().match(/[0-9]+/)[0]);

      //(function(p){
        httpGet(p.path, function(buf){
        
          var pprice = buf.match(/￥[0-9\.]+/g);
          if(pprice == null){
            console.log("::360buy:: 无货，没有价格", p_a.parent().html());
            return;
          } 
          p.price = pprice[0].substr(1);
          var id = p.path.split('/');
          id = id[id.length - 1].split('.')[0];
          p.kid = id + "_" + visa;
          //console.log("index::::::::::;" + id);
          //out_p(p);
          saveOrUpdateProduct(p);
        });
      //})(p);

    });
    var p = $('div.pagin a.next');
    if(p.length > 0){
      httpGetList(product_url[visa] + $(p[0]).attr('href'), visa, kid, win_url);
    }
  },
  "newegg": function($, visa, kid, win_url){
    //var index = 1;
    //console.log($('#itemGrid1 > .itemCell > dl.inner').length)
    $('#itemGrid1 > .itemCell > dl.inner').each(function(i){
      //console.log("newegg.each::::" + index++);
      var p = {category_id: kid};
      p.img_path = $('dt > a > img', this).attr('src');
      var p_a = $('dd.pdInfo .info a', this);
      p.name = p_a.text();
      p.path = p_a.attr('href');

      var rank = $('dd.rank a', this).text();
      if(!/^\s*$/.test(rank))
        p.comment_counter = parseInt($('dd.rank a', this).text().match(/[0-9]+/)[0]);
      else p.comment_counter = 0;

      var price_text = $('dd.price .current .price', this).text();
      if(/^\s*$/g.test(price_text)){
        console.log("::newegg::无货，没有价格信息==", p_a.html());
        return;
      }
      p.price = price_text.match(/[0-9\.]+/)[0];

      var sid = $('dd.btnArea a', this).first().next().attr('href');
      //console.log("sid::::", sid);
      p.kid = sid.split('&')[1].split('=')[1] + "_" + visa;
      //out_p(p);
      saveOrUpdateProduct(p);
    });
    var p = $('.pageNav .next');
    if(!p.hasClass('nextDisable')){
      console.log("::::next:::page:::", p.attr('href').split('#')[0]);
      httpGetList(p.attr('href').split('#')[0], visa, kid, win_url);
    }
  },
  "tao3c": function($, visa, kid, win_url){
    $('.productlist ul li').each(function(i){
      var p = {category_id: kid};
      p.img_path = $('.pd1 a img', this).attr('src');
      var p_a = $('.pd2 a', this);
      p.name = p_a.attr('title');
      p.path = product_url[visa] + p_a.attr('href');
      var price_text = $('.pd4 span', this).text();
      if(/^\s*$/g.test(price_text)){
        console.log("::tao3c::无货，没有价格信息==");
        return;
      }
      p.price = price_text.match(/[0-9\.]+/)[0];
      var id = p_a.attr('href').split('/');
      id = id[id.length - 1].split('.')[0];
      p.kid = id + "_" + visa;
      //取得评论信息
      httpGetjQuery(p.path, function(jq){
        var comment = jq('#tab5 > span a code').text();
        //console.log(":::comment=", comment);
        if(/^\s*$/.test(comment)) 
          p.comment_counter = 0;
        else 
          p.comment_counter = comment.match(/[0-9]+/)[0];
        //out_p(p)
        saveOrUpdateProduct(p);
      });
    });
    var p = $('.page a.page04');
    if(p.attr('href') != null && p.attr('href') != ""){
      console.log(visa, "::next.page=", p.attr('href'));
      httpGetList(product_url[visa] + p.attr('href'), visa, kid, win_url);
    }
  },
  "coo8": function($, visa, kid, win_url){
    $('.srchContent ul.pItems li').each(function(i){
      var p = {category_id: kid};
      p.img_path = $('.pic img', this).attr('src');
      var p_a = $('.name a', this);
      p.name = p_a.attr('title');
      p.path = p_a.attr('href');
      //console.log(":::::::path=" + p_a.parent().html());
      if(p.path == undefined) return;
      var id = p.path.split('/');
      id = id[id.length - 1].split('.')[0];
      p.kid = id + "_" + visa;
      httpGet(p.path, function(buf){
        var price_text = buf.match(/库巴价： [0-9\.]+/);
        if(price_text == null) return;
        p.price = buf.match(/库巴价： [0-9\.]+/)[0].substr(4);
        httpGet(product_url[visa] + "/interfaces/reviewCount.action?goodsId=P" + id, function(json){
          p.comment_counter = json.split('&')[0];
          //out_p(p);
          saveOrUpdateProduct(p);
        });
      });
    });
    var p = $('.pages .pageNext');
    if(p.attr('href') != null && p.attr('href') != ""){
      console.log(visa, ":::next.page=", p.attr('href'))
      httpGetList(product_url[visa] + p.attr('href'), visa, kid, win_url);
    }
  },
  "suning": function($, visa, kid, win_url){
    $('#proShow ul li').each(function(i){
      //console.log("::::suning.each:::");
      var p = {category_id: kid};
      var a_f = $('a', this).first();
      p.name = a_f.attr('title');
      p.img_path = $('img', a_f).attr('src2') || $('img', a_f).attr('src');
      p.path = product_url[visa] + a_f.attr('href');
      p.kid = this.id + "_" + visa;
      httpGetjQuery(p.path, function(jq){
        //console.log('::::', jq('.grade a').text());
        var comment_counter = jq('.grade a').text().match(/[0-9]+/)
        p.comment_counter = comment_counter != null ? comment_counter[0] : 0;
        //console.log(":::", jq('#tellMe a').attr('href'));
        p.price = jq('#tellMe a').attr('href').split('&')[5].split('=')[1];
        p.price = parseInt(p.price) + ".00";
        //out_p(p);
        saveOrUpdateProduct(p);
      });
    });
    var p = $('#buttomNext');
    if(!p.hasClass('unUse')){
      //console.log(visa, ":::page.next=", win_url)
      var off = win_url.lastIndexOf('=');
      var pu = win_url.substring(0, off) + '=' + (parseInt(win_url.substr(off + 1)) + 1);
      //console.log(":::url=", pu)
      httpGetList(pu, visa, kid, win_url)
    }
  }
}

function httpGetList(_url, visa, kid){
  httpGet(_url, function(buf){
    jsdom.env({html: buf, src: [jquery], done: function(errors, window){
      var $ = window.jQuery;
      console.log("start httpGetList:::::" + visa);
      $_parse[visa]($, visa, kid, _url);
    }});
  });
}

function httpGetjQuery(_url, callback){
  httpGet(_url, function(buf){
    jsdom.env({html: buf, src: [jquery], done: function(errors, window){
      var $ = window.jQuery;
      callback($);
    }});
  });
}

function saveOrUpdateProduct(p){
  var pp = {price: p.price, created_at: new Date()};
  var product = null;

  if(hash_products[p.kid] == undefined){
    p.prices = [pp];
    products.insert(p);
    product = p;
  }else{
    product = hash_products[p.kid];
    if(product.prices == undefined){
      product.prices = [pp];
      product.price = p.price;
      products.save(product);
      return ;
    }
    var last = product.prices[product.prices.length - 1];
    if(last.price != p.price){
      product.prices.push(pp);
      product.price = p.price;
      products.save(product);
    }
    //
  }
  //console.log("::::::", product._id.toString());

  createFullIndex(product);
  //console.log("::::", product._id.toString())
}

function createFullIndex(product){
  //solrClient.add({class_name: 'Product', type: 'Product', name_text: p.name, id: product._id.toString()}, function(err){
  solrClient.add({comment_counter_i: product.comment_counter, class_name: 'Product', 
    type: 'Product', name_text: product.name, id: "Product " + product._id.toString()}, function(err){
    if(err) throw err;
    solrClient.commit();
  });
}

function httpGet(p_url, callback){
  //console.log(p_url);
  http.get(url.parse(p_url), function(res){
    var buffers = [], size = 0;
    //console.log(res['headers']['content-type']);

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

      var contentType = res['headers']['content-type'];
      //console.log("::::::LLLL=", contentType);
      if(contentType == undefined)
        contentType = "utf-8";

      if(contentType.toLowerCase().indexOf('utf-8') != -1){
        callback(buffer.toString());
      }else{
        
        // 'content-type': 'text/html;charset=gbk'
        // 百度返回的页面数据流竟然还无法使用gbk完全解码。。
        var icon = new Iconv('GB2312', 'UTF-8//TRANSLIT//IGNORE');
        var utf8_buffer = icon.convert(buffer);
        ////console.log(utf8_buffer.toString());
        callback(utf8_buffer.toString());
      }

    });
  }).on('error', function(e){
    console.log("http.get error:::" + e.message);
  });
}
