'use strict';

const removeMdBase = require('remove-markdown');


const logPrefix = '[ep_weave]';


function removeMd(baseText) {
  const text = removeMdBase(baseText);
  const m = text.match(/^\*+(.+)$/);
  if (m) {
    return m[1];
  }
  return text;
}

function extractTitle(padData) {
    const lines = (padData.atext || {}).text.split('\n');
    return removeMd(lines[0]);
}

exports.create = (pluginSettings) => {
  return (pad) => {
    const atext = (pad.atext || {}).text || '';
    const result = {
      indexed: new Date().toISOString(),
      id: pad.id,
      _text_: atext,
      atext,
      title: extractTitle(pad),
    };
    console.debug(logPrefix, 'serialize', pad, result);
    return result;
  };
}