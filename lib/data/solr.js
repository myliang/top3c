var solr = require('solr');

var client = solr.createClient();

var doc1 = {
  id: '1',
  title_t: "中国你好",
  text_t: "Fizz buzz frizzle"
}
var doc2 = {
  id: '2',
  title_t: "中国发展不错",
  text_t: "Wuzz fizz drizzle"
}

client.add(doc1, function(err){
  if(err) throw err;
  console.log('first document added');
  client.commit();

  /**client.add(doc2, function(err){
    if(err) throw err;
    client.commit(function(err){
      if(err) throw err;
      var query = 'title_t:中国'
      client.query(query, function(err, response){
        if(err) throw err;
        var responseObj = JSON.parse(response);
        console.log("A search for ", query, " returned ", responseObj.response.numFound, " document.");
        console.log("First doc title: ", responseObj.response.docs[0].title_t);
        console.log("Second doc title: ", responseObj.response.docs[1].title_t);
        client.del(null, query, function(err, res){
          if(err) throw err;
          console.log("Deleted all docs matching query ", query);
          client.commit();
        });
      });
    });
  });*/
});
