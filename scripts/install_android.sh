#!/bin/bash
set -e
set -x

cd android/app

# AndroidManifest
cd src/main

cat <<EOF > /tmp/adalo-sed
/android.permission.INTERNET/a\\
    <uses-permission android:name="android.permission.BLUETOOTH"/>\
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>\
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\
    <uses-permission android:name="android.permission.READ_CONTACTS" />\
    <uses-permission android:name="android.permission.NFC" />\
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>\\
EOF

sed -i.bak "$(cat /tmp/adalo-sed)" AndroidManifest.xml

echo "configured Android settings"