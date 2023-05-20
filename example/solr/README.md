# Example of Solr configuration

To try this Solr setup, execute the following command:

```
docker build -t ether/ep_search/solr .
docker run --rm -p 8983:8983 --name ep_search-solr -d ether/ep_search/solr
```

A Solr server with this configuration is started as a container named `ep_search-solr`.

Then add the following settings to `settings.json` and restart etherpad-lite.

```
  "ep_search": {
    "type": "solr",
    "host": "localhost",
    "port": "8983",
    "core": "pad"
  },
```