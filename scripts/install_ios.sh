#!/bin/bash
set -e
set -x

name=$PROJECT_NAME

if grep -q "<key>NSBluetoothAlwaysUsageDescription" ios/$name/Info.plist; then
  echo "Bluetooth is already supported, nothing to do here."
else
  plutil -insert NSBluetoothAlwaysUsageDescription -string 'Bluetooth permission when in use' ios/$name/Info.plist
fi

echo "configured iOS settings"