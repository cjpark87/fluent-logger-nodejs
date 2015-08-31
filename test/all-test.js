var test = require('tape'),
    destroyer = require('server-destroy'),
    debug = require('debug')('fluent-logger-nodejs');

var fs = require('fs'),
    path = require('path'),
    net = require('net'),
    tls = require('tls'),
    http = require('http'),
    https = require('https');

var Logger = require('../lib/logger');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

test('TCP Forwarding', function(t){
    t.plan(1);

    var port = 24224,
        logData = { message: 'foo' };

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
            var logger = new Logger({ port: port });
            logger.info(logData);
            logger.end();
        });
    });

});

test('Secure TCP Forwarding', function(t){
    t.plan(1);

    var port = 24225,
        logData = { message: 'foo' };

    var server = tls.createServer({
        key: fs.readFileSync(path.join(__dirname, 'fixtures', 'certs', 'server', 'my-server.key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'fixtures', 'certs', 'server', 'my-server.crt.pem'))
    }, function(socket){
        socket.on('data', function(d){}).on('end', function(){
            debug('tls/server unbinding');
            server.close(function(){
                debug('tls/server unbound');
                t.end();
            });
        });
    }).listen(port, '127.0.0.1', function(){
        debug('tls/server bound');
        t.doesNotThrow(function(){
            var logger = new Logger({ type: 'secure_forward', port: port });
            logger.info(logData);
            logger.end();
        });
    });

});

test('HTTP', function(t){
    t.plan(1);

    var port = 8080,
        logData = { message: 'foo' };

    var server = http.createServer(function(req, res){
        debug('http/client connected');
        res.end();
        req.connection.destroy();
        req.on('end', function(){
            debug('http/client ended connection');
            server.destroy();
        });
        server.on('close', function(){
            debug('http/server unbound');
            t.end();
        });
    });

    destroyer(server);

    server.listen(port, function(){
        debug('http/server bound');
        t.doesNotThrow(function(){
            var logger = new Logger({ type: 'http', port: port });
            logger.info(logData);
        });

    });

});

test('HTTPS', function(t){
    t.plan(1);

    var port = 8443,
        logData = { message: 'foo' };

    var server = https.createServer({
        key: fs.readFileSync(path.join(__dirname, 'fixtures', 'certs', 'server', 'my-server.key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'fixtures', 'certs', 'server', 'my-server.crt.pem'))
    }, function(req, res){
        debug('https/client connected');
        res.end();
        req.connection.destroy();
        req.on('end', function(){
            debug('https/client ended connection');
            server.destroy();
        });
        server.on('close', function(){
            debug('https/server unbound');
            t.end();
        });
    });

    destroyer(server);

    server.listen(port, function(){
        debug('https/server bound');
        t.doesNotThrow(function(){
            var logger = new Logger({ type: 'http', protocol: 'https', port: port });
            logger.info(logData);
        });
    });

});
