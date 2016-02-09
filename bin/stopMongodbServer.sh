#!/usr/bin/env bash

# stop currently running mongodb server(s)
PID=$(ps aux | grep "[m]ongod" | awk '{print $2}')
if [ $PID > 0 ]; then
    echo "Shutdown $PID mongod process ..."
    kill $PID
fi
