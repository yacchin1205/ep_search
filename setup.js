function createPadSerializer(pluginSettings, searchEngine) {
  const { padSerializer } = pluginSettings;
  if (!padSerializer) {
    return searchEngine.getDefaultSerializer();
  }
  const pathSegments = padSerializer.split('/');
  if (!pathSegments.every((pathSegment) => pathSegment !== '.' && pathSegment !== '..')) {
    throw new Error('. and .. are not allowed for property `padSerializer` ');
  }
  const module = require(padSerializer);
  return module.create(pluginSettings);
}

function createSearchEngine(pluginSettings) {
  const { type } = pluginSettings;
  if (type === 'legacy') {
    const noindexsearch = require('./search-engine/noindexsearch');
    return noindexsearch.create(pluginSettings);
  }
  if (type === 'solr') {
    const solrsearch = require('./search-engine/solrsearch');
    return solrsearch.create(pluginSettings);
  }
  // Default
  if (type && type !== 'minisearch') {
    throw new Error(`Unknown type of search engine: ${type}`);
  }
  const minisearch = require('./search-engine/minisearch');
  return minisearch.create(pluginSettings);
}

exports.createPadSerializer = createPadSerializer;
exports.createSearchEngine = createSearchEngine;