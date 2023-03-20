'use strict';

function tokenize(text) {
    const found = text.search(/\#\S+/);
    if (found < 0) {
        return text;
    }
    if (found > 0) {
        return text.substring(0, found);
    }
    const m = text.match(/(\#\S+).*/);
    return m[1];
}

exports.parse = (text) => {
    const hashes = [];
    while (text.length > 0) {
        const token = tokenize(text);
        if (token.match(/^\#.+/)) {
            hashes.push(token);
        }
        text = text.substring(token.length);
    }
    return hashes;
};
