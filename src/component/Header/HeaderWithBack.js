import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ICMenu from '../../assets/back.png'
import ICsearch from '../../assets/plus.png'

const HeaderWithBack = ({title, desc, onPress, navigation}) => {
  return (
    <View style={{width: '100%', height: 71, backgroundColor: '#E6EDF4', paddingHorizontal: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
    <TouchableOpacity onPress={onPress}>
        <Image source={ICMenu} style={{width: 20, height: 20}} />
    </TouchableOpacity>
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{fontSize: 16, color: 'black', fontWeight: '400', textAlign: 'center', }}>{title} </Text>
    </View>
    <TouchableOpacity >
    <Image source={ICsearch} style={{width: 20, height: 20}}  />
    </TouchableOpacity>
    

    </View>
  )
}

export default HeaderWithBack

const styles = StyleSheet.create({})