'use strict';

const eejs = require('ep_etherpad-lite/node/eejs');

exports.eejsBlock_styles = (hookName, context) => {
  context.content += eejs.require('./templates/styles.html', {}, module);
};
