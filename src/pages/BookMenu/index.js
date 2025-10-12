// /* eslint-disable prettier/prettier */
// import React, { useEffect, useState } from 'react';
// import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// import Logo from '../../assets/logoloffee.png'
// import Fire from '../../config/Fire';

// import FontAwesomeIcon5 from 'react-native-vector-icons/FontAwesome5'


// const BookMenu = ({navigation}) => {
//   const [inputan, setInput] = useState({
//     email: "",
//     password: "",
    
//   })
//   const [loading, setLoading]= useState(false)
//   const [hidePassword, setHidePassword] = useState(true);
//   const [dataBookMenu, setDataBookMenu] = useState([]);

//   console.log('inputan', dataBookMenu.length);

//   const getData = async () => {
//     setLoading(true);
//     Fire.database()
//       .ref('outletsetting/')
//       .once('value')
//       .then((resDB) => {
//         const datled = [];
//         const value = resDB.val();
//         console.log('valyu', value);
        
//         if (value) {
//           Object.keys(value).map((item) => {
//             datled.push(value[item]);
//           });

//          console.log('sss', datled);
         
//           setDataBookMenu(datled);
//            // Cari level berikutnya setelah level user
         
//         }
//         setLoading(false);
//       });
//   };
  
  
   


   
//   useEffect(() => {
//     getData()
//   }, [])
  
   
 
    
      

    

     


//   // if(inputan.email == "admin@gmail.com" && inputan.password == "admin") {
//   //     navigation.navigate('Home')
  
//   //     console.log('token', token);
//   // } else {
//   //     alert('Email dan Password Salah!')
//   // }
  
//   const togglePasswordVisibility = () => {
//     setHidePassword(!hidePassword);
//   };
//   const handleRegister = async () => {
    
//        navigation.navigate('Register')
      
//    }
//    const pdfUri = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'; // URL atau path lokal ke file PDF


//   return (
//     <View style={styles.container}>
//         <ScrollView>
//         <TouchableOpacity onPress={() => navigation.goBack()} >
//         <FontAwesomeIcon5 name="chevron-left" size={24} color="#7F6000" style={{marginTop: 16, marginLeft: 16}} />

//         </TouchableOpacity>
//         <View
//         style={styles.wrapper}>
//         <>
        
      
      
//       <View style={styles.wrapHeader}>
//       <Image source={Logo} style={{width: 200, height: 100}} />
//       </View>
    
//       <Text style={[styles.txtHead, {
//         marginTop: 10
//       }]}>BOOK MENU</Text>
        
//      <View style={{marginHorizontal:20, marginTop: 16}}>
//       {dataBookMenu.length > 0 &&
//          <WebView
//          source={{ uri: dataBookMenu[0].file_bookmenu }}
//          style={{ width: '100%', height: 550,  }}
//        />
//       }
  
//      </View>
// {/*        
//      <TouchableOpacity style={styles.btn} 
//              onPress={() => navigation.goBack()}
//               >
//         <Text style={styles.txtBtn} >Back</Text>
//     </TouchableOpacity> */}

       
   

   
     

//         </>
//       </View>
//         </ScrollView>
    
//     </View>
    
     
//   );
// };

// export default BookMenu;

// const styles = StyleSheet.create({
//   container: {flex: 1, backgroundColor: '#F7F7F0', },
//   wrapper: {
//     // alignItems: 'center',

   
//     marginTop: 0,
//   },
//   containers: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   pdfViewer: {
//     width: '100%',
//     height: '100%',
//   },
// wrapHeader: {alignSelf: 'center'},
// txtHead: {color: '#7F6000', fontFamily: 'Poppins-Bold', fontSize: 16,  marginTop: 30, textAlign: 'center'},
// txtDesc: {color: '#7F6000', fontFamily: 'Poppins-Light', fontSize: 14,  marginTop: 10, textAlign: 'center'},

// descHead: {color: '#7F6000',  fontSize: 14,  fontFamily: 'Poppins-Medium', marginBottom: 30, marginTop: 10, textAlign: 'center'},
// txtInput: {
//   backgroundColor: 'white',
//   borderRadius: 12,
//   marginBottom: 8,
//   borderWidth: 1,
//   padding: 10,
//   borderColor: '#E0E2EA',
//   marginHorizontal: 20,
//   width: '90%',
//   color: 'black'
// },
// toggleButton: {
//   position: 'absolute',
//   right: 10,
//   top: 40,
// },
// btn: {backgroundColor: '#7F6000', width: '80%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 24, marginHorizontal: 20},

// toggleText: {
//   color: '#2FBED4',
//   fontSize: 14,
//   fontWeight: '600',
//   marginRight: 20,
//   marginTop: -27
// },

// formInput: {
//   marginVertical: 5
// },
// // txtInput: {
// //   height: 50,
// //   borderColor: '#020202',
// //   borderWidth: 1,
// //   borderRadius: 10,
// //   paddingLeft: 10
// // },
// btn: {backgroundColor: '#7F6000', width: '80%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 24, marginHorizontal: 20},
// txtBtn: {textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'}
// });

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const BookMenu = () => {
  return (
    <View>
      <Text>BookMenu</Text>
    </View>
  )
}

export default BookMenu

const styles = StyleSheet.create({})