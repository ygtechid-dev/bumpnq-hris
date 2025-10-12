import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const ButtonSecondary = ({title, onPressed}) => {
  return (
    <TouchableOpacity style={{backgroundColor: 'white', borderWidth:0.5, borderColor: '#6892BC', width: 200, height: 26,  marginBottom: 10, alignSelf: 'center', borderRadius: 8, marginTop: 10, marginLeft: 10, marginRight: 20}} 
              onPress={onPressed} >
        <Text style={{textAlign: 'center', marginTop:3, fontSize: 12, fontFamily: 'Poppins-Light',  color: '#6892BC', fontWeight: '500'}} >{title} </Text>
    </TouchableOpacity>
  )
}

export default ButtonSecondary

const styles = StyleSheet.create({})