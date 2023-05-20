FROM solr:8

USER root

COPY . /tmp/ep_search
RUN mkdir -p /opt/ep_search/example/solr \
    && mv /tmp/ep_search/* /opt/ep_search/example/solr/ \
    && chmod 0755 /opt/ep_search/example/solr/start.sh

USER solr

ENTRYPOINT /opt/ep_search/example/solr/start.sh