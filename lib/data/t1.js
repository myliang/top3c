var
vm       = require("vm"),
total    = 5000,
result   = null;

process.nextTick(function memory() {
  var mem = process.memoryUsage();
  console.log('rss:', Math.round(((mem.rss/1024)/1024)) + "MB");
  setTimeout(memory, 100);
});

var script = vm.createScript('setInterval(function() {}, 0);', 'fetch_3c.js');

console.log("STARTING");
process.nextTick(function run() {
  var intervals = [];
  var _setint = function(){
      var foo = setInterval(arguments);
      intervals.push(foo);
      return foo;
  }
  var sandbox = { setInterval: _setint };
  script.runInNewContext(sandbox);
  delete intervals;

  total--;
  if (total) {
    process.nextTick(run);
  } else {
    console.log("COMPLETE");
  }
});
