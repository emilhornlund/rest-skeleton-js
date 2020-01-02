const path = require('path')
const fs = require('fs')

const basename = path.basename(module.filename)
const models = {}

fs
    .readdirSync(__dirname)
    .filter((file) => {
        return (file.indexOf('.') !== 0) && (file !== basename) & (file.slice(-3) === '.js')
    })
    .forEach((file) => {
        const modelname = file.split('.').slice(0, -1).join('.')
        const modelpath = path.join(__dirname, file)
        models[modelname] = require(modelpath)
    })

module.exports = models
