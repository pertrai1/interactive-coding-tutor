# JavaScript visualizer backend using modern Node.js

# to build:
# docker build -t="pgbovine/cokapi-js:v2" .
#
# to test:
# docker run -t -i --rm --user=netuser --net=none --cap-drop all pgbovine/cokapi-js:v2 bash
#
# remember --rm or else stale old containers will be left around!
# use "docker ps -a" to see all containers

# Use modern Node.js LTS for ECMAScript 2025 support
FROM node:24-alpine
MAINTAINER Philip Guo <philip@pgbovine.net>

RUN adduser -D netuser

# Install any additional dependencies if needed
RUN apk add --no-cache python3

RUN mkdir /tmp/javascript

# use this to tell npm what dependencies to install
ADD package.json /tmp/javascript

# Install npm dependencies
RUN cd /tmp/javascript/ && npm install

# add tests to container
ADD golden_test.py /tmp/javascript
RUN mkdir /tmp/javascript/tests/
ADD tests/ /tmp/javascript/tests/

# do this last so that even if this file changes, everything else
# earlier in this file doesn't need to be re-run
ADD jslogger-modern.js /tmp/javascript
