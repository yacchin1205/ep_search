const db = require('ep_etherpad-lite/node/db/DB').db;


const logPrefix = '[ep_search/noindexsearch]';


/* Legacy Search Logic (traversing all pads) */
class NoIndexSearchEngine {
  async isEmpty() {
    return true;
  }

  getDefaultSerializer() {
    // NOOP
    return () => ({});
  }

  async commit() {
    // NOOP
  }

  async update(pad) {
    // NOOP
  }

  async remove(pad) {
    // NOOP
  }

  async search(searchString) {
    const pads = await db.findKeys('pad:*', '*:*:*');
    const results = await Promise.all(pads.map((pad) => this.searchPad(searchString, pad)));
    const filledResults = results.filter((r) => r.id);
    return filledResults;
  }

  async searchPad(searchString, pad) {
    const padData = await db.get(pad);
    const padText = padData.atext.text || '';
    // does searchString exist in aText?
    if (padText.toLowerCase().indexOf(searchString.toLowerCase()) !== -1) {
      return { id: pad };
    }
    return {};
  }
}

exports.create = () => {
  return new NoIndexSearchEngine();
};
