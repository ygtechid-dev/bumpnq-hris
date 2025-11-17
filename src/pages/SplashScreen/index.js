import React, { useEffect } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Logo from '../../assets/bumpnqslash.png'
// import Logo from '../../assets/hrisyg.png'

import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({navigation}) => {
  
  const gettoken = async () => {
    try {
      const getStorage = await AsyncStorage.getItem('@token');
      console.log('getstorsplash', getStorage);
      
      // Menggunakan setTimeout untuk delay 2 detik
      setTimeout(() => {
        if (getStorage) {
          // Jika ada token, langsung ke Home
          navigation.replace('HomeWithTabs');
        } else {
          // Jika tidak ada token, ke Login
          navigation.replace('Login');
          // navigation.replace('LoginAccount');

        }
      }, 2000);
      
    } catch (error) {
      console.error('Error getting token:', error);
      // Jika ada error, tetap ke Login sebagai fallback
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    }
  };
  
  useEffect(() => {
    gettoken()
  }, [])
  
  return (
    <View style={{flex: 1, backgroundColor: '#5EC898', justifyContent: 'center'}}>
    {/* <View style={{flex: 1, backgroundColor: 'white', justifyContent: 'center'}}> */}
    

      <View style={{alignItems: 'center'}}>
        <Image source={Logo} style={{width: 300, height: 300}} />
        <View style={{marginTop: -10, alignItems: 'center'}}>
        </View>
      </View>
    </View>
  )
}

export default SplashScreen

const styles = StyleSheet.create({
  txtDesc: {
    marginTop: 16,
    fontSize: 14,
    color: '#7F6000'
  }
})