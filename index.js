'use strict';

const absolutePaths = require('ep_etherpad-lite/node/utils/AbsolutePaths');
const argv = require('ep_etherpad-lite/node/utils/Cli').argv;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const settings = require('ep_etherpad-lite/node/utils/Settings');
const api = require('ep_etherpad-lite/node/db/API');
const { createSearchEngine } = require('ep_search/setup');

const logPrefix = '[ep_weave]';
let apikey = null;

async function getPadIdsByTitle(searchEngine, title) {
  const results = await searchEngine.search(`title:"${title}"`);
  console.debug(logPrefix, `Search by title ${title}`, results);
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
  console.info(logPrefix, 'Redirecting...', title, ids[0]);
  return ids;
}

async function createNewPadForTitle(title, req) {
  console.info(logPrefix, 'Create pad', title);
  const padId = uuidv4();
  const body = req.query.body || '';
  await api.createPad(padId, `${title}\n\n${body}`);
  return padId;
}

exports.registerRoute = (hookName, args, cb) => {
    const pluginSettings = settings.ep_search || {};
    const searchEngine = createSearchEngine(pluginSettings);
    const apikeyFilename = absolutePaths.makeAbsolute(argv.apikey || './APIKEY.txt');
    try {
      apikey = fs.readFileSync(apikeyFilename, 'utf8');
      console.info(logPrefix, `Api key file read from: "${apikeyFilename}"`);
    } catch (e) {
      console.warn(logPrefix, `Api key file "${apikeyFilename}" cannot read.`);
    }
    const apikeyChecker = (req, res, next) => {
      const reqApikey = req.query.apikey || '';
      if (!reqApikey.trim()) {
        return res.status(401).send('Authentication Required');
      }
      if (reqApikey.trim() !== apikey.trim()) {
        return res.status(403).send('Unauthorized');
      }
      next();
    };
    const searchHandler = (req, res) => {
        const searchString = req.query.query || req.query.q;
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
    };
    const { app } = args;
    app.get('/api/ep_weave/search', apikeyChecker, searchHandler);
    app.get('/t/:title', (req, res) => {
      const { title } = req.params;
      getPadIdsByTitle(searchEngine, title)
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
