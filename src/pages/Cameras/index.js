import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  ActivityIndicator, 
  StyleSheet, 
  PermissionsAndroid, 
  Platform, 
  TouchableOpacity,
  Dimensions,
  StatusBar,
  AppState,
  Linking
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../context/APIUrl';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// API Configuration
const API_BASE_URL = `${API_URL}/api`;

const Cameras = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(CameraType.Front);
  const [flashMode, setFlashMode] = useState('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [attendanceType, setAttendanceType] = useState(null);
  const [location, setLocation] = useState(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [permissionDeniedCount, setPermissionDeniedCount] = useState(0);
  
  const cameraRef = useRef(null);

  // Monitor app state untuk detect ketika user kembali dari settings
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App kembali ke foreground, cek permission lagi
        console.log('App returned to foreground, checking permissions...');
        checkAllPermissionsAndLocation();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // useFocusEffect untuk cek permission setiap kali screen focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Camera screen focused, checking permissions and location...');
      checkAllPermissionsAndLocation();
    }, [])
  );

  // Get attendance type from route params
  useEffect(() => {
    if (route?.params?.attendanceType) {
      setAttendanceType(route.params.attendanceType);
    }
  }, [route]);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Load current attendance when user data is available
  useEffect(() => {
    if (userData?.user?.id) {
      loadTodayAttendance();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@dataSelf');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  // Fungsi untuk cek semua permission dan lokasi
  const checkAllPermissionsAndLocation = async () => {
    try {
      setIsCheckingPermission(true);
      setIsGettingLocation(true);
      setLocationReady(false);
      
      // 1. Cek camera permission
      const hasCameraPermission = await checkCameraPermissionStatus();
      
      if (hasCameraPermission) {
        // 2. Jika camera OK, cek dan dapatkan lokasi
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Error checking permissions and location:', error);
      setIsCheckingPermission(false);
      setIsGettingLocation(false);
    }
  };

  // Fungsi cek & request izin lokasi
  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Izin Akses Lokasi',
            message: 'Aplikasi memerlukan akses lokasi untuk mencatat absensi. Mohon izinkan akses lokasi.',
            buttonNeutral: 'Tanya Lagi Nanti',
            buttonNegative: 'Tolak',
            buttonPositive: 'Izinkan',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Lokasi diizinkan');
          return true;
        } else {
          Alert.alert(
            'Izin Lokasi Diperlukan',
            'Aplikasi memerlukan akses lokasi untuk mencatat absensi. Tanpa izin ini, absensi tidak bisa dilanjutkan.',
            [
              { text: 'Keluar', onPress: () => navigation.goBack(), style: 'cancel' },
              { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      // iOS → langsung true, tapi pastikan Info.plist ada NSLocationWhenInUseUsageDescription
      return true;
    }
  };

  const getCurrentLocation = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsGettingLocation(true);
        
        const hasPermission = await checkLocationPermission();
        if (!hasPermission) {
          setIsGettingLocation(false);
          reject(new Error('Izin lokasi tidak diberikan'));
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: `${position.coords.latitude}, ${position.coords.longitude}`
            };
            
            setLocation(locationData);
            setLocationReady(true);
            setIsGettingLocation(false);
            console.log('Lokasi berhasil didapatkan:', locationData);
            resolve(locationData);
          },
          (error) => {
            console.log('Location error:', error);
            setIsGettingLocation(false);
            setLocationReady(false);
            
            Alert.alert(
              'Gagal Ambil Lokasi',
              'Tidak dapat mengambil lokasi. Pastikan GPS aktif dan izin lokasi diberikan.',
              [
                { 
                  text: 'Coba Lagi', 
                  onPress: () => {
                    getCurrentLocation().catch(console.error);
                  }
                },
                { text: 'Keluar', onPress: () => navigation.goBack(), style: 'cancel' },
              ]
            );
            reject(error);
          },
          { 
            enableHighAccuracy: false, 
            timeout: 20000, 
            maximumAge: 60000 
          }
        );
      } catch (error) {
        setIsGettingLocation(false);
        setLocationReady(false);
        reject(error);
      }
    });
  };

  const loadTodayAttendance = async () => {
    try {
      const getTodayDate = () => {
        const now = new Date();
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        return jakartaTime.toISOString().split('T')[0];
      };
      
      const today = getTodayDate();
      const response = await fetch(
        `${API_BASE_URL}/attendance?user_id=${userData.user.id}&start_date=${today}&end_date=${today}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.attendance && result.attendance.length > 0) {
          // Ambil attendance data pertama (hari ini)
          const todayData = result.attendance[0];
          setCurrentAttendance(todayData);
        } else {
          setCurrentAttendance(null);
        }
      }
    } catch (error) {
      console.log('Error loading today attendance:', error);
    }
  };

  // Fungsi untuk cek status camera permission saat ini
  const checkCameraPermissionStatus = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasCurrentPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        
        console.log('Current camera permission status:', hasCurrentPermission);
        
        if (hasCurrentPermission) {
          setHasPermission(true);
          setPermissionDeniedCount(0);
          return true;
        } else {
          setHasPermission(false);
          return false;
        }
      } else {
        // iOS handling
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  };

  // Fungsi untuk handle permission denied
  const handlePermissionDenied = () => {
    Alert.alert(
      'Akses Kamera Diperlukan',
      'Aplikasi memerlukan akses kamera untuk mengambil foto selfie absensi. Tanpa izin ini, fitur absensi tidak dapat digunakan.',
      [
        {
          text: 'Keluar',
          onPress: () => {
            console.log('User chose to exit due to camera permission denied');
            navigation.goBack();
          },
          style: 'cancel',
        },
        {
          text: 'Buka Pengaturan',
          onPress: () => {
            console.log('Opening app settings for camera permission');
            Linking.openSettings();
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Fungsi untuk request permission pertama kali
  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Izin Akses Kamera',
            message: 'Aplikasi memerlukan akses kamera untuk mengambil foto selfie absensi. Mohon berikan izin untuk melanjutkan.',
            buttonNeutral: 'Tanya Lagi Nanti',
            buttonNegative: 'Tolak',
            buttonPositive: 'Izinkan',
          }
        );
        
        console.log('Permission request result:', granted);
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          setPermissionDeniedCount(0);
          // Setelah dapat camera permission, langsung cek lokasi
          getCurrentLocation().catch(console.error);
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          // User menolak sekali
          const newCount = permissionDeniedCount + 1;
          setPermissionDeniedCount(newCount);
          
          if (newCount >= 2) {
            // Jika sudah ditolak 2 kali, arahkan ke settings
            Alert.alert(
              'Izin Kamera Diperlukan',
              'Anda telah menolak izin kamera beberapa kali. Mohon aktifkan izin kamera di Pengaturan aplikasi untuk menggunakan fitur absensi.',
              [
                {
                  text: 'Keluar',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                },
                {
                  text: 'Buka Pengaturan',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          } else {
            // Coba request lagi
            setTimeout(() => {
              requestCameraPermission();
            }, 1000);
          }
          
          setHasPermission(false);
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          // User memilih "Don't ask again"
          setHasPermission(false);
          Alert.alert(
            'Izin Kamera Diperlukan',
            'Izin kamera telah ditolak secara permanen. Mohon aktifkan izin kamera di Pengaturan aplikasi untuk menggunakan fitur absensi.',
            [
              {
                text: 'Keluar',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
              {
                text: 'Buka Pengaturan',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } else {
        setHasPermission(true);
        // iOS - langsung cek lokasi
        getCurrentLocation().catch(console.error);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      Alert.alert('Error', 'Terjadi kesalahan saat meminta izin kamera');
    }
  };

  // Initial permission check
  useEffect(() => {
    const initialPermissionCheck = async () => {
      try {
        setIsCheckingPermission(true);
        setIsGettingLocation(true);
        
        if (Platform.OS === 'android') {
          const hasCurrentPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          
          if (hasCurrentPermission) {
            setHasPermission(true);
            setIsCheckingPermission(false);
            // Langsung ambil lokasi
            await getCurrentLocation();
          } else {
            // Request permission untuk pertama kali
            setIsCheckingPermission(false);
            setTimeout(() => {
              requestCameraPermission();
            }, 500);
          }
        } else {
          setHasPermission(true);
          setIsCheckingPermission(false);
          // iOS - langsung ambil lokasi
          await getCurrentLocation();
        }
      } catch (error) {
        console.error('Error in initial permission check:', error);
        setHasPermission(false);
        setIsCheckingPermission(false);
        setIsGettingLocation(false);
      }
    };

    initialPermissionCheck();
  }, []);

  // Updated function to determine attendance type based on new API structure
  const determineAttendanceType = () => {
    if (attendanceType) {
      return attendanceType;
    }

    if (!currentAttendance) {
      return 'check_in';
    }

    // Check each attendance type based on new API structure
    if (!currentAttendance.check_in?.time) {
      return 'check_in';
    }
    
    if (currentAttendance.check_in?.time && !currentAttendance.break_out?.time) {
      return 'break_out';
    }
    
    if (currentAttendance.break_out?.time && !currentAttendance.break_in?.time) {
      return 'break_in';
    }
    
    if (currentAttendance.break_in?.time && !currentAttendance.check_out?.time) {
      return 'check_out';
    }
    
    // All attendance completed for today
    return null;
  };

  const getAttendanceTypeLabel = (type) => {
    const labels = {
      'check_in': 'Absen Masuk',
      'break_out': 'Absen Istirahat',
      'break_in': 'Kembali dari Istirahat', 
      'check_out': 'Absen Pulang'
    };
    return labels[type] || 'Absensi';
  };

  const submitAttendance = async (imageUri) => {
    try {
      if (!userData?.user?.id) {
        Alert.alert('Error', 'Data user tidak ditemukan');
        return false;
      }

      if (!location) {
        Alert.alert('Error', 'Lokasi belum tersedia. Mohon tunggu sebentar.');
        return false;
      }

      const type = determineAttendanceType();
      
      if (!type) {
        Alert.alert('Info', 'Absensi hari ini sudah lengkap');
        return false;
      }

      const formData = new FormData();
      formData.append('type', type);
      formData.append('user_id', userData.user.id.toString());
      
      formData.append('location', location.address);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `attendance_${type}_${Date.now()}.jpg`,
      });

      const notes = `${getAttendanceTypeLabel(type)} - ${new Date().toLocaleString('id-ID')}`;
      formData.append('notes', notes);

      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = await response.json();
      const successData = {
        attendanceType: type,
        attendanceLabel: getAttendanceTypeLabel(type),
        timestamp: new Date().toISOString(),
        userData: userData,
        location: location,
        imageUri: imageUri,
        status: 'Pending' // Status will be pending as per new API
      };
      
      if (response.ok) {
        navigation.replace('AbsenSuccessScreen', successData);
        return true;
      } else {
        throw new Error(result.error || 'Failed to submit attendance');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      Alert.alert('Error', `Gagal mencatat absensi: ${error.message}`);
      return false;
    }
  };

  const takeSelfie = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    if (!locationReady || !location) {
      Alert.alert('Tunggu Sebentar', 'Masih mengambil lokasi. Mohon tunggu sampai lokasi tersedia.');
      return;
    }
    
    // Double check permission sebelum mengambil foto
    if (Platform.OS === 'android') {
      const hasCurrentPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      
      if (!hasCurrentPermission) {
        Alert.alert(
          'Izin Kamera Diperlukan',
          'Izin kamera telah dimatikan. Mohon aktifkan kembali untuk mengambil foto.',
          [
            {
              text: 'Keluar',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Buka Pengaturan',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
    }
    
    const type = determineAttendanceType();
    if (!type) {
      Alert.alert('Info', 'Absensi hari ini sudah lengkap');
      return;
    }
    
    try {
      setIsCapturing(true);
      
      const image = await cameraRef.current.capture({
        quality: 0.8,
        skipProcessing: true,
        flashMode: flashMode,
      });
      
      const success = await submitAttendance(image.uri);
      
      if (!success) {
        setIsCapturing(false);
      }
      
    } catch (error) {
      console.error('Error taking selfie:', error);
      Alert.alert('Error', 'Gagal mengambil foto selfie: ' + error.message);
      setIsCapturing(false);
    }
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  // Show loading while checking permission atau getting location
  if (isCheckingPermission || hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memeriksa izin kamera...</Text>
        <Text style={styles.subLoadingText}>
          Mohon tunggu sebentar...
        </Text>
      </View>
    );
  }

  // Show location loading
  if (hasPermission && isGettingLocation && !locationReady) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="map-marker-alt" size={60} color="#4CAF50" />
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Mengambil lokasi...</Text>
        <Text style={styles.subLoadingText}>
          Pastikan GPS aktif dan izin lokasi diberikan.{'\n'}
          Proses ini mungkin memerlukan waktu beberapa saat.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => getCurrentLocation().catch(console.error)}
        >
          <FontAwesome5 name="redo" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show permission denied screen
  if (hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="camera-slash" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.errorText}>
          Aplikasi memerlukan akses kamera untuk mengambil foto selfie absensi. 
          Tanpa izin ini, Anda tidak dapat menggunakan fitur absensi.
        </Text>
        
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => Linking.openSettings()}
        >
          <FontAwesome5 name="cog" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.settingsButtonText}>Buka Pengaturan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={requestCameraPermission}
        >
          <FontAwesome5 name="redo" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton2} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show location error (permission OK tapi lokasi gagal)
  if (hasPermission && !isGettingLocation && !locationReady) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="map-marker-alt" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Lokasi Diperlukan</Text>
        <Text style={styles.errorText}>
          Tidak dapat mengambil lokasi. Pastikan GPS aktif dan izin lokasi diberikan 
          untuk melanjutkan proses absensi.
        </Text>
        
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => Linking.openSettings()}
        >
          <FontAwesome5 name="cog" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.settingsButtonText}>Buka Pengaturan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => getCurrentLocation().catch(console.error)}
        >
          <FontAwesome5 name="redo" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.retryButtonText}>Coba Ambil Lokasi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton2} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentType = determineAttendanceType();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentType ? getAttendanceTypeLabel(currentType) : 'Selfie Absensi'}
        </Text>
        <TouchableOpacity 
          style={styles.flashButton} 
          onPress={toggleFlash}
        >
          <FontAwesome5 
            name="flash" 
            size={20} 
            color={flashMode === 'off' ? '#fff' : '#FFD700'} 
          />
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <Camera
        ref={cameraRef}
        cameraType={cameraType}
        flashMode={flashMode}
        style={styles.camera}
        scanBarcode={false}
      />

      {/* Face Frame Overlay */}
      <View style={styles.overlay}>
        <View style={styles.faceFrameContainer}>
          <View style={styles.faceFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Text style={styles.instructionText}>
            Posisikan wajah Anda di dalam frame
          </Text>
          <Text style={styles.subInstructionText}>
            {currentType ? `Untuk ${getAttendanceTypeLabel(currentType)}` : 'Pastikan wajah terlihat jelas'}
          </Text>
          
          {locationReady && location && (
            <View style={styles.locationContainer}>
              <FontAwesome5 name="map-marker-alt" size={12} color="#4CAF50" />
              <Text style={styles.locationText}>
                {location.address}
              </Text>
            </View>
          )}
          
          {!locationReady && (
            <View style={styles.locationContainer}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.locationLoadingText}>
                Menunggu lokasi...
              </Text>
            </View>
          )}

          {/* Show attendance status info */}
         
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setCameraType(
            cameraType === CameraType.Back ? CameraType.Front : CameraType.Back
          )}
        >
          <FontAwesome5 name="sync-alt" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton, 
            isCapturing && styles.capturingButton,
            (!currentType || !locationReady) && styles.disabledButton
          ]}
          onPress={takeSelfie}
          disabled={isCapturing || !currentType || !locationReady}
        >
          {isCapturing ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <View style={[
              styles.captureButtonInner,
              (!currentType || !locationReady) && styles.disabledButtonInner
            ]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => {
            let message = '';
            if (!locationReady) {
              message = 'Menunggu lokasi tersedia...';
            } else if (currentType) {
              message = `Langkah selanjutnya: ${getAttendanceTypeLabel(currentType)}`;
            } else {
              message = 'Absensi hari ini sudah lengkap';
            }
            
            // Add attendance status info
            if (currentAttendance) {
              message += '\n\nStatus Hari Ini:';
              message += `\n• Check In: ${currentAttendance.check_in?.time ? `✓ (${currentAttendance.check_in.status})` : '✗ Belum'}`;
              message += `\n• Break Out: ${currentAttendance.break_out?.time ? `✓ (${currentAttendance.break_out.status})` : '✗ Belum'}`;
              message += `\n• Break In: ${currentAttendance.break_in?.time ? `✓ (${currentAttendance.break_in.status})` : '✗ Belum'}`;
              message += `\n• Check Out: ${currentAttendance.check_out?.time ? `✓ (${currentAttendance.check_out.status})` : '✗ Belum'}`;
            }
            
            Alert.alert('Status Absensi', message);
          }}
        >
          <FontAwesome5 name="info-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Cameras;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  settingsButton: {
    marginTop: 30,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton2: {
    marginTop: 15,
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  faceFrameContainer: {
    alignItems: 'center',
  },
  faceFrame: {
    width: 250,
    height: 320,
    borderRadius: 125,
    position: 'relative',
    marginBottom: 30,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 15,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 15,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 15,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 15,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subInstructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationLoadingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    minWidth: 200,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusRow: {
    marginBottom: 5,
  },
  statusItem: {
    fontSize: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  completed: {
    color: '#4CAF50',
  },
  pending: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  capturingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#999',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
  },
  disabledButtonInner: {
    backgroundColor: '#999',
  },
  infoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});