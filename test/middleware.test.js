var cp      = require('child_process'),
    test    = require('tape'),
    request = require('superagent'),

    DEBUG = false

function doRequest(delay, cb) {
    request
        .get('http://localhost:3210/test')
        .query({delay: delay})
        .end(cb)
}

function generateApp(t, killSignal, switchFn) {
    var app = cp.fork(__dirname + '/util/app')

    app.on('error', function(err) {
        t.error(err, 'no error occurs')
    })

    app.on('message', function(message) {
        DEBUG && console.log('<- parent got:', message)

        if (message.err) {
            t.error(message.err, 'no error is thrown')
        } else {
            switchFn.call(app, message)
        }
    })

    app.on('close', function(code, signal) {
        t.equal(signal, killSignal, killSignal + ' ended app')
        t.end()
    })

    return app
}

test('middleware:', function(t) {

    t.test('simple SIGTERM', function(t) {

        generateApp(t, 'SIGTERM', function(message) {

            switch (message.command) {
                case 'ready':
                    this.send({command: 'countConnections'})
                    break

                case 'connectionCount':
                    t.equal(message.count, 0, 'server has zero connections')
                    this.kill('SIGTERM')
                    break
            }
        })
    })

    t.test('simple SIGINT', function(t) {

        generateApp(t, 'SIGINT', function(message) {

            switch (message.command) {
                case 'ready':
                    this.send({command: 'countConnections'})
                    break

                case 'connectionCount':
                    t.equal(message.count, 0, 'server has zero connections')
                    this.kill('SIGINT')
                    break
            }
        })
    })

    t.test('simple SIGUSR2', function(t) {

        generateApp(t, 'SIGUSR2', function(message) {

            switch (message.command) {
                case 'ready':
                    this.send({command: 'countConnections'})
                    break

                case 'connectionCount':
                    t.equal(message.count, 0, 'server has zero connections')
                    this.kill('SIGUSR2')
                    break
            }
        })
    })

    t.test('invalid kill event, then valid kill event', function(t) {

        var app = generateApp(t, 'SIGTERM', function(message) {

            switch (message.command) {
                case 'ready':
                    this.send({command: 'countConnections'})
                    break

                case 'connectionCount':
                    t.equal(message.count, 0, 'server has zero connections')
                    this.kill('SIGPIPE')

                    setTimeout(function() {
                        app.kill('SIGTERM')
                    }, 200)

                    break
            }
        })
    })

    t.test('build 20 valid connections and close them all gracefully', function(t) {

        var app = generateApp(t, 'SIGTERM', function(message) {

            switch (message.command) {
                case 'ready':

                    var j = 20

                    while (j > 0) {
                        doRequest(30, function(err, res) {
                            t.error(err, 'no error is thrown')
                            t.equal(res.status, 200, 'status is 200')
                        })
                        j--
                    }

                    setTimeout(function() {
                        app.send({command: 'countConnections'})
                    }, 20)

                    break

                case 'connectionCount':
                    t.ok(message.count > 5, 'server has more than 5 open connections')
                    this.kill('SIGTERM')
                    break
            }
        })
    })

    t.test('forcefully shut down long during connections', function(t) {

        var app = generateApp(t, 'SIGTERM', function(message) {

            switch (message.command) {
                case 'ready':

                    var j = 5

                    while (j > 0) {
                        doRequest(100, function(err, res) {
                            t.equal(err.code, 'ECONNRESET', 'ECONNRESET is thrown')
                            t.notOk(res, 'res is undefined')
                        })
                        j--
                    }

                    setTimeout(function() {
                        app.send({command: 'countConnections'})
                    }, 20)

                    break

                case 'connectionCount':
                    t.ok(message.count > 3, 'server has more than 3 open connections')
                    this.kill('SIGTERM')
                    break
            }
        })
    })

    t.test('do not accept new connections when shutting down', function(t) {

        var app = generateApp(t, 'SIGINT', function(message) {

            switch (message.command) {
                case 'ready':

                    var j = 5

                    while (j > 0) {
                        doRequest(30, function(err, res) {
                            t.error(err, 'no error is thrown')
                            t.equal(res.status, 200, 'status is 200')
                        })
                        j--
                    }

                    setTimeout(function() {
                        app.send({command: 'countConnections'})
                    }, 20)

                    break

                case 'connectionCount':
                    t.ok(message.count > 3, 'server has more than 3 open connections')
                    this.kill('SIGINT')

                    var j = 5

                    while (j > 0) {
                        doRequest(5, function(err, res) {
                            t.equal(err.code, 'ECONNREFUSED', 'ECONNREFUSED is thrown')
                            t.notOk(res, 'res is undefined')
                        })
                        j--
                    }

                    break
            }
        })
    })
})
