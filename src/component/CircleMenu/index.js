import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const CircleMenu = ({img, onPressed, title}) => {
  return (
    <TouchableOpacity onPress={onPressed}>
      <Image source={img} style={{ marginTop: 12, marginLeft: 5, height: 100, width: 80}} />
      <Text style={{color: 'black',  fontSize: 12, marginTop: 0, marginLeft: 5, fontWeight: 'bold', textAlign: 'center'}}>{title}</Text>
      </TouchableOpacity>
  )
}

export default CircleMenu

const styles = StyleSheet.create({})