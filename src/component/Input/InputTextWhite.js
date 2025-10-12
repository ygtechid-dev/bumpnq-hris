import { StyleSheet, Text, TextInput, View } from 'react-native'
import React from 'react'

const InputTextWhite = ({title, secureText, placeholder, onChangeText}) => {
  return (
    <View style={{width: '100%', }}>
      <Text style={{color: '#00162A', fontWeight: 'bold'}}>{title}</Text>
      <TextInput style={{backgroundColor: 'white', borderRadius: 12, marginBottom: 8, marginTop: 10}}
      secureTextEntry={secureText} placeholder={placeholder}  onChangeText={onChangeText} />
    </View>
  )
}

export default InputTextWhite

const styles = StyleSheet.create({})