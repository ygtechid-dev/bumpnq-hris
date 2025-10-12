import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const ButtonRegDisabled = ({title, onPressed}) => {
  return (
    <TouchableOpacity style={{backgroundColor: 'grey', width: '70%', height: 40,  marginBottom: 10, alignSelf: 'center', borderRadius: 8, marginTop: 30, marginRight: 20}} 
              disabled onPress={onPressed} >
        <Text style={{textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'}} >{title} </Text>
    </TouchableOpacity>
  )
}

export default ButtonRegDisabled

const styles = StyleSheet.create({})