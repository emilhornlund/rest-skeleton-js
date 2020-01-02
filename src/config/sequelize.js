const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const migration = {
    migrationStorage: 'json',
    migrationStoragePath: path.resolve(__dirname, '../../', 'sequelize-meta.json'),
    seederStorage: 'json',
    seederStoragePath: path.resolve(__dirname, '../../', 'sequelize-data.json')
}

module.exports = (() => {
    const configPath = path.resolve(__dirname, '../../', 'config.yml')
    const configData = fs.readFileSync(configPath, 'utf8')
    return yaml.safeLoadAll(configData).reduce((config, doc) => {
        config[doc.env] = Object.assign(doc.db, migration)
        return config
    }, {})
})()
