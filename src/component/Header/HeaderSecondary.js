import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ICMenu from '../../assets/menu.png'
import ICsearch from '../../assets/search.png'

const HeaderSecondary = ({title, desc, onPress, navigation}) => {
  return (
    <View style={{width: '100%', height: 71, backgroundColor: 'white', paddingHorizontal: 18, 
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: "#000",
shadowOffset: {
	width: 0,
	height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 3.84,

elevation: 5,}}>
    <Text style={{fontSize: 30, color: 'black', fontWeight: '400',  fontWeight: 'bold', }}
    onPress={onPress}
    >{"<"}</Text>
  
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{fontSize: 16, color: 'black', fontWeight: '400', textAlign: 'center', fontWeight: 'bold', alignSelf: 'center'}}>{title}</Text>
    </View>
   
    <Text style={{fontSize: 30, color: 'black', fontWeight: '400',  fontWeight: 'bold', }}
    >{""}</Text>
    

    </View>
  )
}

export default HeaderSecondary

const styles = StyleSheet.create({})