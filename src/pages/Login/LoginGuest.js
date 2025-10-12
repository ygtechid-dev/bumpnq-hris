/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../../assets/logoloffee.png'

// Import Firebase v9 functions
import { ref, set } from 'firebase/database';
import { database } from '../../config/Fire';


const LoginGuest = ({navigation}) => {
  const [inputan, setInput] = useState({
    namalengkap: "",
    nomorwhatsapp: "",
    
  })
  const [loading, setLoading]= useState(false)
  const [hidePassword, setHidePassword] = useState(true);

  console.log('inputan', inputan);

 
  const handleLogin = async () => {
    setLoading(true);

    // Validation
    if (inputan.namalengkap === "") {
      setLoading(false);
      alert('Please input Full Name');
      return;
    }

    if (inputan.nomorwhatsapp === "") {
      setLoading(false);
      alert('Please input Whatsapp Number');
      return;
    }

    try {
      // Generate unique ID dan data
      const codeOtpRandom = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
      const uid = "LOFFEE-GUEST-" + codeOtpRandom;
      
      const data = {
        namaLengkap: inputan.namalengkap,
        handphone: inputan.nomorwhatsapp,
        email: "guest@gmail.com",
        address: "Guest Address",
        password: "guest123",
        uid: uid,
        membership_status: "GUEST",
        point_member: 0,
        foto_profile: null,
        created_at: new Date().toISOString() // Tambah timestamp
      };

      const dataPar = [data]; // Array untuk AsyncStorage

      console.log('Guest data:', data);

      // Firebase v9 - set data ke database
      const userRef = ref(database, `userlogin/${uid}`);
      await set(userRef, data);

      // Generate token dan simpan ke AsyncStorage
      const prefix = 'TKN';
      const uniquenumber = Math.floor(Math.random() * 1000000);
      const tkn = prefix + uniquenumber;
      const tostrings = JSON.stringify(dataPar);

      await AsyncStorage.setItem('@token', tkn);
      await AsyncStorage.setItem('@dataSelf', tostrings);

      setLoading(false);
      Alert.alert('Success', 'Success Login as Guest!!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.replace('Home');
          }
        }
      ]);

    } catch (error) {
      setLoading(false);
      console.error('Error creating guest account:', error);
      Alert.alert('Error', 'Failed to create guest account. Please try again.');
    }
  };
  
  
   


   
   
 
    
      

    

     


  // if(inputan.email == "admin@gmail.com" && inputan.password == "admin") {
  //     navigation.navigate('Home')
  
  //     console.log('token', token);
  // } else {
  //     alert('Email dan Password Salah!')
  // }
  
  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };
  const handleRegister = async () => {
    
       navigation.navigate('Register')
      
   }
  
  return (
    <View style={styles.container}>
      <View
        style={styles.wrapper}>
        <>
         
      
      
      <View style={styles.wrapHeader}>
      <Image source={Logo} style={{width: 200, height: 100}} />
      </View>
      <Text style={styles.txtHead}>Hello, Guest! Please Fill This Form</Text>
     
        
        <View style={{marginTop: 20, marginHorizontal: 16}}>
          
        <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Full Name"
            onChangeText={(e) => setInput({ ...inputan, namalengkap: e })}  
          />
            <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Whatsapp Number"
            onChangeText={(e) => setInput({ ...inputan, nomorwhatsapp: e })}  
          />
         
       
        </View>
        
       

        {/* <Text style={{color: '#7F6000',  fontSize: 12,  fontFamily: 'Poppins-Medium',  marginHorizontal: 32, marginTop: 10, textAlign: 'right'}}>{'Forgot your password?'}</Text> */}

       {loading ? 
       <ActivityIndicator size="large" color="black" />
       :
       <>

<TouchableOpacity style={styles.btn} 
             onPress={handleLogin}
              >
        <Text style={styles.txtBtn} >Login as Guest</Text>
    </TouchableOpacity>

       </>
      }
         
         <View style={{alignSelf: 'center'}}>
         {/* <Text style={styles.descHead}>{'Not in Loffee App yet?'}</Text> */}
         <Text 
        onPress={() => navigation.push('Login')}
         style={[styles.txtHead, {
          fontSize: 14,
          marginTop: 10,
          marginLeft: 5,
          color: '#7F6000',
          
         }]}>Login Account</Text>
    
         </View>
       
   

   
     

        </>
      </View>
    </View>
  );
};

export default LoginGuest;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F7F0', },
  wrapper: {
    // alignItems: 'center',

   
    marginTop: 30,
  },
wrapHeader: {alignSelf: 'center'},
txtHead: {color: '#7F6000', fontFamily: 'Poppins-Bold', fontSize: 16,  marginTop: 30, textAlign: 'center'},
descHead: {color: '#7F6000',  fontSize: 14,  fontFamily: 'Poppins-Medium', marginBottom: 30, marginTop: 10, textAlign: 'center'},
txtInput: {
  backgroundColor: 'white',
  borderRadius: 12,
  marginBottom: 8,
  borderWidth: 1,
  padding: 10,
  borderColor: '#E0E2EA',
  marginHorizontal: 20,
  width: '90%',
  color: 'black'
},
toggleButton: {
  position: 'absolute',
  right: 10,
  top: 40,
},
toggleText: {
  color: '#2FBED4',
  fontSize: 14,
  fontWeight: '600',
  marginRight: 20,
  marginTop: -27
},
formInput: {
  marginVertical: 5
},
// txtInput: {
//   height: 50,
//   borderColor: '#020202',
//   borderWidth: 1,
//   borderRadius: 10,
//   paddingLeft: 10
// },
btn: {backgroundColor: '#7F6000', width: '80%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 10, marginHorizontal: 20},
txtBtn: {textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'}
});
