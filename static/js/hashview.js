'use strict';

const parser = require('./parser');


const logPrefix = '[ep_search/hashview]';
let currentHashes = [];
let myPad = null;
const ACE_EDITOR_TAG = 'searchHash';
const ACE_EDITOR_MODIFIER_PATTERN = /(^| )searchHash:(\S+)/g;
const ACE_EDITOR_CLASS = 'hashview-editor-link';

exports.postAceInit = (hook, context) => {
    const { pad } = context;
    myPad = {
        id: pad.getPadId(),
    };
    console.log('Pad', pad);
};

exports.aceEditEvent = (hook, context) => {
    if ($('#hashview').length === 0) {
        return;
    }
    let hashes = parser.parse((context.rep || {}).alltext || '');
    if (myPad) {
        const myHash = `#${myPad.id}`;
        hashes = [myHash].concat(hashes.filter((h) => h.id !== myHash));
    }
    if (currentHashes.length === hashes.length && currentHashes.every((val, index) => val === hashes[index])) {
        // No changes
        return;
    }
    currentHashes = hashes;
    console.log(logPrefix, 'EDITED', hashes);
    const root = $('#hashview').empty();
    hashes.forEach((hash) => {
        const container = $('<div></div>').addClass('hash-container');
        container.append($('<div></div>').text(hash).addClass('hash-text'));
        root.append(container);
        $.getJSON('/search/?query=' + encodeURIComponent(hash), (data) => {
            let empty = true;
            (data.results || []).filter((doc) => doc.id !== clientVars.padId).forEach((doc) => {
                let value = doc.id;
                // console.log(value);
                value = value.replace("pad:", "");
                value = encodeURIComponent(value);
                const title = doc.title || value;
                const anchor = $('<a></a>').attr('href', '/p/' + value).text(title);
                container.append($("<div></div>").append(anchor).addClass('hash-link'));
                empty = false;
            });
            if ((data.results || []).every((doc) => encodeURIComponent(doc.id.replace("pad:", "")) !== hash.substring(1)) && clientVars.padId !== hash.substring(1)) {
                const anchor = $('<a></a>').attr('href', '/p/' + hash.substring(1)).text(hash);
                container.append($("<div></div>").append(anchor).addClass('hash-link'));
                empty = false;
            }
            if (empty) {
                container.append($("<div></div>").text('No related pages'));
            }
        });
    });
};

exports.postToolbarInit = (hook, context) => {
    const $editorcontainerbox = $('#editorcontainerbox');
    const result = $('<div>')
        .attr('id', 'hashview');
    const close = $('<div>')
        .addClass('hashview-close')
        .append($('<i>').addClass('buttonicon buttonicon-times'))
        .click((event) => {
            event.stopPropagation();
            const collapsed = $('.hashview-collapsed');
            if (collapsed.length === 0) {
                $('.hashview')
                    .addClass('hashview-collapsed')
                    .removeClass('hashview-expanded');
            }
        });
    $('<div>')
        .addClass('hashview hashview-expanded')
        .append(close)
        .append(result)
        .click(() => {
            const collapsed = $('.hashview-collapsed');
            if (collapsed.length > 0) {
                $('.hashview')
                    .removeClass('hashview-collapsed')
                    .addClass('hashview-expanded');
            }
        })
        .appendTo($editorcontainerbox);
    window.hvSelectHash = (selectedHash) => {
        console.log(logPrefx, 'CLICKED', selectedHash);
        const collapsed = $('.hashview-collapsed');
        if (collapsed.length > 0) {
            $('.hashview')
                .removeClass('hashview-collapsed')
                .addClass('hashview-expanded');
        }
    };
};

exports.aceGetFilterStack = (hook, context) => {
    const { linestylefilter } = context;
    return [linestylefilter.getRegexpFilter(/\#\S+/g, ACE_EDITOR_TAG)];
};

exports.aceCreateDomLine = (hook, context) => {
    const { domline, cls } = context;
    if (cls.indexOf(ACE_EDITOR_TAG) < 0) {
        return;
    }
    let searchHash = null;
    const modifiedCls = cls.replace(ACE_EDITOR_MODIFIER_PATTERN, (x0, space, hash) => {
        searchHash = hash;
        return space + ACE_EDITOR_CLASS;
    })
    if (!searchHash) {
        return;
    }
    return [
        {
            extraOpenTags: `<a href="/p/${searchHash.substring(1)}">`,
            extraCloseTags: '</a>',
            cls: modifiedCls,
        },
    ];
};
