![Publish Status](https://github.com/ether/ep_search/workflows/Node.js%20Package/badge.svg) ![Backend Tests Status](https://github.com/ether/ep_search/workflows/Backend%20tests/badge.svg)

# Description
A search function

DO NOT USE THIS IN PRODUCTION

# Configuration

This plugin uses in-memory fulltext search engine [MiniSearch](https://lucaong.github.io/minisearch/) as the default search engine.

## Using Solr

This plugin can also use [Solr](https://solr.apache.org/) as the search engine.
Add the following to Etherpad's settings file `settings.json`.

```
    "ep_search": {
      "type": "solr", /* To use Solr, specify `solr` for `type`. */
      "host": "solr-host-name", /* The hostname of the Solr service */
      "port": "8983", /* The port number of the Solr service */
      "core": "pad" /* The core name of the Solr index */
    }
```

## Defining Serializer

You can define a serializer to extract the fields you need when indexing the Pad.

```
    "ep_search": {
      ...,
      "padSerializer": "your/serializer/module" /* The module must have a `create(settings)` method, and it must return a function `(pad) => fields` */
    }
```

# TODO
* Add functionality

