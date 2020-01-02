const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const createError = require('http-errors')
const split = require('split')

const config = require('./config')
const logger = require('./logger')

const app = express()
app.set('env', config.env)

app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || config.server.cors.whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            logger.warn('Not allowed by CORS')
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Accept', 'Content-Type', 'X-API-Key', 'X-Auth-Token', 'X-Refresh-Token']
}))
app.use(morgan('combined', { stream: split().on('data', message => logger.http(message)) }))

const apiRoute = require('./api')
app.use('/api', apiRoute)

app.use((req, res, next) => {
    next(createError.NotFound())
})

app.use((err, req, res, next) => {
    res.locals.message = err.message
    res.locals.error = (config.env === 'dev' || config.env === 'test') ? err : {}

    res.status(err.status || 500)
    res.send(err)
})

module.exports = app
