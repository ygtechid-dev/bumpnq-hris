/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useRef } from 'react';
import { 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Dimensions,
  FlatList,
  Linking
} from 'react-native';
import FastImage from 'react-native-fast-image';

import Logo from '../../assets/logobumpnqnew.png';
import { database } from '../../config/Fire';
import { ref, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import banner images from assets/bannerex
const bannerImages = [
  require('../../assets/bannerex.png'), // Sesuaikan dengan nama file yang ada
  require('../../assets/bannerex.png'),
  require('../../assets/bannerex.png'),
  // Tambahkan banner lainnya sesuai kebutuhan
];

const { width: screenWidth } = Dimensions.get('window');

const Login = ({navigation}) => {
  const [inputan, setInput] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const slideRef = useRef(null);
const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);


  const API_URL = "https://api.bumpnqweb.my.id/api/banners"; // endpoint API banners

  // Fetch banners from API
  const fetchBanners = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      console.log('====================================');
      console.log('bann', json);
      console.log('====================================');
      setBanners(json.banners || []);
    } catch (err) {
      console.error("Error fetching banners:", err);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);


  // Auto slide effect

  
  useEffect(() => {
    if (banners.length === 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => {
        const nextSlide = (prev + 1) % banners.length;
        slideRef.current?.scrollToIndex({ index: nextSlide, animated: true });
        return nextSlide;
      });
    }, 3000);
    return () => clearInterval(slideInterval);
  }, [banners]);

  const handleLogin = async () => {
    setLoading(true);

    if (inputan.email === "") {
      setLoading(false);
      alert('Silahkan input username');
      return;
    }

    if (inputan.password === "") {
      setLoading(false);
      alert('Silahkan input password');
      return;
    }

    try {
      const dbRef = ref(database, 'userlogin/');
      const snapshot = await get(dbRef);
      const value = snapshot.val();

      if (value) {
        const datled = Object.values(value);
        const allFilterData = datled.filter((user) => 
          (user.handphone === inputan.email || user.handphone === inputan.email) && 
          user.password === inputan.password
        );

        setLoading(false);

        const prefix = 'TKN';
        const uniquenumber = Math.floor(Math.random() * 1000000);
        const tkn = prefix + uniquenumber;
        const tostrings = JSON.stringify(allFilterData);

        if (allFilterData.length > 0) {
          await AsyncStorage.setItem('@token', tkn);
          await AsyncStorage.setItem('@dataSelf', tostrings);
          navigation.replace('Home');
        } else {
          alert('Data Tidak Ada');
        }
      }
    } catch (err) {
      setLoading(false);
      console.log('Error:', err);
    }
  };

 const renderBannerItem = ({ item }) => (
   <FastImage
    source={{ uri: item.image_url }}
    style={styles.bannerImage}
    resizeMode={FastImage.resizeMode.cover}
  />
);

const onSlideChange = (event) => {
  const slideIndex = Math.round(
    event.nativeEvent.contentOffset.x / screenWidth
  );
  setCurrentSlide(slideIndex);
};


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header dengan Logo */}
      <View style={styles.headerContainer}>
        <Image source={Logo} style={styles.logo} />
       
      </View>

      {/* Banner Slideshow */}
      <View style={styles.bannerContainer}>
        {banners.length > 0 ? (
          <>
            <FlatList
              ref={slideRef}
              data={banners}
              renderItem={renderBannerItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onSlideChange}
              keyExtractor={(item, index) => index.toString()}
            />
            {/* Slide Indicators */}
           
          </>
        ) : (
          <ActivityIndicator size="large" color="#4CAF50" />
        )}
      </View>

       <Text style={styles.welcomeTitle}>Selamat Datang di Aplikasi</Text>
        <Text style={styles.appName}>BUMP-NQ</Text>
      {/* Login Form */}
      <View style={styles.formContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('LoginAccount')}>
          <Text style={styles.loginButtonText}>Masuk dengan Akun BUMP-NQ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.hrButton}
          onPress={() => Linking.openURL('https://wa.me/6285336666193')} // Sesuaikan dengan route yang ada
        >
          <Text style={styles.hrButtonText}>{'Hubungi\nAdmin BUMP-NQ'}</Text>
        </TouchableOpacity>

        {/* Form Input (Hidden by default, bisa ditampilkan dengan state) */}
        <View style={styles.hiddenForm}>
          <TextInput
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Nomor Handphone"
            onChangeText={(e) => setInput({ ...inputan, email: e })}  
          />
          <TextInput
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Password"
            secureTextEntry={hidePassword}
            onChangeText={(e) => setInput({ ...inputan, password: e })}  
          />

          <Text style={styles.forgotPassword}>{'Forgot your password?'}</Text>

          {loading ? 
            <ActivityIndicator size="large" color="#4CAF50" />
            :
            <TouchableOpacity style={styles.btn} onPress={handleLogin}>
              <Text style={styles.txtBtn}>Login</Text>
            </TouchableOpacity>
          }

          <View style={styles.signupContainer}>
            <Text style={styles.descHead}>{'Not in App yet?'}</Text>
            <TouchableOpacity onPress={() => navigation.push('Register')}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.push('LoginGuest')}>
              <Text style={styles.guestText}>Login as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: 'white',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: -5,
  },
  welcomeTitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
    marginTop: -20
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',

    color: '#333',
    textAlign: 'center',
    letterSpacing: 1,
  },
  bannerContainer: {
    height: 280,
    marginVertical: 10,
    position: 'relative',
    paddingHorizontal: 10,
  },
  bannerImage: {
    width: screenWidth - 20,
    height: 200,
    borderRadius: 15,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    width: '100%',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    marginTop: -10
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
  },
  inactiveIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  loginButton: {
    backgroundColor: '#5EC898',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    width: '100%',
    height: 54
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  hrButton: {
    // backgroundColor: '#4CAF50',
    paddingVertical: 3,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    width: 180,
  },
  hrButtonText: {
    color: '#5EC898',
    fontSize: 14,
    fontWeight: '500',
    width: 300,
    textAlign: 'center'
  },
  // Hidden form styles (untuk form login yang asli, bisa ditampilkan jika diperlukan)
  hiddenForm: {
    display: 'none', // Sembunyikan form asli
  },
  txtInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    padding: 15,
    borderColor: '#E0E2EA',
    color: 'black',
    fontSize: 16,
  },
  forgotPassword: {
    color: '#7F6000',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  txtBtn: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    alignItems: 'center',
  },
  descHead: {
    color: '#7F6000',
    fontSize: 14,
    marginBottom: 10,
  },
  signupText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  guestText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
});