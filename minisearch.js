const MiniSearch = require('minisearch');


const logPrefix = '[ep_weave/minisearch]';


class MinisearchSearchEngine {
    constructor() {
        this.minisearch = new MiniSearch({
            fields: ['atext', 'title'],
            storeFields: ['title'],
        });
    }

    async isEmpty() {
        return true;
    }

    async commit() {
        // NOOP
        console.log(logPrefix, 'Committed');
    }

    async update(pad) {
        console.log(logPrefix, 'Pad updated', pad.id);
        try {
            this.minisearch.remove({
                id: pad.id,
            });
        } catch(e) {
            console.log(logPrefix, 'Remove failed', pad.id);
            console.log(e);
        }
        this.minisearch.add({
            id: pad.id,
            atext: (pad.atext || {}).text || '',
            title: pad.title,
        });
    }

    async remove(pad) {
        console.log(logPrefix, 'Pad removed', pad.id);
        this.minisearch.remove({
            id: pad.id,
        });
    }

    async search(searchString) {
        return {
            results: this.minisearch.search(searchString),
        };
    }
}

exports.create = () => {
    return new MinisearchSearchEngine();
};