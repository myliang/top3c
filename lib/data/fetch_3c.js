var http = require('http');
var url  = require('url');
var fs = require('fs');
var jsdom = require('jsdom');
// magic for applying querySelector/querySelectorAll
jsdom.jsdom("", null, {features: {QuerySelector: true}});
//var jquery = fs.readFileSync("./jquery-1.6.3.min.js").toString();
var solr = require('solr');
var solrClient = solr.createClient();

// encode
var Buffer = require('buffer').Buffer;
var Iconv = require('iconv').Iconv;

GLOBAL.DEBUG = true;

//main arguments
var db_env = process.argv[2] || "development"
console.log("db_env==", db_env);

//mongo db driver
var Mongolian = require('mongolian');
var db = new Mongolian("127.0.0.1:27017").db('top-' + db_env);
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
  "360buy": function(doc, visa, kid, win_url){
    //console.log("ul li length = ", $('ul.list-h li').length);
    var lis = doc.querySelectorAll('ul.list-h li');
    arrayEach(lis, function(el, index){
    //for(var i = 0; i < lis.length; i++){
      var p = {category_id: kid};
      //console.log("::", visa,"::index=", kid);
      //var el = lis[i];
      //console.log(":::::", el.innerHTML);
      var img = el.querySelector('.p-img img');
      p.img_path = img.getAttribute('src2') || img.getAttribute('src');
      var p_a = el.querySelector('.p-name a');
      p.name = p_a.textContent;
      p.path = p_a.getAttribute('href');

      var comment_counter_node = el.querySelector('.extra a');
      if(comment_counter_node == undefined)
        p.comment_counter = 0;
      else{
        var comment = comment_counter_node.textContent.match(/[0-9]+/);
        p.comment_counter = comment == null ? 0 : parseInt(comment[0]);
      }

      //(function(p){
        httpGet(p.path, function(buf){
        
          var pprice = buf.match(/￥[0-9\.]+/);
          if(pprice == null){
            console.log("::360buy:: 无货，没有价格");
            return;
          } 
          //console.log(":::::path=", p.path);
          p.price = pprice[0].substr(1);
          var id = p.path.split('/');
          id = id[id.length - 1].split('.')[0];
          p.kid = id + "_" + visa;
          //console.log("index::::::::::;" + id);
          //console.log(":::::360buy:::::::::=> ");
          //out_p(p);
          saveOrUpdateProduct(p);
        });
      //})(p);

    });
    var p = doc.querySelector('div.pagin a.next');
    if(p != undefined){
      console.log("::::next:::page:::", p.getAttribute('href'));
      httpGetList(product_url[visa] + p.getAttribute('href'), visa, kid, win_url);
    }
  },
  "newegg": function(doc, visa, kid, win_url){
    //var index = 1;
    var dls = doc.querySelectorAll('#itemGrid1 > .itemCell > dl.inner');
    arrayEach(dls, function(el, index){
    //for(var i = 0; i < dls.length; i++){
      //console.log("newegg.each::::" + index++);
      //var el = dls[i];
      var p = {category_id: kid};
      //console.log("::", visa,"::index=", kid);
      p.img_path = el.querySelector('dt > a > img').getAttribute('src');
      var p_a = el.querySelector('dd.pdInfo .info a');
      p.name = p_a.textContent;
      p.path = p_a.getAttribute('href');

      var rank = el.querySelector('dd.rank a');
      if(rank != undefined){
        var comment = rank.textContent.match(/[0-9]+/);
        p.comment_counter = comment == null ? 0 : parseInt(comment[0]);
      }else p.comment_counter = 0;

      var price_node = el.querySelector('dd.price .current .price');
      if(price_node == undefined){
        console.log("::newegg::无货，没有价格信息");
        return;
      }
      var price = price_node.textContent.match(/[0-9\.]+/);
      if(price == null) return ;
      p.price = price[0];

      var sid = el.querySelector('dd.btnArea a').nextSibling.getAttribute('href');
      //console.log("sid::::", sid);
      p.kid = sid.split('&')[1].split('=')[1] + "_" + visa;
      //out_p(p);
      saveOrUpdateProduct(p);
    });
    var p = doc.querySelector('.pageNav .next');
    //console.log("::::::className=", p.className.indexOf('nextDisable') == -1)
    if(p.className.indexOf('nextDisable') == -1){
      console.log("::::next:::page:::", p.getAttribute('href'));
      httpGetList(p.getAttribute('href'), visa, kid, win_url);
    }
  },
  "tao3c": function(doc, visa, kid, win_url){
    var lis = doc.querySelectorAll('.productlist ul li');
    arrayEach(lis, function(el, index){
    //for(var i = 0; i < lis.length; i++){
      var p = {category_id: kid};
      //console.log("::", visa,"::index=", kid);
      //var el = lis[0];
      p.img_path = el.querySelector('.pd1 a img').getAttribute('src');
      var p_a = el.querySelector('.pd2 a');
      p.name = p_a.getAttribute('title');
      p.path = product_url[visa] + p_a.getAttribute('href');
      var price_node = el.querySelector('.pd4 span');
      if(price_node == undefined){
        console.log("::tao3c::无货，没有价格信息==");
        return;
      }

      var price = price_node.textContent.match(/[0-9\.]+/); 
      console.log("::::price=", price);
      if(price == null) return ;
      p.price = price[0];
      var id = p_a.getAttribute('href').split('/');
      id = id[id.length - 1].split('.')[0];
      p.kid = id + "_" + visa;
      //取得评论信息
      httpGetjQuery(p.path, function(doc1){
        var comment_node = doc1.querySelector('#tab5 > span a code');
        //console.log(":::comment=", comment);
        if(comment_node == undefined) 
          p.comment_counter = 0;
        else 
          p.comment_counter = parseInt(comment_node.textContent.match(/[0-9]+/)[0]);
        //out_p(p)
        saveOrUpdateProduct(p);
      });
    });
    var p = doc.querySelector('.page a.page04');
    if(p.getAttribute('href') != null && p.getAttribute('href') != ""){
      console.log(visa, "::next.page=", p.getAttribute('href'));
      httpGetList(product_url[visa] + p.getAttribute('href'), visa, kid, win_url);
    }
  },
  "coo8": function(doc, visa, kid, win_url){
    var lis = doc.querySelectorAll('.srchContent ul.pItems li');
    arrayEach(lis, function(el, index){
    //for(var i = 0; i < lis.length; i++){
      //var el = lis[i];
      var p = {category_id: kid};
      //console.log("::coo8::index=", kid);
      p.img_path = el.querySelector('.pic img').getAttribute('src');
      var p_a = el.querySelector('.name a');
      p.name = p_a.getAttribute('title');
      p.path = p_a.getAttribute('href');
      //console.log(":::::::path=" + p_a.parent().html());
      if(p.path == undefined) return;
      var id = p.path.split('/');
      id = id[id.length - 1].split('.')[0];
      p.kid = id + "_" + visa;

      httpGet(p.path, function(buf){
        var price_text = buf.match(/库巴价： [0-9\.]+/);
        if(price_text == null) return;
        p.price = price_text[0].substr(4);
        httpGet(product_url[visa] + "/interfaces/reviewCount.action?goodsId=P" + id, function(json){
          p.comment_counter = parseInt(json.split('&')[0]);
          //out_p(p);
          saveOrUpdateProduct(p);
        });
      });
    });
    var p = doc.querySelector('.pages .pageNext');
    if(p.getAttribute('href') != null && p.getAttribute('href') != ""){
      console.log(visa, ":::next.page=", p.getAttribute('href'))
      httpGetList(product_url[visa] + p.getAttribute('href'), visa, kid, win_url);
    }
  },
  "suning": function(doc, visa, kid, win_url){
    var lis = doc.querySelectorAll('#proShow ul li');
    arrayEach(lis, function(el, index){
    //for(var i = 0; i < lis.length; i++){
      //console.log("::::suning.each:::");
      //var el = lis[i];
      var p = {category_id: kid};
      //console.log("::", visa,"::index=", kid);
      var a_f = el.querySelector('a');
      p.name = a_f.getAttribute('title');
      p.img_path = a_f.querySelector('img').getAttribute('src2') || a_f.querySelector('img').getAttribute('src');
      p.path = product_url[visa] + a_f.getAttribute('href');
      p.kid = this.id + "_" + visa;
      httpGetjQuery(p.path, function(doc1){
        //console.log('::::', jq('.grade a').text());
        var comment_counter_node = doc1.querySelector('.grade a');
        if(comment_counter_node == undefined)
          p.comment_counter = 0;
        else{
          var comment = comment_counter_node.textContent.match(/[0-9]+/);
          p.comment_counter = parseInt(comment[0]);
        }
        //console.log(":::", jq('#tellMe a').attr('href'));
        p.price = doc1.querySelector('#tellMe a').getAttribute('href').split('&')[5].split('=')[1];
        p.price = parseInt(p.price) + ".00";
        //out_p(p);
        saveOrUpdateProduct(p);
      });
    });
    var p = doc.querySelector('#buttomNext');
    if(p.className.indexOf('unUse') == -1){
      //console.log(visa, ":::page.next=", win_url)
      var off = win_url.lastIndexOf('=');
      var pu = win_url.substring(0, off) + '=' + (parseInt(win_url.substr(off + 1)) + 1);
      //console.log(":::url=", pu)
      httpGetList(pu, visa, kid, win_url);
    }
  }
}

function httpGetList(_url, visa, kid){
  //console.log(":::::httpGetList:::::");
  httpGet(_url, function(buf){
    jsdom.env({html: buf, src: [], done: function(errors, window){
      var doc = window.document;
      //console.log("start httpGetList:::::" + visa);
      $_parse[visa](doc, visa, kid, _url);
      window.close();
    }});
  });
}

function httpGetjQuery(_url, callback){
  httpGet(_url, function(buf){
    jsdom.env({html: buf, done: function(errors, window){
      var doc = window.document;
      callback(doc);
      window.close();
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
    console.log("::::new add product information::", p.kid);
    createFullIndex(product);
  }else{
    product = hash_products[p.kid];
    if(product.prices == undefined){
      product.prices = [pp];
      product.price = p.price;
      product.comment_counter = p.comment_counter;
      products.save(product);
      return ;
    }
    var last = product.prices[product.prices.length - 1];
    if(last.price != p.price){
      product.prices.push(pp);
      product.price = p.price;
      product.comment_counter = p.comment_counter;
      products.save(product);
    }
    //
  }
  //console.log("::::", product._id.toString())
}

function arrayEach(ary, callback){
  for(var i = 0; i < ary.length; i++)
    callback(ary[i], i);
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
  //console.log("httpGet_url=", p_url);
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
      console.log("::::::contentType=", contentType);
      if(contentType == undefined)
        contentType = "utf-8";

      if(contentType.toLowerCase().indexOf('utf-8') != -1){
        callback(buffer.toString());
      }else{
        
        console.log("::::url::::", p_url);
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
