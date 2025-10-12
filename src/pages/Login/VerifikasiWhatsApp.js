/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


const VerifikasiWhatsApp = ({navigation, route}) => {
    const {kodeOtp} = route.params;
    console.log('kdoe', kodeOtp);
  const [inputan, setInput] = useState({
    email: "",
    password: "",
    
  })
  const [loading, setLoading]= useState(false)
  const [hidePassword, setHidePassword] = useState(true);

  console.log('inputan', inputan);

  const handleLogin = async () => {
    setLoading(true);
  
 
  // AsyncStorage.setItem('@token', token)
    
  if(inputan.email == "") {
    setLoading(false)

    alert('Silahkan input OTP')

   
   } else {
    setLoading(false)

    if(inputan.email == kodeOtp) {
        navigation.push('MyTabs');

    } else {
    setLoading(false)

        alert('OTP tidak sesuai')
    }
   
  
    // try {
    //   await axios.post(`${API_URL}/api/login`, {
    //     email: inputan.email,
    //     password: inputan.password
    //   }).then((res) => {
    //       setLoading(false)
        
      
    //             AsyncStorage.setItem('@token', res.data.access_token)
    //     navigation.push('MyTabs');
         
    //   })
    // } catch(err) {
    //   setLoading(false)
    //   console.log('error', err.response);
    // }
   
  }
}
  
   


   
   
 
    
      

    

     


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
      <View>
      <Text style={styles.txtHead}>Verifikasi WhatsApp</Text>
        <Text style={styles.descHead}>{'Kami sudah mengirimkan kode OTP (One Time Password) \n ke Nomor Anda'}</Text>
      </View>
      </View>
     
        
        <View style={{marginTop: 20, marginHorizontal: 16}}>
          
        <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Kode OTP"
            onChangeText={(e) => setInput({ ...inputan, email: e })}  
          />
          
         
       
        </View>
        
       


       {loading ? 
       <ActivityIndicator size="large" color="black" />
       :
       <>

<TouchableOpacity style={styles.btn} 
             onPress={handleLogin}
              >
        <Text style={styles.txtBtn} >Verifikasi</Text>
    </TouchableOpacity>

       </>
      }
         
         
   

   
     

        </>
      </View>
    </View>
  );
};

export default VerifikasiWhatsApp;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white', },
  wrapper: {
    // alignItems: 'center',

   
    marginTop: 30,
  },
wrapHeader: {},
txtHead: {color: 'black', fontWeight: 'bold', fontSize: 24,  marginTop: 10, textAlign: 'center'},
descHead: {color: '#8D92A3',  fontSize: 12, marginBottom: 30, marginTop: 10, textAlign: 'center'},
txtInput: {
  backgroundColor: 'white',
  borderRadius: 12,
  marginBottom: 8,
  borderWidth: 1,
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
btn: {backgroundColor: '#2FBED4', width: '40%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 30, marginHorizontal: 20},
txtBtn: {textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'}
});
