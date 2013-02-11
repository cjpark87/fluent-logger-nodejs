'use strict';

var fs = require('fs');
var http = require('http');
var net = require('net');
var stream = require('stream');
var util = require('util');

function Logger (options) {
  this.writable = true;

  this.tag = options.tag || 'debug';
  this.type = options.type || 'forward';
  this.host = options.host || '127.0.0.1';
  this.port = options.port || 24224;

  if (this.type === 'forward') {
    this.writeStream = net.connect({port: this.port, host: this.host});
  } else if (this.type === 'http') {
    this.httpOptions = {
      host: this.host,
      port: options.port || 8888,
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }
  } else if (this.type === 'tail') {
    this.filePath = options.filePath;
    this.timeKey = options.timeKey || 'timestamp';

    this.writeStream = fs.createWriteStream(this.filepath);
  }
}

util.inherits(Logger, stream.Stream);

Logger.prototype.write = function (data, encoding) {
  this.send(this.tag, data);
}

Logger.prototype.send = function (tag, data) {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }

  if (this.type === 'forward') {
    var timestamp = new Date().valueOf() / 1000;
    var packet = JSON.stringify([tag, timestamp, JSON.parse(data)]);

    this.writeStream.write(packet);
  } else if (this.type === 'http') {
    var query = util.format('json=%s', encodeURIComponent(data));
    this.httpOptions.path = util.format('/%s', tag);

    http.request(this.httpOptions, function (res) {}).end(query);
  } else if (this.type === 'tail') {
    data[this.timeKey] = new Date().valueOf() / 1000;

    this.writeStream.write(data);
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
