#!/usr/bin/env bash

# get current file directory path
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# prompt parameter port
echo "Use MongoDB on port [default 27017]:"
read PORT
PORT=${PORT:-27017}

# paths
MONGO_PATH=$(dirname $(which mongod))
MONGO_PATH=${MONGO_PATH/\/bin/}
LOG_PATH="$MONGO_PATH/log"
DB_PATH="$MONGO_PATH/data/db"

# create db- and log directory is not exists
[ -d $DB_PATH ] || mkdir -p $DB_PATH
[ -d $LOG_PATH ] || mkdir -p $LOG_PATH

# stop currently running mongodb server(s)
$DIR/stopMongodbServer.sh

# run mongodb server
mongod --dbpath $DB_PATH --logpath $LOG_PATH/mongodb.log --port $PORT --fork --noauth
