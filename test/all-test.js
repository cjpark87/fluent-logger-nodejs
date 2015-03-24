var test = require('tape'),
    debug = require('debug')('fluent-logger-nodejs');

var fs = require('fs'),
    path = require('path'),
    net = require('net'),
    http = require('http'),
    https = require('https');

var Logger = require('../lib/logger');

test('TCP Forwarding', function(t){
    t.plan(1);

    var port = 24224;

    var server = net.createServer(function(socket){
        socket.on('data', function(d){}).on('end', function(){
            debug('tcp/server unbinding');
            server.close(function(){
                debug('tcp/server unbound');
                t.end();
            });
        });
    }).listen(port, '127.0.0.1', function(){
        debug('tcp/server bound');
        t.doesNotThrow(function(){
            var logger = new Logger({});
            logger.info({ message: 'foo' });
            logger.end();
        });
    });

});

test('HTTP', function(t){
    t.plan(1);

    var port = 8080;

    var server = http.createServer(function(req, res){
        debug('http/client connected');
        debug('http/server unbinding');
        req.on('end', function(){
            server.close(function(){
                debug('http/server unbound');
                t.end();
            });
        });
        res.end();
    });

    server.listen(port, function(){
        debug('http/server bound');

        t.doesNotThrow(function(){
            var logger = new Logger({ type: 'http', port: port });
            logger.info({ message: 'foo' });
        });

    });

});

test('HTTPS', function(t){
    t.plan(1);

    var port = 8443;

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    var server = https.createServer({
        key: fs.readFileSync(path.join(__dirname, 'fixtures', 'certs', 'server', 'my-server.key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'fixtures', 'certs', 'server', 'my-server.crt.pem'))
    }, function(req, res){
        debug('https/client connected');
        debug('https/server unbinding');
        req.on('end', function(){
            debug('https/server we done!')
            server.close(function(){
                debug('https/server unbound');
                t.end();
            });
        });
        res.end();
    });

    server.listen(port, function(){
        debug('https/server bound');
        var logger = new Logger({ type: 'http', protocol: 'https', port: port });
        logger.info({ message: 'foo' });
    });

});
