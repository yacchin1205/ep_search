FROM etherpad/etherpad

USER root

COPY . /tmp/ep_search
RUN cd /tmp/ep_search \
    && ls -la /tmp/ep_search \
    && npm pack

RUN npm install --no-save --legacy-peer-deps /tmp/ep_search/ep_search-0.0.22.tgz \
        ep_align \
        ep_embedded_hyperlinks2 \
        ep_font_color \
        ep_headings2 \
        ep_markdown \
        ep_image_upload \
    && src/bin/installDeps.sh \
    && rm -rf ~/.npm

USER etherpad
