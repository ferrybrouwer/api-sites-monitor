#!/usr/bin/env bash

# exit when error occurs
set -e

# get current file directory path
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# run mongod server when process does not exist
PID=$(ps aux | grep "[m]ongod" | awk '{print $2}')
if [ ! $PID ]; then
  $DIR/startMongodbServer.sh
fi

# go to root of project
cd $DIR && cd ../

# log file paths
LOG_DIR="$PWD/logs"
PID_LOGFILE="$LOG_DIR/monitor.pid"
STDOUT_LOGFILE="$LOG_DIR/stdout.log"
STDERR_LOGFILE="$LOG_DIR/stderr.log"
FOREVER_LOGFILE="$LOG_DIR/forever.log"

# remove log files
rm -rf $LOG_DIR

# create log directory
mkdir -p $LOG_DIR

# create log files
touch $PID_LOGFILE
touch $STDOUT_LOGFILE
touch $STDERR_LOGFILE
touch $FOREVER_LOGFILE

# set file permissions to enable write to theses log files
chmod -R g+w $LOG_DIR

# run the server.js loopback and store output, error and forever logs to logs/*
$(which forever) --minUptime 1000 --spinSleepTime 1000 -a -l $FOREVER_LOGFILE -o $STDOUT_LOGFILE -e $STDERR_LOGFILE --pidFile $PID_LOGFILE start server/server.js > /dev/null

# get webserver status code
function webserverStatusCode() {
  local exitwhile=0
  local statuscode=1
  local whilecounter=0

  while [ "$exitwhile" = 0 ]; do
    let whilecounter+=1

    if grep "Web server listening at" $FOREVER_LOGFILE > /dev/null; then
      statuscode=0
      exitwhile=1
    fi

    if grep "ReferenceError" $FOREVER_LOGFILE > /dev/null | grep "error" $FOREVER_LOGFILE > /dev/null; then
      statuscode=1
      exitwhile=1
    fi

    if [ $whilecounter == 20 ]; then
      statuscode=1
      exitwhile=1
    fi

    sleep 0.2;
  done

  echo $statuscode
}

# get webserver status code
webserverstatuscode=$(webserverStatusCode)

# exit webserver status code
exit $webserverstatuscode
