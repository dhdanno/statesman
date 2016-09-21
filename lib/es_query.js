// Query ElasticSearch
// Daniel Korel | 2016

// Look for a record. If we find it then 
var elasticsearch = require('elasticsearch');
var logger        = require('./logger.js');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});


// Decide whether to POST or UPDATE
function putpost(domain, state) {
  console.log("putpost initiated");
  if (post_domain(domain, state) == false) {
    logger.log("es_query.putpost:: Document exists, performing update instead");
    logger.log(update_domain(domain, state));
    return true;
  }
}

// look for events that are closed for this domain. If one is open, update it
// otherwise insert a new one. We want one event per up/down cycle
function new_event(domain) {
  //first find the event
  get_id(json_message.data.client, function(hits) {
      
     for (var i = 0, l = hits.length; i < l; i++) {
      var obj = hits[i];
        // found one
        if (obj._source.closed == true) {
          logger.log("CLOSED EVENT MEANS MAKE A NEW ONE");
          post_domain(json_message.data.client, 'down');    
          
        }
     }

  });

  //cycle through it to find one thats not closed
}


// getting the ID won't be needed if we always use the domain as the ID
function get_id(data, fn) {
  client.search({
    index: 'state_table',
    type: 'test',
    body: {
      query: {
        match: {
          domain: data
        }
      }
    }
  }).then(function (resp) {
    var hits = resp.hits.hits;
    console.log(hits);
    fn(hits);
    return hits;

  }, function (err) {
    console.trace(err.message);
  });

}

// Create
function post_domain(domain, state) {
  var err = false;
  client.create({
    index: 'state_table',
    type: 'test',
    id: domain,   //make the id a domain to lock it
    body: {
      domain: domain,
      up_alert: 0,
      down_alert: 0,
      state: state,
      published_at: '2013-01-01',
      counter: 1
    }
  }, function (error, response) {
      
    //console.log(error.displayName);
    if (error !== undefined && error.displayName == 'Conflict') {
       //logger.log("es_query.post_domain:: found conflicting doc.");
       return err;
    }

  });

  return err;

}

function update_domain(domain, state) {
  var err;
  client.update({
    index: 'state_table',
    type: 'test',
    id: domain,
    body: {
      doc: {
        state: state
      }
    }

  }, function (error, response) {
    err = error;
  })

  return err;

} 

// custom field update
function custom_update(domain, custom_key, custom_value) {
  var err;
  client.update({
    index: 'state_table',
    type: 'test',
    id: domain,
    body: {
      doc: {
        [custom_key]: custom_value 
      }
    }
  }, function (error, response) {
    err = error;
  })
  return err;
}


// Export Functions
module.exports.new_event = new_event;
module.exports.custom_update = custom_update;
module.exports.putpost = putpost;
module.exports.update_domain = update_domain;
module.exports.post_domain = post_domain;
module.exports.get_id = get_id;
