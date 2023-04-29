'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('ep_etherpad-lite/node/db/DB').db;
const api = require('ep_etherpad-lite/node/db/API');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const removeMdBase = require('remove-markdown');

const logPrefix = '[ep_search]';
let searchEngine = null;


function removeMd(baseText) {
    const text = removeMdBase(baseText);
    const m = text.match(/^\*+(.+)$/);
    if (m) {
        return m[1];
    }
    return text;
}

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

async function getPadIdsByTitle(title) {
    const { results } = await searchEngine.search(`title:"${title}"`);
    if (!results) {
        return null;
    }
    const ids = results
        .filter((result) => result.title === title)
        .map((result) => result.id);
    if (ids.length === 0) {
        return null;
    }
    ids.sort();
    console.log(logPrefix, 'Redirecting...', title, ids[0]);
    return ids;
}

async function createNewPadForTitle(title, req) {
    console.log('Create pad', title);
    const padId = uuidv4();
    await api.createPad(padId, `${title}\n\n`);
    return padId;
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
    const { app } = args;
    app.get('/search', (req, res) => {
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
    app.get('/t/:title', (req, res) => {
        const { title } = req.params;
        getPadIdsByTitle(title)
            .then((ids) => {
                if (ids === null) {
                    createNewPadForTitle(title, req)
                        .then((id) => {
                            res.redirect(`/p/${id}`);
                        })
                        .catch((err) => {
                            console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
                            res.status(500).send({
                                error: err.toString(),
                            });
                        });
                    return;
                }
                res.redirect(`/p/${ids[0]}`);
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