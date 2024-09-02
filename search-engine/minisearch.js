const MiniSearch = require('minisearch');


const logPrefix = '[ep_search/minisearch]';


/* Search using MiniSearch */
class MiniSearchSearchEngine {
  constructor() {
    this.minisearch = new MiniSearch({
      fields: ['atext'],
      storeFields: [],
    });
  }

  getDefaultSerializer() {
    return (pad) => ({
      id: pad.id,
      atext: (pad.atext || {}).text || '',
    })
  }

  async isEmpty() {
    return this.minisearch.documentCount === 0;
  }

  async commit() {
    // NOOP
  }

  async update(pad) {
    console.debug(logPrefix, 'Pad updated', pad.id);
    if (this.minisearch.has(pad.id)) {
      this.minisearch.remove({
        id: pad.id,
      });
    }
    this.minisearch.add(Object.assign({}, pad));
  }

  async remove(pad) {
    console.debug(logPrefix, 'Pad removed', pad.id);
    this.minisearch.remove({
      id: pad.id,
    });
  }

  async search(searchString) {
    const docs = this.minisearch.search(searchString);
    return {
      numFound: docs.length,
      start: 0,
      numFoundExact: true,
      docs,
    };
  }
}

exports.create = () => {
  return new MiniSearchSearchEngine();
};
