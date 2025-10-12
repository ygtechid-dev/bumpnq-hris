import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const MiniButton = ({title, onPressed}) => {
  return (
    <TouchableOpacity style={{backgroundColor: '#0CA940', width: '30%', height: 40,  marginBottom: 10, borderRadius: 8, marginRight: 20}} 
              onPress={onPressed} >
        <Text style={{textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'}} >{title} </Text>
    </TouchableOpacity>
  )
}

export default MiniButton

const styles = StyleSheet.create({})