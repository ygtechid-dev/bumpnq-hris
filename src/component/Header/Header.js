import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FontAwesomeIcon5 from 'react-native-vector-icons/FontAwesome5'
import IMGPP from '../../assets/circlepp.png'

const Header = ({name, nip, img, pressed}) => {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
    <View style={{flexDirection: 'row'}}>
    <Image source={IMGPP} style={{width: 40, height: 40}} />
    <View>
    <Text style={{marginLeft: 10, color: 'black',  fontSize: 12,  marginTop: 1, fontFamily: 'Poppins-Light'}}>{"Selamat Pagi,"}</Text>
    <Text style={{marginLeft: 10, color: 'black',  fontSize: 14,  marginTop: -2, fontFamily: 'Poppins-Bold'}}>{name}</Text>
    </View>
   
    </View>
    <FontAwesomeIcon5 name="bell" size={20} color="black" style={{marginTop: 10}} />

    {/* <TouchableOpacity onPress={pressed}>
    <FontAwesomeIcon5 name="bell" size={15} color="black" style={{marginTop: 10}} />

    </TouchableOpacity> */}
    </View>

  )
}

export default Header

const styles = StyleSheet.create({})