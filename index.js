var TERM_SIGNALS = [
        'SIGTERM',
        'SIGINT',
        'SIGUSR2' // SIGUSR2 is for nodemon
    ]

module.exports = function(server, options) {

    var closing = false

    options         = options || {}
    options.timeout = options.timeout || 100
    options.log     = options.log || function() {}

    function attemptGracefulShutdown(server, signal) {

        function forcefulShutdown() {
            options.log("Could not close connections in %sms, forcefully shutting down", options.timeout)
            process.kill(process.pid, signal)
        }

        var graceTimer = setTimeout(forcefulShutdown, options.timeout)

        closing = true

        options.log(
            "Received %s at %s, shutting down gracefully in %sms",
            signal,
            new Date().toString('T'),
            options.timeout
        )

        function exitWithSuccess() {
            clearTimeout(graceTimer)

            options.log('Closed out remaining connections')

            process.kill(process.pid, signal)
        }

        server.close(exitWithSuccess)
    }

    // Bind listeners to process for specified signal types
    server.on('listening', function() {
        TERM_SIGNALS.forEach(function(signal) {
            process.once(signal, function() {
                attemptGracefulShutdown(server, signal)
            })
        })
    })

    // Return middleware
    return function(req, res, next) {
        if (closing) {
            // Just kill keep-alive. Better than manually sending 502 or 503, because
            // there is already code for that, see http://www.senchalabs.org/connect/timeout.html
            req.connection.setTimeout(1)
        }

        next()
    }
}
