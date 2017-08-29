'use strict';

var fs = require('fs');
var http = require('http');
var https = require('https');
var net = require('net');
var tls = require('tls');
var stream = require('stream');
var util = require('util');

var PROTOCOLS = { 'http': http, 'https': https };

function Logger (options) {
  stream.Writable.call(this);

  this.tag = options.tag || 'debug';
  this.type = options.type || 'forward';
  this.host = options.host || '127.0.0.1';
  this.port = options.port || 24224;
  this.protocol = options.protocol || 'http';

  if (this.type === 'forward') {
    this.writeStream = net.connect({port: this.port, host: this.host});
  } else if (this.type === 'secure_forward') {
    this.writeStream = tls.connect({port: this.port, host: this.host});
  } else if (this.type === 'http') {
    this.httpOptions = {
      host: this.host,
      port: this.port || 8888,
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }
  } else if (this.type === 'tail') {
    this.filePath = options.filePath;
    this.timeKey = options.timeKey || 'timestamp';

    this.writeStream = fs.createWriteStream(this.filepath);
  }
}

util.inherits(Logger, stream.Writable);

Logger.prototype._write = function (data, encoding, cb) {
  this.send(this.tag, data.toString(), cb);
}

Logger.prototype.send = function (tag, data, cb) {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }

  if (this.type === 'forward' || this.type === 'secure_forward') {
    var timestamp = Math.floor(new Date().valueOf() / 1000);
    var packet = JSON.stringify([tag, timestamp, JSON.parse(data)]);

    this.writeStream.write(packet, cb);
  } else if (this.type === 'http') {
    var query = util.format('json=%s', encodeURIComponent(data));
    this.httpOptions.path = util.format('/%s', tag);

    this.writeStream = PROTOCOLS[this.protocol].request(this.httpOptions).end(query, cb);
  } else if (this.type === 'tail') {
    data[this.timeKey] = new Date().valueOf() / 1000;

    this.writeStream.write(data, cb);
  }
}

Logger.prototype.info = function (data) {
  this.send('info', data);
}

Logger.prototype.debug = function (data) {
  this.send('debug', data);
}

Logger.prototype.warn = function (data) {
  this.send('warn', data);
}

Logger.prototype.fatal = function (data) {
  this.send('fatal', data);
}

Logger.prototype.error = function (data) {
  this.send('error', data);
}

Logger.prototype.trace = function (data) {
  this.send('trace', data);
}

Logger.prototype.end = function () {
  this.writeStream.end();
}

Logger.prototype.destroy = function () {
  this.writeStream.destroy();
}

module.exports = Logger;
