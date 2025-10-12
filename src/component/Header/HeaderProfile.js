import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ICBack from '../../assets/arrowback.png'
import IChelp from '../../assets/edprof.png'

const HeaderProfile = ({title, desc, onPress, navigation}) => {
  return (
    <View style={{width: '100%', height: 71, backgroundColor: '#E6EDF4', paddingHorizontal: 18, alignItems: 'center', flexDirection: 'row'}}>
    <TouchableOpacity onPress={onPress}>
        <Image source={ICBack} />
    </TouchableOpacity>
    <View style={{marginLeft: 16}}>
    <Text style={{fontSize: 14, color: '#00162A', fontWeight: 'bold'}}>{title} </Text>
    <Text style={{fontSize: 12, color: 'black', marginTop: 4}}>{desc} </Text>
    </View>
    <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end'}}>
    <Image source={IChelp} />
    </TouchableOpacity>
    

    </View>
  )
}

export default HeaderProfile

const styles = StyleSheet.create({})