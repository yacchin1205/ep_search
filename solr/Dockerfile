FROM solr:8

USER root
COPY . /tmp/ep_weave
RUN mkdir /opt/ep_weave \
    && mv /tmp/ep_weave/solr /opt/ep_weave/

USER solr
RUN precreate-core pad /opt/ep_weave/solr/pad/
