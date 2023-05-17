'use strict';

const eejs = require('ep_etherpad-lite/node/eejs');

exports.eejsBlock_indexWrapper = (hookName, args, cb) => {
  args.content += eejs.require('ep_weave/templates/search.html', {}, module);
  return cb();
};

exports.eejsBlock_styles = (hookName, context) => {
  context.content += eejs.require('./templates/styles.html', {}, module);
};
