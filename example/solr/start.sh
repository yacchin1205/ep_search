#!/bin/bash

set -xe

precreate-core pad /opt/ep_search/example/solr/pad/

exec solr -f