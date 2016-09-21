#!/usr/bin/env node

// Recieve Messages

// the event we are listening on is a new message on the rabbitmq bus.
// When a new message comes in, we decide what to do with it.
// In this case perform logic to decide how and if to alert.

var CHANNEL  = "CHAN";
var AMQPHOST = "localhost";

var amqp     = require('amqplib/callback_api');
var logger   = require('./logger.js');
var es_query = require('./es_query.js');
var es_states= require('./es_states.js');

logger.log("app.js:: child process started");

// Connect to Rabbit, create a non-persistent channel and write messages out to
// logfile when received. Currently noack
amqp.connect('amqp://'+AMQPHOST, function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = CHANNEL;
    var result = 'nulling';

    ch.assertQueue(q, {durable: false});
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);

    ch.consume(q, function(msg) {

      json_message = msg.content;
      //logger.log("json_message::"+json_message); 
      json_message = JSON.parse(json_message);
      //logger.log(json_message.data);
      logger.log("amqp.connect():: Consumed message:: "+msg.content.toString());
      //Get this users ID
      //es_query.get_id(json_message.data.client);

      es_states.insert(json_message.data.client, json_message.data.state);

      es_states.select_last(json_message.data.client);

      if(json_message.data.state == 'down') {
       
        //es_states.insert(json_message.data.client, json_message.data.state);
        //result = es_query.putpost(json_message.data.client, 'down');
      
      } else if (json_message.data.state == 'up') {
        //logger.log("HERE:::" + json_message.data.client); 
        //result = es_query.putpost(json_message.data.client, 'up');
        //mark this record as closed       
        //es_query.custom_update(json_message.data.client, 'closed', true ); 
      } 


      logger.log("amqp.connect():: putpost result: "+result);


    }, {noAck: true});

  });
});
