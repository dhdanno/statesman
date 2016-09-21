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
    var ex = CHANNEL;

    ch.assertExchange(ex, 'fanout', {durable: false});

    ch.assertQueue('', {exclusive: true}, function(err, q) {
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
      ch.bindQueue(q.queue, ex, '');

      ch.consume(q.queue, function(msg) {

        json_message = msg.content;
        //logger.log("json_message::"+json_message); 
        json_message = JSON.parse(json_message);
        //logger.log(json_message.data);
        logger.log("amqp.connect():: Consumed message:: "+msg.content.toString());
        //Get this users ID
        //es_query.get_id(json_message.data.client);

      //if the last event for this client == up then insert a new down event
      if(json_message.data.state == 'down') {
        logger.log("down state detected");
        es_states.select_last(json_message.data.client, function (hits) {
          //logger.log("Message.state:down. Last Event Was: "+hits[0]._source.event);
          if(hits == null) {
            logger.log("inserting, new record...");
            es_states.insert(json_message.data.client, json_message.data.state);            
          } else if (hits[0]._source.event == 'up') {
	    logger.log("inserting, last record was an up state...");
            es_states.insert(json_message.data.client, json_message.data.state);
          }
        });
      }

      if(json_message.data.state == 'up') {
        es_states.select_last(json_message.data.client, function (hits) {
          logger.log("Message.state:up. Last Event Was: "+hits[0]._source.event);
          if(hits[0]._source.event == 'down') {
            es_states.insert(json_message.data.client, json_message.data.state);
          }
        });
      }       

      }, {noAck: true});

    });
  });
});
