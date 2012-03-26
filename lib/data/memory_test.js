var os = require('os');

function show_mem() {
  var total = os.totalmem()
    , free = os.freemem()
    , used = total - free;
  console.log('System: total ' + total + ' free ' + free + ' used ' + used);
  var mem = process.memoryUsage();
  console.log('Process: heapTotal ' + mem.heapTotal + ' heapUsed ' + mem.heapUsed
    + ' rss ' + mem.rss + ' vsize ' + mem.vsize
  );
  console.log('----------------------------------------------------------------');
};

var bs = [];
function add_100m() {
  var size = 100 * 1024 * 1024,
    buffer = new Buffer(size);
  for (var i = 0; i < size; i++) {
    buffer[i] = 0;
  }
  bs.push(buffer);
};

for (var j = 0; j < 15; j++) {
  show_mem();
  add_100m();
}
show_mem();
