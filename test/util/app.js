var amazingGrace    = require('./../../'),
    express         = require('express'),
    http            = require('http'),

    app    = express(),
    server = http.createServer(app),

    DEBUG = false

var log = DEBUG ? console.log : function() {}

app.use(amazingGrace(server, {log: log, timeout: 50}))

app.get('/test', function(req, res) {

    var delay = req.param('delay') ? req.param('delay') : 30

    log('GET /test', delay)

    setTimeout(function() {
        res.status(200).end()
    }, delay)
})

process.on('message', function(message) {
    log('-> child got:', message)

    switch (message.command) {
        case 'countConnections':
            server.getConnections(function(err, count) {
                if (err) {
                    process.send({err: err})
                } else {
                    process.send({command: 'connectionCount', count: count})
                }
            })
            break
        default:
            console.error('Unknown command', message)
            break
    }
})

server.listen(3210, function() {
    process.send({command: 'ready'})
})
