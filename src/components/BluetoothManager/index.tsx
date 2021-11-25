import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { BluetoothComponent } from './BleComponent'
import { bluetoothProps } from './generated'

const Bluetooth = (props: bluetoothProps) => {
	return(
		<View style={styles.wrapper}>
			{
				props.editor ? (
					<Text>Not supported in WebView</Text>
				) : (
					<BluetoothComponent {...props} />
				)
			}
		</View>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}
})

export default Bluetooth
