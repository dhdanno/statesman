// Utilizes ES as a transaction log for events. The last event for a domain reflects it's current state
var elasticsearch = require('elasticsearch');
var moment        = require('moment');
var logger        = require('./logger.js');
var client        = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

// Globals 
var default_index = 'state_table';
var default_type  = 'test';

//Get the single most recent event
function select_last(domain) {

  client.search({
    index: default_index,
    type:  default_type,
    body: {
     "sort" : { "published_at" : {"order" : "desc"}},
     "size" : 1,
      query: {
        match: {
          domain: domain
        }
      }
    }
  }).then(function (resp) {
    var hits = resp.hits.hits;
    console.log(hits);
    return hits;

  }, function (err) {
    console.trace(err.message);
  });

}

// Insert a single event
function insert(domain, event) {
  client.create({
    index: default_index,
    type:  default_type,
    body: {
      domain: domain,
      published_at: moment().format(),
      event: event
    }
  }, function (error, response) {
     return error;
  });

}

// Export Functions
module.exports.select_last = select_last;
module.exports.insert      = insert;
