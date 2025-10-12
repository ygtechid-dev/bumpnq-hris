import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import RBSheet from 'react-native-raw-bottom-sheet';

const BottomPopup = () => {
    const refRBSheet = useRef();

  return (
    <View>
       <RBSheet
        ref={refRBSheet}
        useNativeDriver={true}
        customStyles={{
          wrapper: {
            backgroundColor: 'transparent',
          },
          draggableIcon: {
            backgroundColor: '#000',
          },
        }}
        customModalProps={{
          animationType: 'slide',
          statusBarTranslucent: true,
        }}
        customAvoidingViewProps={{
          enabled: false,
        }}>

            <Text>TESTING</Text>

            </RBSheet>
    </View>
  )
}

export default BottomPopup

const styles = StyleSheet.create({})