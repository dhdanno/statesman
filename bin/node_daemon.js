#!/usr/bin/env node

// Everything above this line will be executed twice
require('daemon')();

// Debugging (start with DEBUG=wambulance-ns node lib/app.js)
const debug = require('debug')('wambulance-ns')
const name = 'wambulance'
debug('booting %s', name)

var cluster = require('cluster');
var stdout = '';

// Number of CPUs
//var numCPUs = require('os').cpus().length;
var numCPUs = 1;
/**
 * Creates a new worker when running as cluster master.
 * Runs the HTTP server otherwise.
 */
function createWorker() {
  if (cluster.isMaster) {
    // Fork a worker if running as cluster master
    var child = cluster.fork();

    // Respawn the child process after exit
    // (ex. in case of an uncaught exception)
    child.on('exit', function (code, signal) {
      createWorker();
    });
  } else {
    // Run the app if running as worker
    require('../lib/app');
  }
}

/**
 * Creates the specified number of workers.
 * @param  {Number} n Number of workers to create.
 */
function createWorkers(n) {
  while (n-- > 0) {
    createWorker();
  }
}

/**
 * Kills all workers with the given signal.
 * Also removes all event listeners from workers before sending the signal
 * to prevent respawning.
 * @param  {Number} signal
 */
function killAllWorkers(signal) {
  var uniqueID,
      worker;

  for (uniqueID in cluster.workers) {
    if (cluster.workers.hasOwnProperty(uniqueID)) {
      worker = cluster.workers[uniqueID];
      worker.removeAllListeners();
      worker.process.kill(signal);
    }
  }
}

/**
 * Restarts the workers.
 */
process.on('SIGHUP', function () {
  killAllWorkers('SIGTERM');
  createWorkers(numCPUs * 2);
});

process.on('SIGTERM', function () {
  if (server === undefined) return;
  server.close(function () {
    // Disconnect from cluster master
    process.disconnect && process.disconnect();
  });
});

/**
 * Gracefully Shuts down the workers.
 */
process.on('SIGTERM', function () {
  killAllWorkers('SIGTERM');
});

// Create two children for each CPU
createWorkers(numCPUs * 2);
