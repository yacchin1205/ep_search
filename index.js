'use strict';

// Main job is to check pads periodically for activity and notify owners
// when someone begins editing and when someone finishes.
const db = require('ep_etherpad-lite/node/db/DB').db;
const padManager = require('ep_etherpad-lite/node/db/PadManager');
const { createPadSerializer, createSearchEngine } = require('./setup');

// Settings -- EDIT THESE IN settings.json not here..
// var pluginSettings = settings.ep_search;
// var checkFrequency = pluginSettings.checkFrequency || 60000; // 10 seconds

const logPrefix = '[ep_search]';
let searchEngine = null;
let padSerializer = null;
let pluginSettings = {};

/**
 * Load settings hook - receives settings from Etherpad
 */
exports.loadSettings = (hookName, {settings}) => {
  pluginSettings = settings.ep_search || {};
  console.log(logPrefix, 'Settings loaded:', JSON.stringify(pluginSettings, null, 2));
};

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
  let id = pad;
  const m = pad.match(/^pad:(.+)$/);
  if (m) {
    id = m[1];
  }
  const padObject = await padManager.getPad(id);
  try {
    await searchEngine.update(await padSerializer(padObject));
  } finally {
    padManager.unloadPad(id);
  }
}

const indexTasks = new Map();

/**
 * Chain index tasks per pad so that search engine updates are applied in
 * the order of the pad events. A single pad may emit multiple padUpdate
 * events in quick succession (e.g., setHTML clears and then rewrites the
 * pad); without ordering, an add for an older revision can overwrite the
 * latest one.
 *
 * @param {string} id ID of the pad.
 * @param {*} task Async function to be performed for the pad.
 */
function enqueueIndexTask(id, task) {
  const prev = indexTasks.get(id) || Promise.resolve();
  const next = prev.catch(() => undefined).then(task);
  indexTasks.set(id, next);
  const cleanup = () => {
    if (indexTasks.get(id) === next) {
      indexTasks.delete(id);
    }
  };
  next.then(cleanup, cleanup);
  return next;
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
  await searchEngine.update(await padSerializer(pad));
  await searchEngine.commit();
}

/**
 * Register routes.
 */
exports.registerRoute = (hookName, args, cb) => {
  if (!searchEngine) {
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
    searchEngine.search(searchString, req.query)
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
  enqueueIndexTask(pad.id, () => removeAsync(pad))
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
  enqueueIndexTask(pad.id, () => updateAsync(pad))
      .catch((err) => {
          console.error(logPrefix, 'Error occurred', err.stack || err.message || String(err));
      });
  cb(null);
};