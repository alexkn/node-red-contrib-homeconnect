class HomeConnectError extends Error {
    /**
     * @param {number} code
     * @param {string} key
     * @param {string} description
     */
    constructor(code, key, description) {
        super(key + ': ' + description);
        this.name = 'HomeConnectError';
        this.code = code;
        this.key = key;
        this.description = description;
    }
}

module.exports = HomeConnectError;
