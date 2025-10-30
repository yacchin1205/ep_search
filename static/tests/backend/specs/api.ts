'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');

describe(__filename, function () {
  before(async function () {
    await common.init();
  });

  describe('ep_search plugin', function () {
    it('loads successfully', async function () {
      const plugins = require('ep_etherpad-lite/static/js/pluginfw/plugin_defs');
      if (!plugins.plugins.ep_search) {
        throw new Error('ep_search plugin should be loaded');
      }
    });

    it('registers loadSettings hook', async function () {
      const plugins = require('ep_etherpad-lite/static/js/pluginfw/plugin_defs');
      const hooks = plugins.hooks.loadSettings || [];
      const hasLoadSettings = hooks.some((h: any) => h.hook_fn_name === 'ep_search/index:loadSettings');
      if (!hasLoadSettings) {
        throw new Error('loadSettings hook should be registered');
      }
    });

    it('registers expressCreateServer hook', async function () {
      const plugins = require('ep_etherpad-lite/static/js/pluginfw/plugin_defs');
      const hooks = plugins.hooks.expressCreateServer || [];
      const hasExpressCreateServer = hooks.some((h: any) => h.hook_fn_name === 'ep_search/index:registerRoute');
      if (!hasExpressCreateServer) {
        throw new Error('expressCreateServer hook should be registered');
      }
    });
  });
});
