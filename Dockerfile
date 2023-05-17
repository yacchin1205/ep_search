FROM etherpad/etherpad

USER root

COPY . /tmp/ep_weave
RUN cd /tmp/ep_weave \
    && ls -la /tmp/ep_weave \
    && npm pack

RUN npm install --no-save --legacy-peer-deps /tmp/ep_weave/ep_weave-0.1.0.tgz \
        ep_align \
        ep_embedded_hyperlinks2 \
        ep_font_color \
        ep_headings2 \
        ep_markdown \
        ep_image_upload \
        ep_openid_connect \
        ep_oauth2 \
    && src/bin/installDeps.sh \
    && rm -rf ~/.npm

USER etherpad
