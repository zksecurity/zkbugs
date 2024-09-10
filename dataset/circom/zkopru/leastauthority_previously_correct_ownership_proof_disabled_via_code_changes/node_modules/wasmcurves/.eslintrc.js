module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "mocha": true,
        "es2020": true
    },
    "globals": {
        "WebAssembly": true
    },
    "parserOptions": {
        "ecmaVersion": 2020
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
