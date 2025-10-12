import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ICBack from '../../assets/btnback.png'
import React from 'react'

const HeaderSecond = ({title, onPressed, desc}) => {
  return (
    <View style={{width: '100%', flexDirection: 'row',  height: 30,  marginHorizontal: 28, marginVertical: 28, borderBottomRightRadius: 20, borderBottomLeftRadius: 20 }}>
     <TouchableOpacity onPress={onPressed}>
     <Image source={ICBack}  />
     </TouchableOpacity>
     <View>
     <Text style={{color: '#484848',  fontSize: 12,  fontWeight: 'bold', marginTop: -10, marginLeft: 10}}>{title}</Text>
     <Text style={{color: '#484848',  fontSize: 12,  fontWeight: '300',marginLeft: 10}}>{desc}</Text>

     </View>
      
     
      </View>
  )
}

export default HeaderSecond

const styles = StyleSheet.create({})