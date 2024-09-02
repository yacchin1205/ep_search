const nodeFetch = require('node-fetch');

const Headers = nodeFetch.Headers;
const fetch = nodeFetch.default;

exports.createClient = ({host, port, core}) => {
  const baseUrl = `http://${host}:${port}/solr/${core}/`;

  const headers = new Headers();

  return {
    basicAuth: (username, password) => {
      headers.set('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
    },
    searchAll: async () => {
      const response = await fetch(`${baseUrl}select?q=*:*`, {headers});
      if (!response.ok) {
        throw new Error(`Error fetching data from Solr: ${response.statusText}, ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    search: async (query) => {
      const response = await fetch(`${baseUrl}select?${query}`, {headers});
      if (!response.ok) {
        throw new Error(`Error fetching data from Solr: ${response.statusText}, ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    add: async (newIndex) => {
      const response = await fetch(`${baseUrl}update/json/docs`, {
        method: 'POST',
        headers: {...headers, 'Content-Type': 'application/json'},
        body: JSON.stringify(newIndex),
      });
      if (!response.ok) {
        throw new Error(`Error adding data to Solr: ${response.statusText}, ${response.status}`);
      }
      return response.json();
    },
    deleteByID: async (indexID) => {
      const response = await fetch(`${baseUrl}update`, {
        method: 'POST',
        headers: {...headers, 'Content-Type': 'application/json'},
        body: JSON.stringify({delete: {id: indexID}}),
      });
      if (!response.ok) {
        throw new Error(`Error deleting data from Solr: ${response.statusText}, ${response.status}`);
      }
      return response.json();
    },
    commit: async () => {
      const response = await fetch(`${baseUrl}update`, {
        method: 'POST',
        headers: {...headers, 'Content-Type': 'application/json'},
        body: JSON.stringify({commit: {}}),
      });
      if (!response.ok) {
        throw new Error(`Error committing data to Solr: ${response.statusText}, ${response.status}`);
      }
      return response.json();
    },
  };
};
