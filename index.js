'use strict';

// Main job is to check pads periodically for activity and notify owners
// when someone begins editing and when someone finishes.
const db = require('ep_etherpad-lite/node/db/DB').db;
const settings = require('ep_etherpad-lite/node/utils/Settings');
const { createPadSerializer, createSearchEngine } = require('./setup');

// Settings -- EDIT THESE IN settings.json not here..
// var pluginSettings = settings.ep_search;
// var checkFrequency = pluginSettings.checkFrequency || 60000; // 10 seconds

const logPrefix = '[ep_search]';
let searchEngine = null;
let padSerializer = null;

/**
 * If the indexes in the search engine are empty, index all pads.
 */
async function initializeAllPads() {
  if (!await searchEngine.isEmpty()) {
    return;
  }
  const pads = await db.findKeys('pad:*', '*:*:*');
  await Promise.all(pads.map((pad) => initializePad(pad)));
  await searchEngine.commit();
}

/**
 * Create the index for the pad.
 *
 * @param {*} pad Pad to be indexed.
 */
async function initializePad(pad) {
  const padData = await db.get(pad);
  let id = pad;
  const m = pad.match(/^pad:(.+)$/);
  if (m) {
    id = m[1];
  }
  await searchEngine.update(padSerializer(
    Object.assign({ id }, padData),
  ));
}

/**
 * Remove the index for the pad.
 *
 * @param {*} pad Pad to be removed.
 */
async function removeAsync(pad) {
  if (!searchEngine) {
    console.warn(logPrefix, 'Search engine not yet initialized');
    return;
  }
  await searchEngine.remove(pad);
  await searchEngine.commit();
}

/**
 * Create or update the index for the pad.
 *
 * @param {*} pad Pad to be created / updated.
 */
async function updateAsync(pad) {
  if (!searchEngine) {
    console.warn(logPrefix, 'Search engine not yet initialized');
    return;
  }
  await searchEngine.update(padSerializer(pad));
  await searchEngine.commit();
}

/**
 * Register routes.
 */
exports.registerRoute = (hookName, args, cb) => {
  if (!searchEngine) {
    const pluginSettings = settings.ep_search || {};
    searchEngine = createSearchEngine(pluginSettings);
    padSerializer = createPadSerializer(pluginSettings, searchEngine);
    initializeAllPads()
      .then(() => {
        console.debug(logPrefix, 'Initialized');
      })
      .catch((err) => {
        console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
      });
  }
  args.app.get('/search', (req, res) => {
    const searchString = req.query.query;
    if (!searchString) {
      res.status(400).send({
        error: 'No queries',
      });
      return;
    }
    console.debug(logPrefix, 'Search', searchString);
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

/**
 * Handler for padRemove hook.
 */
exports.padRemoved = (hookName, args, cb) => {
  const { pad } = args;
  removeAsync(pad)
      .then(() => {
          ;
      })
      .catch((err) => {
          console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
      });
  cb(null);
};

/**
 * Handler for padCreate/padUpdate hook.
 */
exports.padChanged = (hookName, args, cb) => {
  const { pad } = args;
  updateAsync(pad)
      .then(() => {
          ;
      })
      .catch((err) => {
          console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
      });
  cb(null);
};