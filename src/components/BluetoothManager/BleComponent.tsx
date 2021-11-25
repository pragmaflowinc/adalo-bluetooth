import React, {
  useState,
  useEffect,
} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight
} from 'react-native'

import { bluetoothProps } from './generated';
import BleManager, { Peripheral } from 'react-native-ble-manager'
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

type BlePeripheral = Peripheral & { connected?: boolean }

export const BluetoothComponent = (props: bluetoothProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState<BlePeripheral[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('')
  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 3, true).then((results) => {
        setConnectionStatus('Scanning...');
        setIsScanning(true);
      }).catch(err => {
        console.error(err);
      });
    }    
  }

  const handleStopScan = () => {
    setConnectionStatus('Scan is stopped');
    setIsScanning(false);
  }

  const handleDisconnectedPeripheral = (data: any) => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      //@ts-ignore
      setList(Array.from(peripherals.values()));
    }
    setConnectionStatus('Disconnected from ' + data.peripheral);
  }

  const handleUpdateValueForCharacteristic = (data: any) => {
    //@ts-ignore
    setConnectionStatus('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then((results: BlePeripheral[]) => {
      if (results.length == 0) {
        setConnectionStatus('No connected peripherals')
      }
      setConnectionStatus(results.join('\n'));
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    });
  }

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    setConnectionStatus(`Got ble peripheral ${peripheral}`);
    if (!peripheral.name) {
      peripheral.name = "Unknown";
    }
    peripherals.set(peripheral.id, peripheral);
    
    setList(Array.from(peripherals.values()));
  }
	
  const testPeripheral = (peripheral: BlePeripheral) => {
    if (peripheral){
      if (peripheral.connected){
        BleManager.disconnect(peripheral.id);
      }else{
        BleManager.connect(peripheral.id).then(() => {
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            //@ts-ignore
            setList(Array.from(peripherals.values()));
          }
          setConnectionStatus('Connected to ' + peripheral.id);


          setTimeout(() => {

            /* Test read current RSSI value */
            BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
              setConnectionStatus(`Retrieved peripheral services ${peripheralData}`);

              BleManager.readRSSI(peripheral.id).then((rssi) => {
                setConnectionStatus(`Retrieved actual RSSI value ${rssi}`);
                let p = peripherals.get(peripheral.id);
                if (p) {
                  p.rssi = rssi;
                  peripherals.set(peripheral.id, p);
                  //@ts-ignore
                  setList(Array.from(peripherals.values()));
                }                
              });                                          
            });
          }, 900);
        }).catch((error) => {
          setConnectionStatus(`Connection error: ${error}`);
        });
      }
    }

  }
  useEffect(() => {
    BleManager.start({showAlert: false});

    const BleManagerDiscoverPeripheral = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    const BleManagerStopScan = bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
    const BleManagerConnectPeripheral = bleManagerEmitter.addListener('BleManagerConnectPeripheral', (status: number) => {

    });
    const BleManagerDisconnectPeripheral = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
    const BleManagerDidUpdateValueForCharacteristic = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic );
    const BleManagerDidUpdateState = bleManagerEmitter.addListener('BleManagerDidUpdateState', (data: any) => {

    })
    const BleManagerPeripheralDidBond = bleManagerEmitter.addListener('BleManagerPeripheralDidBond', (data: any) => {

    })
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            setConnectionStatus("Permission is OK");
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                setConnectionStatus("User accept");
              } else {
                setConnectionStatus("User refuse");
              }
            });
          }
      });
    }  
    
    return (() => {
      setConnectionStatus('unmount');
			BleManagerDiscoverPeripheral.remove()
			BleManagerStopScan.remove()
			BleManagerDisconnectPeripheral.remove()
			BleManagerDidUpdateValueForCharacteristic.remove()
    })
  }, []);

	const renderItem = (item: BlePeripheral) => {
		const color = item.connected ? 'green' : '#fff';
		return (
			<TouchableHighlight onPress={() => testPeripheral(item) }>
				<View style={[styles.row, {backgroundColor: color}]}>
					<Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
					<Text style={{fontSize: 10, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
					<Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20}}>{item.id}</Text>
				</View>
			</TouchableHighlight>
		);
	}

	return(
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
          <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{connectionStatus}</Text>
            <View style={{margin: 10}}>
              <Button 
                title={'Scan Bluetooth (' + (isScanning ? 'on' : 'off') + ')'}
                onPress={() => startScan() } 
              />            
            </View>

            <View style={{margin: 10}}>
              <Button title="Retrieve connected peripherals" onPress={() => retrieveConnected() } />
            </View>

            {(list.length == 0) &&
              <View style={{flex:1, margin: 20}}>
                <Text style={{textAlign: 'center'}}>No peripherals</Text>
              </View>
            }
          
          </View>              
        </ScrollView>
        <FlatList
            data={list}
            renderItem={({ item }) => renderItem(item) }
            keyExtractor={(item) => item.id}
          />              
      </SafeAreaView>
    </>
	)
}


const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#d0d0d0',
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: '#fff',
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: '#eee',
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: '#eee',
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  row: {

  }
});
