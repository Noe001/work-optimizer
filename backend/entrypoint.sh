#!/bin/bash
set -e
cd /app && bundle check || bundle install

rm -f /app/tmp/pids/server.pid

exec "$@"
