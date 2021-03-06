#!/bin/bash

PORT=3000

cd /Windshaft-cartodb
node app.js development &

cd /CartoDB-SQL-API
node app.js development &

cd /cartodb
source /usr/local/rvm/scripts/rvm
bundle exec script/restore_redis
bundle exec script/resque > resque.log 2>&1 &
rm -f /cartodb/tmp/pids/server.pid
bundle exec rails s -p $PORT