const { NotNullViolationError } = require('../errors')

/**
 * Asynchronously unwrap value
 * @param value
 * @param {string} key
 * @param {any} defaultValue
 * @returns {Promise<NotNullViolationError | *>}
 */
exports.unwrapValue = (value, key, defaultValue) => {
    if (value !== undefined && value !== null) return Promise.resolve(value)
    else if (defaultValue) return Promise.resolve(defaultValue)
    else return Promise.reject(new NotNullViolationError(key))
}

/**
 * Asynchronously unwrap object value by key
 * @param {object} parent
 * @param {string} key
 * @param {any} defaultValue
 * @returns {Promise<NotNullViolationError | *>}
 */
exports.unwrapObjectValue = (parent, key, defaultValue) => {
    if (parent !== undefined && parent !== null &&
        parent[key] !== undefined && parent[key] !== null) return Promise.resolve(parent[key])
    else if (defaultValue) return Promise.resolve(defaultValue)
    else return Promise.reject(new NotNullViolationError(key))
}

/**
 * Synchronously unwrap object value by key
 * @param {object} parent
 * @param {string} key
 * @param {any} defaultValue
 * @returns {*}
 */
exports.unwrapObjectValueSync = (parent, key, defaultValue) => {
    return (parent !== undefined && parent !== null && parent[key] !== undefined && parent[key] !== null) ? parent[key] : defaultValue
}
