/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import { 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ImageBackground,
  StatusBar,
  Dimensions
} from 'react-native';

import { database } from '../../config/Fire';
import { ref, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import background header
import BgHeader from '../../assets/bgheaderbump.png';
import axios from 'axios';
import { API_URL } from '../../context/APIUrl';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoginAccount = ({navigation}) => {
  const [inputan, setInput] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);

  const handleLogin = async () => {
    setLoading(true);

    // navigation.navigate('HomeWithTabs')
    if (inputan.email === "") {
      setLoading(false);
      alert('Silahkan input email');
      return;
    }

    if (inputan.password === "") {
      setLoading(false);
      alert('Silahkan input password');
      return;
    }

    try {
      console.log('====================================');
      console.log('hit');
      console.log('====================================');
      await axios.post(`${API_URL}/api/auth/login`, {
       email: inputan.email,
       password: inputan.password
      }).then(async(res) => {
        setLoading(false)
        console.log('====================================');
        console.log('resberhasil', res.data);
        console.log('====================================');
             const prefix = 'TKN';
        const uniquenumber = Math.floor(Math.random() * 1000000);
        const tkn = prefix + uniquenumber;
        console.log('toke', tkn);
        const tostrings = JSON.stringify(res.data);
        await AsyncStorage.setItem('@token', tkn);
        await AsyncStorage.setItem('@dataSelf', tostrings);
        navigation.replace('HomeWithTabs')
      })
    } catch(err) {
        setLoading(false)

      console.log('====================================');
      console.log('errorlogin', err.response);
      console.log('====================================');
      alert('Percobaan Masuk Gagal. Silahkan coba lagi')
    }

    // try {
    //   const dbRef = ref(database, 'userlogin/');
    //   const snapshot = await get(dbRef);
    //   const value = snapshot.val();

    //   if (value) {
    //     const datled = Object.values(value);
    //     const allFilterData = datled.filter((user) => 
    //       (user.email === inputan.email || user.handphone === inputan.email) && 
    //       user.password === inputan.password
    //     );

    //     setLoading(false);

    //     const prefix = 'TKN';
    //     const uniquenumber = Math.floor(Math.random() * 1000000);
    //     const tkn = prefix + uniquenumber;
    //     const tostrings = JSON.stringify(allFilterData);

    //     if (allFilterData.length > 0) {
    //       await AsyncStorage.setItem('@token', tkn);
    //       await AsyncStorage.setItem('@dataSelf', tostrings);
    //       navigation.replace('Home');
    //     } else {
    //       alert('Email atau Password salah');
    //     }
    //   }
    // } catch (err) {
    //   setLoading(false);
    //   console.log('Error:', err);
    //   alert('Terjadi kesalahan, silakan coba lagi');
    // }
  };

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Header Section with Background */}
      <ImageBackground source={BgHeader} style={styles.headerBackground} resizeMode="cover">
        <View style={styles.headerOverlay}>
          <Text style={styles.greeting}>Assalamu'alaikum</Text>
          <Text style={styles.subtitle}>Selamat Datang di Aplikasi BUMP-NQ</Text>
        </View>
      </ImageBackground>

      {/* Login Form Section */}
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            Silakan melakukan pengisian dengan Data Karyawan aktif di BUMP-NQ
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.emailIcon}>✉</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="example@gmail.com"
              placeholderTextColor="#B0B0B0"
              value={inputan.email}
              onChangeText={(e) => setInput({ ...inputan, email: e })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#B0B0B0"
              value={inputan.password}
              onChangeText={(e) => setInput({ ...inputan, password: e })}
              secureTextEntry={hidePassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={togglePasswordVisibility}
            >
              <Text style={styles.eyeIcon}>{hidePassword ? '👁' : '👁‍🗨'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          {loading ? (
            <View style={styles.loginButton}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Masuk</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default LoginAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBackground: {
    height: screenHeight * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    opacity: 0.9,
    
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    flex: 1,
    marginTop: -30,
   
  },
  formCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 30,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  formTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'black',
    textAlign: 'left',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
    height: 55,
  },
  iconContainer: {
    marginRight: 12,
  },
  emailIcon: {
    fontSize: 18,
    color: '#999',
  },
  lockIcon: {
    fontSize: 18,
    color: '#999',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 18,
    color: '#999',
  },
  loginButton: {
    backgroundColor: '#5EC898',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

/* eslint-disable prettier/prettier */
// import React, { useState } from 'react';
// import { 
//   ActivityIndicator, 
//   StyleSheet, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   View, 
//   ImageBackground,
//   StatusBar,
//   Dimensions,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView
// } from 'react-native';

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import BgHeader from '../../assets/bgheaderbump.png';
// import axios from 'axios';
// import { API_URL } from '../../context/APIUrl';

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// const LoginAccount = ({navigation}) => {
//   const [inputan, setInput] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [hidePassword, setHidePassword] = useState(true);

//   const handleLogin = async () => {
//     setLoading(true);

//     if (inputan.email === "") {
//       setLoading(false);
//       alert('Silahkan input email');
//       return;
//     }

//     if (inputan.password === "") {
//       setLoading(false);
//       alert('Silahkan input password');
//       return;
//     }

//     try {
//       await axios.post(`${API_URL}/api/auth/login`, {
//        email: inputan.email,
//        password: inputan.password
//       }).then(async(res) => {
//         setLoading(false)
//         const prefix = 'TKN';
//         const uniquenumber = Math.floor(Math.random() * 1000000);
//         const tkn = prefix + uniquenumber;
//         const tostrings = JSON.stringify(res.data);
//         await AsyncStorage.setItem('@token', tkn);
//         await AsyncStorage.setItem('@dataSelf', tostrings);
//         navigation.replace('HomeWithTabs')
//       })
//     } catch(err) {
//       setLoading(false)
//       console.log('errorlogin', err.response);
//       alert('Percobaan Masuk Gagal. Silahkan coba lagi')
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setHidePassword(!hidePassword);
//   };

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
//       <ScrollView 
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//         bounces={false}
//       >
//         {/* Header Section */}
//         <View style={styles.headerContainer}>
//           <ImageBackground source={BgHeader} style={styles.headerBackground} resizeMode="cover">
//             <View style={styles.headerOverlay}>
            
              
//               <Text style={styles.appName}>HRISYG</Text>
//               <Text style={styles.appTagline}>Human Resource Information System</Text>
//               <Text style={styles.greeting}>Selamat Datang</Text>
//             </View>
//           </ImageBackground>
//         </View>

//         {/* Login Form Section */}
//         <View style={styles.formContainer}>
//           <View style={styles.formCard}>
//             <View style={styles.formHeader}>
//               <Text style={styles.formTitle}>Masuk ke Akun</Text>
//               <Text style={styles.formSubtitle}>
//                 Silakan login dengan akun karyawan aktif
//               </Text>
//             </View>

//             {/* Email Input */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Email</Text>
//               <View style={styles.inputContainer}>
//                 <Text style={styles.inputIcon}>✉️</Text>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="nama@hrisyg.com"
//                   placeholderTextColor="#999"
//                   value={inputan.email}
//                   onChangeText={(e) => setInput({ ...inputan, email: e })}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                 />
//               </View>
//             </View>

//             {/* Password Input */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.inputLabel}>Password</Text>
//               <View style={styles.inputContainer}>
//                 <Text style={styles.inputIcon}>🔒</Text>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="Masukkan password"
//                   placeholderTextColor="#999"
//                   value={inputan.password}
//                   onChangeText={(e) => setInput({ ...inputan, password: e })}
//                   secureTextEntry={hidePassword}
//                   autoCapitalize="none"
//                 />
//                 <TouchableOpacity 
//                   style={styles.eyeButton} 
//                   onPress={togglePasswordVisibility}
//                 >
//                   <Text style={styles.eyeIcon}>
//                     {hidePassword ? '👁' : '👁‍🗨'}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Forgot Password */}
//             <TouchableOpacity style={styles.forgotPassword}>
//               <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
//             </TouchableOpacity>

//             {/* Login Button */}
//             {loading ? (
//               <View style={styles.loginButton}>
//                 <ActivityIndicator size="small" color="white" />
//                 <Text style={styles.loadingText}>Memproses...</Text>
//               </View>
//             ) : (
//               <TouchableOpacity 
//                 style={styles.loginButton} 
//                 onPress={handleLogin}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.loginButtonText}>Masuk</Text>
//               </TouchableOpacity>
//             )}

//             {/* Help Section */}
//             {/* <View style={styles.helpContainer}>
//               <Text style={styles.helpText}>Butuh bantuan? </Text>
//               <TouchableOpacity>
//                 <Text style={styles.helpLink}>Hubungi Admin</Text>
//               </TouchableOpacity>
//             </View> */}
//           </View>

//           {/* Footer */}
//           <View style={styles.footer}>
//             <Text style={styles.footerText}>© 2025 HRISYG</Text>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// export default LoginAccount;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   scrollContent: {
//     flexGrow: 1,
//   },
//   headerContainer: {
//     height: screenHeight * 0.32,
//   },
//   headerBackground: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerOverlay: {
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 30,
//   },
//   logoContainer: {
//     marginBottom: 15,
//   },
//   logoCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 3,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 8,
//   },
//   logoText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#5EC898',
//     fontFamily: 'Poppins-Bold',
//   },
//   appName: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     fontFamily: 'Poppins-Bold',
//     color: 'white',
//     marginBottom: 3,
//     letterSpacing: 1,
//     textShadowColor: 'rgba(0, 0, 0, 0.2)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 3,
//   },
//   appTagline: {
//     fontSize: 10,
//     color: 'white',
//     fontFamily: 'Poppins-Regular',
//     opacity: 0.85,
//     marginBottom: 8,
//     textShadowColor: 'rgba(0, 0, 0, 0.15)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   greeting: {
//     fontSize: 14,
//     color: 'white',
//     fontFamily: 'Poppins-Medium',
//     opacity: 0.9,
//     textShadowColor: 'rgba(0, 0, 0, 0.15)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   formContainer: {
//     flex: 1,
//     marginTop: -35,
//   },
//   formCard: {
//     backgroundColor: 'white',
//     borderTopLeftRadius: 25,
//     borderTopRightRadius: 25,
//     paddingHorizontal: 24,
//     paddingTop: 30,
//     paddingBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: -3,
//     },
//     shadowOpacity: 0.08,
//     shadowRadius: 10,
//     elevation: 12,
//   },
//   formHeader: {
//     marginBottom: 25,
//   },
//   formTitle: {
//     fontSize: 20,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#2D2D2D',
//     marginBottom: 5,
//   },
//   formSubtitle: {
//     fontSize: 13,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     lineHeight: 19,
//   },
//   inputGroup: {
//     marginBottom: 18,
//   },
//   inputLabel: {
//     fontSize: 13,
//     fontFamily: 'Poppins-Medium',
//     color: '#444',
//     marginBottom: 7,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     backgroundColor: '#FAFAFA',
//     height: 50,
//   },
//   inputIcon: {
//     fontSize: 18,
//     marginRight: 10,
//   },
//   textInput: {
//     flex: 1,
//     fontSize: 14,
//     color: '#2D2D2D',
//     fontFamily: 'Poppins-Regular',
//     paddingVertical: 0,
//   },
//   eyeButton: {
//     padding: 6,
//   },
//   eyeIcon: {
//     fontSize: 18,
//   },
//   forgotPassword: {
//     alignSelf: 'flex-end',
//     marginBottom: 22,
//     marginTop: -8,
//   },
//   forgotPasswordText: {
//     fontSize: 12,
//     color: '#5EC898',
//     fontFamily: 'Poppins-Medium',
//   },
//   loginButton: {
//     backgroundColor: '#5EC898',
//     borderRadius: 12,
//     height: 50,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#5EC898',
//     shadowOffset: {
//       width: 0,
//       height: 3,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 6,
//     elevation: 6,
//   },
//   loginButtonText: {
//     color: 'white',
//     fontSize: 15,
//     fontWeight: '600',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   loadingText: {
//     color: 'white',
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     marginLeft: 8,
//   },
//   helpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 25,
//   },
//   helpText: {
//     fontSize: 13,
//     color: '#666',
//     fontFamily: 'Poppins-Regular',
//   },
//   helpLink: {
//     fontSize: 13,
//     color: '#5EC898',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   footer: {
//     paddingVertical: 18,
//     alignItems: 'center',
//   },
//   footerText: {
//     fontSize: 11,
//     color: '#999',
//     fontFamily: 'Poppins-Regular',
//   },
// });