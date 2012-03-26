//main arguments
var db_env = process.argv[2] || "development"
console.log("db_env==", db_env);

var Mongolian = require('mongolian');
var db = new Mongolian("127.0.0.1:27017").db('top-' + db_env);
var products = db.collection("products");
products.find().toArray(function(err, array){
  console.log("products.length=", array.length);
  for(var i = 0; i < array.length; i++)
    updateProductPriceAndCommentCounter(array[i]);
});


function updateProductPriceAndCommentCounter(p){
  if(p.prices.length < 1) return;
  var last = p.prices[p.prices.length - 1];
  console.log("old price=", p.price, "::::new price", last.price)
  p.price = last.price;
  p.comment_counter = parseInt(p.comment_counter);
  products.save(p);
}
