FROM etherpad/etherpad:2

USER root

COPY . /tmp/ep_search
RUN ls -la /tmp/ep_search

USER etherpad

ARG ETHERPAD_LOCAL_PLUGINS="/tmp/ep_search/"
RUN bin/installDeps.sh && rm -rf ~/.npm && \
    if [ ! -z "${ETHERPAD_LOCAL_PLUGINS}" ]; then \
        pnpm run install-plugins ${ETHERPAD_LOCAL_PLUGINS:+--path ${ETHERPAD_LOCAL_PLUGINS}}; \
    fi
