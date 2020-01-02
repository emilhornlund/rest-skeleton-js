const winston = require('winston')
const path = require('path')
const config = require('./config')

const levels = { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 }

const logger = winston.createLogger({
    level: config.log.level,
    levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports: (() => {
        const transports = []
        if (config.env === 'dev' || config.env === 'prod') {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.cli(),
                    winston.format.splat()
                )
            }))
            Object.entries(levels).forEach(([key, value]) => {
                if (value <= levels[config.log.level]) {
                    transports.push(new winston.transports.File({
                        filename: path.resolve(__dirname, '../', 'logs', `${key}.log`),
                        level: key
                    }))
                }
            })
            transports.push(new winston.transports.File({
                filename: path.resolve(__dirname, '../', 'logs', 'combined.log')
            }))
        } else if (config.env === 'test') {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.cli(),
                    winston.format.splat()
                )
            }))
        }
        return transports
    })()
})

module.exports = (() => {
    return Object.keys(levels).reduce((map, level) => {
        map[level] = function () {
            logger[level].apply(logger, formatLogArguments(arguments))
        }
        return map
    }, {})
})()

logger.stream = {
    write: function (message) {
        logger.info(message)
    }
}

module.exports.stream = logger.stream

const formatLogArguments = args => {
    args = Array.prototype.slice.call(args)
    const stackInfo = getStackInfo(1)
    if (stackInfo) {
        const calleeStr = '(' + stackInfo.relativePath + ':' + stackInfo.line + '): '
        if (typeof (args[0]) === 'string') {
            args[0] = calleeStr + args[0]
        } else {
            args.unshift(calleeStr)
        }
    }
    return args
}

const getStackInfo = stackIndex => {
    const stacklist = (new Error()).stack.split('\n').slice(3)
    const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
    const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi
    const s = stacklist[stackIndex] || stacklist[0]
    const sp = stackReg.exec(s) || stackReg2.exec(s)
    if (sp && sp.length === 5) {
        return {
            method: sp[1],
            relativePath: path.relative(path.resolve(__dirname, '../'), sp[2]),
            line: sp[3],
            pos: sp[4],
            file: path.basename(sp[2]),
            stack: stacklist.join('\n')
        }
    }
}
