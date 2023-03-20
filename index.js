'use strict';

const db = require('ep_etherpad-lite/node/db/DB').db;
const settings = require('ep_etherpad-lite/node/utils/Settings');
const removeMd = require('remove-markdown');

const logPrefix = '[ep_search]';
let searchEngine = null;


function createSearchEngine() {
    const pluginSettings = settings.ep_search || {};
    const { type } = pluginSettings;
    if (type === 'dummy') {
        const noindexsearch = require('./noindexsearch');
        return noindexsearch.create();
        }
    if (type === 'solr') {
        const solrsearch = require('./solrsearch');
        return solrsearch.create(pluginSettings);
    }
    const minisearch = require('./minisearch');
    return minisearch.create();
}

async function initializeAllPads() {
    if (!await searchEngine.isEmpty()) {
        return;
    }
    const pads = await db.findKeys('pad:*', '*:*:*');
    await Promise.all(pads.map((pad) => initializePad(pad)));
    await searchEngine.commit();
}

function extractTitle(padData) {
    const lines = (padData.atext || {}).text.split('\n');
    return removeMd(lines[0]);
}

async function initializePad(pad) {
    const padData = await db.get(pad);
    let id = pad;
    const m = pad.match(/^pad:(.+)$/);
    if (m) {
        id = m[1];
    }
    await searchEngine.update(Object.assign({
        id,
        title: extractTitle(padData),
    }, padData));
}

async function padChangedAsync(hookName, args) {
    if (!searchEngine) {
        return;
    }
    const { pad } = args;
    if (hookName === 'padRemove') {
        await searchEngine.remove(pad);
        return;
    }
    await searchEngine.update(Object.assign({
        title: extractTitle(pad),
    }, pad));
    await searchEngine.commit();
}

exports.registerRoute = (hookName, args, cb) => {
    if (!searchEngine) {
        searchEngine = createSearchEngine();
        initializeAllPads()
            .then(() => {
                console.log(logPrefix, 'Initialized');
            })
            .catch((err) => {
                console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
            });
    }
    args.app.get('/search', (req, res) => {
        const searchString = req.query.query;
        searchEngine.search(searchString)
            .then((result) => {
                res.send(JSON.stringify(result));
            })
            .catch((err) => {
                console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
                res.status(500).send({
                    error: err.toString(),
                });
            });
    });
    cb(null);
};

exports.padChanged = (hookName, args, cb) => {
    padChangedAsync(hookName, args)
        .then(() => {
            ;
        })
        .catch((err) => {
            console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
        });
    cb(null);
};