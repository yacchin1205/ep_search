const solr = require('./solr-client');


const logPrefix = '[ep_search/solrsearch]';


/**
 * Search using Solr
 * The Solr core must have the fields defined in `example/solr/pad/conf/schema.xml`.
 */
class SolrsearchSearchEngine {
  constructor(pluginSettings) {
    console.debug(logPrefix, 'Solr settings', Object.keys(pluginSettings));
    this.client = solr.createClient(pluginSettings);
    const { username, password } = pluginSettings;
    if (!username || !password) {
      return;
    }
    this.client.basicAuth(username, password);
  }

  getDefaultSerializer() {
    return (pad) => {
      const atext = (pad.atext || {}).text || '';
      return {
        indexed: new Date().toISOString(),
        id: pad.id,
        _text_: atext,
        atext,
      };
    };
  }

  async isEmpty() {
    const results = await this.client.searchAll();
    const { numFound } = results.response || {};
    console.debug(logPrefix, 'numFound', numFound);
    return !(numFound > 0);
  }

  async commit() {
    await this.client.commit();
  }

  async update(pad) {
    console.debug(logPrefix, 'Pad updated', pad.id);
    await this.client.add(pad);
  }

  async remove(pad) {
    console.debug(logPrefix, 'Pad removed', pad.id);
    await this.client.deleteByID(pad.id);
  }

  async search(searchString, solrOpts) {
    const opts = [];
    if (solrOpts && solrOpts.sort) {
      opts.push(`sort=${encodeURIComponent(solrOpts.sort)}`);
    }
    const results = await this.client.search(`q=${encodeURIComponent(searchString)}&${opts.join('&')}`);
    const { docs } = results.response || {};
    return docs || [];
  }
}

exports.create = (pluginSettings) => {
  return new SolrsearchSearchEngine(pluginSettings);
};
