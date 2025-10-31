'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');

let agent: any;

describe(__filename, function () {
  before(async function () {
    agent = await common.init();
  });

  describe('ep_search plugin', function () {
    it('loads successfully', async function () {
      const plugins = require('ep_etherpad-lite/static/js/pluginfw/plugin_defs');
      if (!plugins.plugins.ep_search) {
        throw new Error('ep_search plugin should be loaded');
      }
    });

    it('search endpoint is available', async function () {
      // Just check that the search endpoint responds (even if it returns empty results)
      const res = await agent.get('/search?query=test');
      // We expect either 200 (with results) or 200 (without results), not 404
      if (res.status === 404) {
        throw new Error('Search endpoint should be available');
      }
    });
  });
});
