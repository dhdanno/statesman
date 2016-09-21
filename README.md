# Statesman
## (Node AMQP Subscriber)

## Synopsis
Multi process Node.js app which reacts to mesages on an AMQP bus to maintain the state table. 

1. Receives messages from the up/down detectors, logs them and updates the state table
2. Logs the time down and time up for a client/domain. That constitutes a single event cycle. New table entries are added for new up/down events.

Wambulance reads the state table and is responsible for all alerting.

### Installation
```
npm install
cp statesman.sh /etc/init.d/
chmod +x /etc/init.d/statesman.sh
```

### Running it
```
/etc/init.d/statesman.sh start
or
bin/node_daemon.js
```
Debug mode
```
Start with DEBUG=statesman-ns node lib/app.js
```

## Notes
Designed to be a distributed, scalable microservice.
Multiple processes and instances can listen to the same bus and only process one event each at a time with ACKs.

## Logging
It's preferable to use stdout stderr for logging from the process... but this process is daemonized so when the process is forked we lose the original process and output redirection does not work.

The other facter is the child / worker processes needing to message-pass back to the parent for that style of centralized logging.

I've implemented a simple logging class and call this directly from the spawned children. Unfortunately this hard-codes the logpath. But it works.

## Author
Daniel Korel
Sept, 2016
