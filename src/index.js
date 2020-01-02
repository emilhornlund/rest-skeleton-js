#!/usr/bin/node

const https = require('https')
const fs = require('fs')
const path = require('path')
const app = require('./app')
const config = require('./config')
const logger = require('./logger')

const server = https.createServer({
    key: fs.readFileSync(path.resolve(__dirname, '../', config.server.https.key), 'utf8'),
    cert: fs.readFileSync(path.resolve(__dirname, '../', config.server.https.cert), 'utf8'),
    requestCert: config.server.https.requestCert,
    rejectUnauthorized: config.server.https.rejectUnauthorized
}, app)
const port = process.env.PORT || config.server.port
app.set('port', port)

server.listen(port)

server.on('error', error => {
    if (error.syscall !== 'listen') {
        throw error
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

    switch (error.code) {
    case 'EACCES':
        logger.error(bind + ' requires elevated privileges')
        process.exit(1)
    case 'EADDRINUSE':
        logger.error(bind + ' is already in use')
        process.exit(1)
    default:
        throw error
    }
})

server.on('listening', () => {
    const addr = server.address()
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
    logger.info('Listening on ' + bind)
})
