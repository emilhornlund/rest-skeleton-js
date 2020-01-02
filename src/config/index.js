const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

module.exports = (() => {
    const configPath = path.resolve(__dirname, '../../', 'config.yml')
    const configData = fs.readFileSync(configPath, 'utf8')
    return yaml.safeLoadAll(configData)
        .filter(doc => doc.env === (process.env.NODE_ENV || 'dev'))[0]
})()
