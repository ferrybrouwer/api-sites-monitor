#!/usr/bin/env bash

# get current file directory path
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# go to root of project
cd $DIR && cd ../

# run the server.js loopback
echo "LoopBack server shutdown..."
$(which forever) stop server/server.js
