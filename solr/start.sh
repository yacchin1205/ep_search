#!/bin/bash

set -xe

precreate-core pad /opt/ep_weave/solr/pad/

exec solr -f