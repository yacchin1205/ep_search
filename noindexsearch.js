const db = require('ep_etherpad-lite/node/db/DB').db;


const logPrefix = '[ep_weave/noindexsearch]';


class NoIndexSearchEngine {
    async isEmpty() {
        return true;
    }

    async commit() {
        // NOOP
        console.log(logPrefix, 'Committed');
    }

    async update(pad) {
        // NOOP
        console.log(logPrefix, 'Pad updated', pad);
    }

    async remove(pad) {
        // NOOP
        console.log(logPrefix, 'Pad removed', pad);
    }

    async search(searchString) {
        const pads = await db.findKeys('pad:*', '*:*:*');
        const results = await Promise.all(pads.map((pad) => this.searchPad(searchString, pad)));
        const filledResults = results.filter((r) => r.id);
        if (filledResults.length === 0) {
            return {};
        }
        return {
            results: filledResults,
        };
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