FROM solr:8

USER root
COPY . /tmp/ep_search
RUN mkdir /opt/ep_search \
    && mv /tmp/ep_search/solr /opt/ep_search/

USER solr
RUN precreate-core pad /opt/ep_search/solr/pad/
