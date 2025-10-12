import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// Import background
import BgSuccessAbsen from '../../assets/bgsuccessabsen.png';
import IcSuccessAbsen from '../../assets/icabsenberhasil.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AbsenSuccessScreen = ({ navigation, route }) => {
  // Get data from navigation params
  const {
    attendanceType = 'check_in',
    attendanceLabel = 'Absen Masuk',
    timestamp,
    userData,
    location,
    imageUri
  } = route?.params || {};

  // Get current time in WIB format
  const getCurrentTime = () => {
    if (timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      });
    }
    
    const now = new Date();
    return now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  // Get success message based on attendance type
  const getSuccessMessage = () => {
    const messages = {
      'check_in': 'Anda Berhasil Absen Masuk',
      'break_out': 'Anda Berhasil Absen Istirahat',
      'break_in': 'Anda Berhasil Kembali dari Istirahat',
      'check_out': 'Anda Berhasil Absen Pulang'
    };
    return messages[attendanceType] || 'Absensi Berhasil';
  };

  // Get congratulations message based on attendance type
  const getCongratsMessage = () => {
    const messages = {
      'check_in': 'Selamat Bekerja!',
      'break_out': 'Selamat Istirahat!',
      'break_in': 'Semangat Bekerja!',
      'check_out': 'Selamat Beristirahat!'
    };
    return messages[attendanceType] || 'Terima Kasih!';
  };

  return (
    <ImageBackground source={BgSuccessAbsen} style={styles.backgroundImage}>
      <StatusBar backgroundColor="rgba(255, 255, 255, 0.3)" barStyle="dark-content" />
      
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('HomeWithTabs')}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>

        {/* Success Content */}
        <View style={styles.contentContainer}>
          {/* Success Icon with Animation Dots */}
          <View style={styles.successIconContainer}>
           <Image source={IcSuccessAbsen} style={{width: 120, height: 120}} />
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>{getSuccessMessage()}</Text>
          
          {/* Time */}
          <Text style={styles.timeText}>{getCurrentTime()} WIB</Text>

          {/* User Info Card */}
          <View style={styles.userCard}>
            {/* User Avatar - Use captured selfie if available, otherwise default */}
            <Image 
              source={
                imageUri 
                  ? { uri: imageUri } 
                  : { uri: 'https://i.pravatar.cc/150' }
              } 
              style={styles.userAvatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userData?.user?.name || userData?.user?.full_name || 'Mike Cooper'}
              </Text>
              <Text style={styles.userPosition}>
                {userData?.user?.position || userData?.user?.job_title || 'Marketing Officer'}
              </Text>
              <Text style={styles.userCode}>
                {userData?.user?.employee_id || userData?.user?.code || 'DE3824-MO4'}
              </Text>
            </View>
            <View style={styles.checkIcon}>
              <FontAwesome5 name="check" size={16} color="white" />
            </View>
          </View>

          {/* Location Info */}
          {location && (
            <View style={styles.locationCard}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#666" />
              <Text style={styles.locationText}>
                {location.address}
              </Text>
            </View>
          )}

          {/* Congratulations Message */}
          <Text style={styles.congratsText}>{getCongratsMessage()}</Text>
        </View>

        {/* Bottom Button */}
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'HomeWithTabs' }],
          })}
        >
          <Text style={styles.homeButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default AbsenSuccessScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  animatedDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B0BEC5',
  },
  dot1: {
    top: -15,
    left: 36,
  },
  dot2: {
    top: 15,
    right: -15,
  },
  dot3: {
    bottom: -15,
    left: 36,
  },
  dot4: {
    top: 15,
    left: -15,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  timeText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#3FCCBE',
    textAlign: 'center',
    marginBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userCode: {
    fontSize: 12,
    color: '#999',
  },
  checkIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  congratsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#3FCCBE',
    borderRadius: 25,
    paddingVertical: 15,
    marginBottom: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  });