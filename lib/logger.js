//Logs stuff with a timestamp
// Daniel Korel | 2016

//TODO: Use a variable for the logfile.

var fs = require('fs');

function log(data) {

 Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
 }

 var d = new Date,
    dformat = [(d.getMonth()+1).padLeft(),
               d.getDate().padLeft(),
               d.getFullYear()].join('/') +' ' +
              [d.getHours().padLeft(),
               d.getMinutes().padLeft(),
               d.getSeconds().padLeft()].join(':');

    fs.appendFile('/var/log/statesman.log', "["+dformat+"] "+data+"\n", function (err) {
	// add error handling
    });
}

module.exports.log = log;
