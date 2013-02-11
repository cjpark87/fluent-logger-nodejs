fluent-logger-stream
=============

<a href="https://github.com/cjpark87/fluent-logger-nodejs" target="_blank">fluent-logger-stream</a> is a stream-based Fluentd logger for Node.js. It is designed to be plugged into other logger's output stream. It also can be used as an independent logger for Fluentd.

# Installation

	npm install fluent-logger-stream

# Usage
### Create logger object

	var Logger = require('fluent-logger-stream');
	var logger = new Logger({tag: 'debug', type: 'forward', host: '127.0.0.1', port: 24224}); //in_forward
	var logger = new Logger({tag: 'debug', type: 'http', host: '127.0.0.1', port: 8888}); //in_http
	var logger = new Logger({tag: 'debug', type: 'tail', filePath: 'debug.log'}); //in_tail

### As an independent logger module

	var Logger = require('fluent-logger-stream');

	var logger = new Logger({tag: 'debug', type: 'forward', host: '127.0.0.1', port: 24224}); //in_forward

	logger.send('debug', {from: 'userA', to: 'userB'});

### As a writable stream plugin
<a href="https://github.com/cjpark87/fluent-logger-nodejs" target="_blank">fluent-logger-stream</a> is a writable stream. It can be used as an output stream of other loggers. The examples are shown below.

	var FluentLogger = require('fluent-logger-stream');

	var fluentLogger = new FluentLogger({tag: 'debug', type: 'forward', host: '127.0.0.1', port: 24224}); //in_forward

	//bunyan logger
	var log = bunyan.createLogger({
  	  name: 'myapp',
  	  stream: fluentLogger,
  	  level: 'debug'
	});

	//connect logger
	connect.logger({stream: fluentLogger});

	//..and any other logger modules that supports output stream.

# Todos
- add tests
- support more fluentd inputs
- error handlers

# License
The MIT License
