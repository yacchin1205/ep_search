const solr = require('solr-client');


const logPrefix = '[ep_search/solrsearch]';


class SolrsearchSearchEngine {
    constructor(pluginSettings) {
        console.log(logPrefix, 'Solr settings', Object.keys(pluginSettings));
        this.client = solr.createClient(pluginSettings);
        const { username, password } = pluginSettings;
        if (!username || !password) {
            return;
        }
        this.client.basicAuth(username, password);
    }

    async isEmpty() {
        const results = await this.client.searchAll();
        const { numFound } = results.response || {};
        console.log(logPrefix, 'numFound', numFound);
        return !(numFound > 0);
    }

    async commit() {
        await this.client.commit();
    }

    async update(pad) {
        console.log(logPrefix, 'Pad updated', pad.id);
        const atext = (pad.atext || {}).text || '';
        await this.client.add({
            id: pad.id,
            _text_: atext + ' ' + pad.title,
            atext,
            title: pad.title,
        });
    }

    async remove(pad) {
        console.log(logPrefix, 'Pad removed', pad.id);
        await this.client.deleteByID(pad.id);
    }

    async search(searchString) {
        const results = await this.client.search(`q=${encodeURIComponent(searchString)}`);
        const { docs } = results.response || {};
        return {
            results: docs || [],
        };
    }
}

exports.create = (pluginSettings) => {
    return new SolrsearchSearchEngine(pluginSettings);
};