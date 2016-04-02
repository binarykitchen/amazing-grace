amazing-grace
=============

[![Build Status](https://travis-ci.org/binarykitchen/amazing-grace.svg?branch=master)](https://travis-ci.org/binarykitchen/amazing-grace)

A tiny middleware for a sweet graceful shutdown procedure. Just listen to amazing Grace while closing the app. Existing connections will be respected during a configurable timeout while new ones are being refused.

This middleware is recommended if you want to harden your nodejs app for zero down time during production.

## Example

```js
var amazingGrace    = require('amazing-grace'),
    express         = require('express'),

    app    = express(),
    server = http.createServer(app)

// Pass on server instance, required parameter
app.use(amazingGrace(server))
```

## What happens on app.kill('...')?

A graceful shutdown procedure is being initiated, asking the server to close and forcing to close all existing connections after a given `timeout` so that they have a chance to i.E. save data before oblivion.

During that timeout, new connections to the server won't be possible. After that timeout `process.kill(...)` is called and the server is shut down.

## Options (example)

```js
app.use(amazingGrace(server, {log: console.log, timeout: 50}))
```

### log

Default: none

If you wish more debug information, you can pass on the log function directly i.E. `console.log` or even `bunyan.info.bind(bunyan)`, whatever log level you wish. Use of bind() is recommended.

### timeout

Default: 100ms

Depending on your app performance you might want to increase that to make sure no data loss occurs between restarts.

## License

MIT. Copyright (C) [Michael Heuberger](https://binarykitchen.com)

