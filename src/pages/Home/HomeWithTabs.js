/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Import background
import BgHeader from '../../assets/bgheaderbump.png';
import KehadiranIcon from '../../assets/kehadiranicon.png';
import PengajuanLembur from '../../assets/pengajuanlembur.png';
import KonsulHR from '../../assets/konsulhr.png';
import Payslip from '../../assets/payslip.png';

import PengajuanCuti from '../../assets/pengajuancuti.png';
import { API_URL } from '../../context/APIUrl';

const { width: screenWidth } = Dimensions.get('window');

// Home Screen Component
const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftSchedule, setShiftSchedule] = useState(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState({ tomorrow: null, dayAfter: null });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [attendanceError, setAttendanceError] = useState(false);
  
  // State untuk Worksheet
  const [worksheets, setWorksheets] = useState([]);
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  
  // State untuk Modal Checklist
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [submittingChecklist, setSubmittingChecklist] = useState(false);

  // Timer untuk update waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // useFocusEffect untuk refresh data ketika screen mendapat focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen focused - refreshing data...');
      loadUserData();
      
      // Reset loading state
      setLoading(true);
      
      return () => {
        // Cleanup function (optional)
        console.log('HomeScreen unfocused');
      };
    }, [])
  );

  // useFocusEffect khusus untuk shift schedules - refresh lebih sering
  useFocusEffect(
    React.useCallback(() => {
      // Hanya load shift jika userData sudah tersedia
      if (userData?.user?.id) {
        console.log('Refreshing shift schedules on focus...');
        loadShiftSchedule();
        loadUpcomingSchedules();
        loadUnreadNotifications(); 
        loadTodayWorksheets(); // Load worksheets
      }
    }, [userData])
  );

  // Helper function untuk format tanggal konsisten
  const formatDateToYMD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function untuk cek apakah tanggal sama
  const isSameDate = (date1, date2) => {
    return formatDateToYMD(date1) === formatDateToYMD(date2);
  };

  // Helper function untuk mendapatkan tanggal hari ini
  const getTodayDate = () => {
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // +7 jam offset
    return jakartaTime.toISOString().split('T')[0];
  };

  // Helper function untuk mendapatkan tanggal besok
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToYMD(tomorrow);
  };

  // Helper function untuk mendapatkan tanggal lusa
  const getDayAfterTomorrowDate = () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDateToYMD(dayAfter);
  };

  // Helper function untuk mendapatkan nama hari
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
  };

  // Load data ketika userData berubah
  useEffect(() => {
    if (userData?.user?.id) {
      console.log('Loading data for user:', userData.user.id);
      loadAllData();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@dataSelf');
      if (data) {
        const parsedData = JSON.parse(data);
        console.log('====================================');
        console.log('User Data Loaded:', parsedData);
        console.log('====================================');
        setUserData(parsedData || {});
      }
    } catch (error) {
      console.log('Error loading user data:', error);
      setLoading(false);
    }
  };

  // Fungsi untuk load jumlah notifikasi yang belum dibaca
  const loadUnreadNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`);
      
      if (response.ok) {
        const result = await response.json();
        const notifications = result.notifications || [];
        const unreadCount = notifications.filter(notification => !notification.is_read).length;
        console.log('Unread notifications count:', unreadCount);
        setUnreadNotifications(unreadCount);
      } else {
        console.log('Failed to load notifications for badge');
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.log('Error loading notifications for badge:', error);
      setUnreadNotifications(0);
    }
  };

  // =================== WORKSHEET FUNCTIONS ===================
  
  // Load worksheets hari ini
  const loadTodayWorksheets = async () => {
    if (!userData?.user?.id) return;
    
    setWorksheetLoading(true);
    try {
      console.log('🔄 Loading today worksheets...');
      
      // Generate worksheets untuk hari ini
      const generateResponse = await fetch(`${API_URL}/api/worksheets/generate-today`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id
        })
      });

      if (generateResponse.ok) {
        const result = await generateResponse.json();
        console.log('✅ Worksheets loaded:', result.worksheets?.length || 0);
        setWorksheets(result.worksheets || []);
      } else {
        console.log('❌ Failed to load worksheets');
        setWorksheets([]);
      }
    } catch (error) {
      console.log('❌ Error loading worksheets:', error);
      setWorksheets([]);
    } finally {
      setWorksheetLoading(false);
    }
  };

  // Handle open checklist modal
  const handleOpenChecklistModal = (worksheet) => {
    setSelectedWorksheet(worksheet);
    setNotes('');
    setUploadedImage(null);
    setChecklistModalVisible(true);
  };

  // Handle close modal
  const handleCloseChecklistModal = () => {
    setChecklistModalVisible(false);
    setSelectedWorksheet(null);
    setNotes('');
    setUploadedImage(null);
  };

  // Handle pilih gambar
  const handlePickImage = () => {
    Alert.alert(
      'Upload Foto',
      'Pilih sumber foto',
      [
        {
          text: 'Kamera',
          onPress: () => openCamera(),
        },
        {
          text: 'Galeri',
          onPress: () => openGallery(),
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

 
const openCamera = async () => {
  let permission;

  if (Platform.OS === 'android') {
    permission = PERMISSIONS.ANDROID.CAMERA;
  } else {
    permission = PERMISSIONS.IOS.CAMERA;
  }

  const result = await check(permission);
  if (result !== RESULTS.GRANTED) {
    const reqResult = await request(permission);
    if (reqResult !== RESULTS.GRANTED) {
      Alert.alert('Izin Diperlukan', 'Kamera tidak dapat digunakan tanpa izin.');
      return;
    }
  }

  // Jika izin sudah diberikan, jalankan kamera
  const options = {
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: false,
  };

  launchCamera(options, (response) => {
    if (response.didCancel) {
      console.log('User cancelled camera');
    } else if (response.errorCode) {
      console.log('Camera Error: ', response.errorMessage);
      Alert.alert('Error', 'Gagal membuka kamera');
    } else if (response.assets && response.assets.length > 0) {
      setUploadedImage(response.assets[0]);
    }
  });
};

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Gagal membuka galeri');
      } else if (response.assets && response.assets.length > 0) {
        setUploadedImage(response.assets[0]);
      }
    });
  };

  // Handle submit checklist
  const handleSubmitChecklist = async () => {
    if (!selectedWorksheet) return;

    setSubmittingChecklist(true);
    try {
      const formData = new FormData();
      formData.append('is_completed', 'true');
      
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      if (uploadedImage) {
        formData.append('image', {
          uri: uploadedImage.uri,
          type: uploadedImage.type || 'image/jpeg',
          name: uploadedImage.fileName || `worksheet_${Date.now()}.jpg`,
        });
      }

      console.log('📤 Submitting checklist for worksheet:', selectedWorksheet.id);

      const response = await fetch(
        `${API_URL}/api/worksheets/${selectedWorksheet.id}/complete`,
        {
          method: 'PUT',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Checklist submitted successfully');
        
        Alert.alert(
          'Berhasil',
          'Task berhasil diselesaikan!',
          [
            {
              text: 'OK',
              onPress: () => {
                handleCloseChecklistModal();
                loadTodayWorksheets(); // Reload worksheets
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        console.log('❌ Failed to submit checklist:', errorData);
        Alert.alert('Error', errorData.error || 'Gagal menyelesaikan task');
      }
    } catch (error) {
      console.log('❌ Error submitting checklist:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyelesaikan task');
    } finally {
      setSubmittingChecklist(false);
    }
  };

  // Handle uncheck task
  const handleUncheckTask = async (worksheet) => {
    Alert.alert(
      'Batalkan Checklist',
      'Apakah Anda yakin ingin membatalkan checklist task ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append('is_completed', 'false');

              const response = await fetch(
                `${API_URL}/api/worksheets/${worksheet.id}/complete`,
                {
                  method: 'PUT',
                  body: formData,
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                }
              );

              if (response.ok) {
                console.log('✅ Task unchecked successfully');
                loadTodayWorksheets(); // Reload worksheets
              } else {
                Alert.alert('Error', 'Gagal membatalkan checklist');
              }
            } catch (error) {
              console.log('❌ Error unchecking task:', error);
              Alert.alert('Error', 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };

  // =================== END WORKSHEET FUNCTIONS ===================

  // Fungsi untuk load semua data sekaligus
  const loadAllData = async () => {
    try {
      console.log('Loading all data...');
      await Promise.all([
        loadShiftSchedule(),
        loadUpcomingSchedules(),
        loadTodayAttendance(),
        loadAttendanceHistory(),
        loadUnreadNotifications(),
        loadTodayWorksheets() // Tambahkan load worksheets
      ]);
    } catch (error) {
      console.log('Error loading all data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShiftSchedule = async () => {
    if (!userData?.user?.id) return;
    
    try {
      const today = getTodayDate();
      const response = await fetch(
        `${API_URL}/api/shift-schedules?user_id=${userData.user.id}&start_date=${today}&end_date=${today}`
      );
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.shift_schedules && result.shift_schedules.length > 0) {
          const todayShift = result.shift_schedules.find(item => 
            isSameDate(item.shift_date, today)
          );
          
          setShiftSchedule(todayShift || null);
        } else {
          setShiftSchedule(null);
        }
      } else {
        setShiftSchedule(null);
      }
    } catch (error) {
      console.log('Error loading shift schedule:', error);
      setShiftSchedule(null);
    }
  };

  const loadUpcomingSchedules = async () => {
    if (!userData?.user?.id) return;
    
    try {
      const tomorrow = getTomorrowDate();
      const dayAfter = getDayAfterTomorrowDate();
      
      const response = await fetch(
        `${API_URL}/api/shift-schedules?user_id=${userData.user.id}&start_date=${tomorrow}&end_date=${dayAfter}`
      );
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.shift_schedules && result.shift_schedules.length > 0) {
          const tomorrowShift = result.shift_schedules.find(item => 
            isSameDate(item.shift_date, tomorrow)
          );
          
          const dayAfterShift = result.shift_schedules.find(item => 
            isSameDate(item.shift_date, dayAfter)
          );
          
          setUpcomingSchedules({
            tomorrow: tomorrowShift || null,
            dayAfter: dayAfterShift || null
          });
        } else {
          setUpcomingSchedules({ tomorrow: null, dayAfter: null });
        }
      } else {
        setUpcomingSchedules({ tomorrow: null, dayAfter: null });
      }
    } catch (error) {
      console.log('Error loading upcoming schedules:', error);
      setUpcomingSchedules({ tomorrow: null, dayAfter: null });
    }
  };

  const loadTodayAttendance = async () => {
    if (!userData?.user?.id) return;
    
    try {
      setAttendanceError(false); // Reset error state
      const today = getTodayDate();
      const response = await fetch(
        `${API_URL}/api/attendance?user_id=${userData.user.id}&start_date=${today}&end_date=${today}`
      );
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.attendance && result.attendance.length > 0) {
          const todayData = result.attendance.find(item => 
            isSameDate(item.date, today)
          );
          
          setTodayAttendance(todayData || null);
        } else {
          setTodayAttendance(null);
        }
      } else {
        console.log('❌ Failed to load today attendance - status:', response.status);
        setAttendanceError(true);
        setTodayAttendance(null);
      }
    } catch (error) {
      console.log('❌ Error loading today attendance:', error);
      setAttendanceError(true);
      setTodayAttendance(null);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!userData?.user?.id) return;
    
    try {
      const endDate = getTodayDate();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = formatDateToYMD(startDate);

      const response = await fetch(
        `${API_URL}/api/attendance?user_id=${userData.user.id}&start_date=${startDateStr}&end_date=${endDate}`
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.attendance) {
          const today = getTodayDate();
          
          let formattedHistory = [];
          
          result.attendance.forEach(item => {
            const checkInTime = item.check_in?.time 
              ? formatTimeFromISO(item.check_in.time)
              : null;
            const checkOutTime = item.check_out?.time 
              ? formatTimeFromISO(item.check_out.time)
              : null;

            if (checkInTime) {
              formattedHistory.push({
                id: `${item.id}_in`,
                name: item.user?.full_name || userData.user.full_name,
                position: userData.user.position,
                time: checkInTime,
                avatar: '👤',
                status: 'in',
                date: item.date,
                datetime: new Date(item.check_in.time),
                isToday: isSameDate(item.date, today)
              });
            }

            if (checkOutTime) {
              formattedHistory.push({
                id: `${item.id}_out`,
                name: item.user?.full_name || userData.user.full_name,
                position: userData.user.position,
                time: checkOutTime,
                avatar: '👤',
                status: 'out',
                date: item.date,
                datetime: new Date(item.check_out.time),
                isToday: isSameDate(item.date, today)
              });
            }
          });

          formattedHistory.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

          setAttendanceHistory(formattedHistory);
        } else {
          setAttendanceHistory([]);
        }
      } else {
        setAttendanceHistory([]);
      }
    } catch (error) {
      console.log('Error loading attendance history:', error);
      setAttendanceHistory([]);
    }
  };

  // Fungsi untuk refresh attendance data
  const handleRefreshAttendance = async () => {
    setLoading(true);
    try {
      await loadTodayAttendance();
      if (!attendanceError) {
        Alert.alert('Berhasil', 'Data berhasil dimuat ulang');
      }
    } catch (error) {
      console.log('Error refreshing attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const formatTimeFromISO = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  const getShiftStartTime = (shift = null) => {
    const shiftToUse = shift || shiftSchedule;
    if (shiftToUse && shiftToUse.shifts && shiftToUse.shifts.start_time) {
      const startTime = shiftToUse.shifts.start_time;
      if (startTime.includes(':')) {
        const parts = startTime.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return startTime;
    }
    return 'Tidak Ada Jadwal';
  };

  const getShiftEndTime = () => {
    if (shiftSchedule && shiftSchedule.shifts && shiftSchedule.shifts.end_time) {
      const endTime = shiftSchedule.shifts.end_time;
      if (endTime.includes(':')) {
        const parts = endTime.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return endTime;
    }
    return null;
  };

  const getShiftBreakOutTime = () => {
    if (shiftSchedule && shiftSchedule.shifts && shiftSchedule.shifts.break_out_time) {
      const breakOutTime = shiftSchedule.shifts.break_out_time;
      if (breakOutTime.includes(':')) {
        const parts = breakOutTime.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return breakOutTime;
    }
    return null;
  };

  const getShiftBreakInTime = () => {
    if (shiftSchedule && shiftSchedule.shifts && shiftSchedule.shifts.break_in_time) {
      const breakInTime = shiftSchedule.shifts.break_in_time;
      if (breakInTime.includes(':')) {
        const parts = breakInTime.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return breakInTime;
    }
    return null;
  };

  const getTodayScheduleText = () => {
    if (!shiftSchedule || !shiftSchedule.shifts || !shiftSchedule.shifts.start_time) {
      return "Tidak Ada Jadwal/Libur";
    }

    if (!todayAttendance) {
      return `Jadwal Masuk: ${getShiftStartTime()} WIB`;
    }

    if (!todayAttendance.check_in?.time) {
      return `Jadwal Masuk: ${getShiftStartTime()} WIB`;
    }

    if (todayAttendance.check_in?.time && !todayAttendance.break_out?.time) {
      return `Jadwal Istirahat: ${getShiftBreakOutTime()} WIB`;
    }

    if (todayAttendance.break_out?.time && !todayAttendance.break_in?.time) {
      return `Jadwal Kembali: ${getShiftBreakInTime()} WIB`;
    }

    if (todayAttendance.break_in?.time && !todayAttendance.check_out?.time) {
      const endTime = getShiftEndTime();
      return endTime ? `Jadwal Pulang: ${endTime} WIB` : "Jadwal Pulang";
    }

    if (todayAttendance.check_out?.time) {
      return "Absensi Hari Ini Selesai";
    }

    return `Jadwal Masuk: ${getShiftStartTime()} WIB`;
  };

  const hasPendingAttendance = () => {
    if (!todayAttendance) return false;
    
    const checkInStatus = todayAttendance.check_in?.status;
    const checkOutStatus = todayAttendance.check_out?.status;
    const breakInStatus = todayAttendance.break_in?.status;
    const breakOutStatus = todayAttendance.break_out?.status;
    
    return checkInStatus === 'Pending' || 
           checkOutStatus === 'Pending' || 
           breakInStatus === 'Pending' || 
           breakOutStatus === 'Pending';
  };

  const getCurrentAttendanceStatus = () => {
    if (!todayAttendance) {
      return {
        type: 'check_in',
        title: 'Status Absen Masuk',
        text: 'Belum Absen',
        color: '#FF6B6B',
        hasCheckedIn: false
      };
    }
    
    if (!todayAttendance.check_in?.time) {
      return {
        type: 'check_in',
        title: 'Status Absen Masuk',
        text: 'Belum Absen',
        color: '#FF6B6B',
        hasCheckedIn: false
      };
    }
    
    if (todayAttendance.check_in?.time && !todayAttendance.break_out?.time) {
      return {
        type: 'break_out',
        title: 'Absen Istirahat',
        text: 'Belum Absen Istirahat',
        color: '#FF9800',
        hasCheckedIn: true
      };
    }
    
    if (todayAttendance.break_out?.time && !todayAttendance.break_in?.time) {
      const breakOutTime = formatTimeFromISO(todayAttendance.break_out.time);
      return {
        type: 'break_in',
        title: 'Kembali dari Istirahat',
        text: `Istirahat sejak ${breakOutTime}`,
        color: '#2196F3',
        hasCheckedIn: true
      };
    }
    
    if (todayAttendance.break_in?.time && !todayAttendance.check_out?.time) {
      return {
        type: 'check_out',
        title: 'Absen Pulang',
        text: 'Belum Absen Pulang',
        color: '#9C27B0',
        hasCheckedIn: true
      };
    }
    
    if (todayAttendance.check_out?.time) {
      const checkOutTime = formatTimeFromISO(todayAttendance.check_out.time);
      return {
        type: 'completed',
        title: 'Absen Selesai',
        text: `Pulang ${checkOutTime}`,
        color: '#4CAF50',
        hasCheckedIn: true
      };
    }
    
    return {
      type: 'check_in',
      title: 'Status Absen Masuk',
      text: 'Belum Absen',
      color: '#FF6B6B',
      hasCheckedIn: false
    };
  };

  const handleAbsenPress = () => {
    // Cek jika ada error attendance
    if (attendanceError) {
      Alert.alert(
        'Error Memuat Data',
        'Tidak dapat memuat data absensi. Silakan refresh terlebih dahulu.',
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      return;
    }

    if (hasPendingAttendance()) {
      Alert.alert(
        'Absensi Pending',
        'Anda masih memiliki absensi dengan status pending. Harap tunggu konfirmasi admin sebelum melakukan absensi berikutnya.',
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      return;
    }
    
    navigation.navigate('Camera');
  };

  const handleNotificationPress = () => {
    navigation.navigate('NotificationScreen');
    setTimeout(() => {
      loadUnreadNotifications();
    }, 1000);
  };

  const menuItems = [
    {
      title: 'Riwayat\nKehadiran',
      icon: KehadiranIcon,
      color: '#FF6B6B',
      onPress: () => navigation.navigate('RiwayatKehadiranScreen')
    },
    {
      title: 'Pengajuan\nLembur',
      icon: PengajuanLembur,
      color: '#4ECDC4',
      onPress: () => navigation.navigate('PengajuanLembur')
    },
    {
      title: 'Payslip',
      icon: Payslip,
      color: '#45B7D1',
      onPress: () => navigation.navigate('PayslipScreen')
    },
    {
      title: 'Pengajuan\nCuti/Izin',
      icon: PengajuanCuti,
      color: '#96CEB4',
      onPress: () => navigation.navigate('PengajuanIzin')
    }
  ];

  const currentStatus = getCurrentAttendanceStatus();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#5EC898" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  // Calculate worksheet progress
  const completedTasks = worksheets.filter(w => w.is_completed).length;
  const totalTasks = worksheets.length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Wrap everything in ScrollView */}
      <ScrollView 
        style={styles.mainScrollView} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header Section */}
        <ImageBackground source={BgHeader} style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: userData?.user.profile_image || 'https://via.placeholder.com/50' }} 
                style={styles.avatar} 
              />
              <View style={styles.userDetails}>
                <Text style={styles.position}>{userData?.user.position || ''}</Text>
                <Text style={styles.userName}>{userData?.user.full_name || ''}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton} 
              onPress={handleNotificationPress}
            >
              <FontAwesome5 name="bell" size={20} color="black" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Attendance Card */}
          <View style={styles.attendanceCard}>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            <Text style={styles.absenTitle}>
              {getTodayScheduleText()}
            </Text>
            
            {/* Upcoming Schedules */}
            <View style={styles.upcomingSchedulesContainer}>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>
                  Besok ({getDayName(getTomorrowDate())}):
                </Text>
                <Text style={styles.scheduleTime}>
                  {upcomingSchedules.tomorrow 
                    ? `${getShiftStartTime(upcomingSchedules.tomorrow)} WIB`
                    : 'Belum ada jadwal/Libur'
                  }
                </Text>
              </View>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>
                  Lusa ({getDayAfterTomorrowDate()}):
                </Text>
                <Text style={styles.scheduleTime}>
                  {upcomingSchedules.dayAfter 
                    ? `${getShiftStartTime(upcomingSchedules.dayAfter)} WIB`
                    : 'Belum ada jadwal/Libur'
                  }
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.fullScheduleButton}
                onPress={() => navigation.navigate('InformationStructureScreen')}
              >
                <FontAwesome5 name="calendar-alt" size={14} color="#5EC898" style={styles.calendarIcon} />
                <Text style={styles.fullScheduleText}>Cek Jadwal Lengkap</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#5EC898" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.restTimeContainer}>
              <Text style={styles.restLabel}>{currentStatus.title}</Text>
              <Text style={[styles.restTime, { color: currentStatus.color }]}>
                {currentStatus.text}
              </Text>
              
              {/* Error Warning untuk Attendance */}
              {attendanceError && (
                <View style={styles.errorWarning}>
                  <FontAwesome5 name="exclamation-circle" size={14} color="#FF6B6B" />
                  <Text style={styles.errorText}>Gagal memuat data absensi</Text>
                </View>
              )}
              
              {hasPendingAttendance() && !attendanceError && (
                <View style={styles.pendingWarning}>
                  <FontAwesome5 name="exclamation-triangle" size={14} color="#FF9800" />
                  <Text style={styles.pendingText}>Status absensi pending</Text>
                </View>
              )}
              
              {/* Tombol Refresh ketika ada error */}
              {attendanceError && (
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefreshAttendance}
                >
                  <FontAwesome5 name="sync-alt" size={14} color="white" style={styles.refreshIcon} />
                  <Text style={styles.refreshButtonText}>Refresh Data</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'white' }]}>
                  <Image source={item.icon} style={{width: 20, height: 20}} />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* =================== WORKSHEET SECTION =================== */}
          <View style={styles.worksheetSection}>
            <View style={styles.worksheetHeader}>
              <View style={styles.worksheetTitleContainer}>
                <FontAwesome5 name="clipboard-list" size={18} color="#333" style={styles.worksheetIcon} />
                <Text style={styles.worksheetTitle}>Task Hari Ini</Text>
              </View>
              {totalTasks > 0 && (
                <View style={styles.progressBadge}>
                  <Text style={styles.progressText}>
                    {completedTasks}/{totalTasks}
                  </Text>
                </View>
              )}
            </View>

            {worksheetLoading ? (
              <View style={styles.worksheetLoading}>
                <ActivityIndicator size="small" color="#5EC898" />
                <Text style={styles.loadingSmallText}>Memuat task...</Text>
              </View>
            ) : worksheets.length === 0 ? (
              <View style={styles.emptyWorksheet}>
                <FontAwesome5 name="clipboard-check" size={40} color="#DDD" />
                <Text style={styles.emptyWorksheetText}>Tidak ada task untuk hari ini</Text>
              </View>
            ) : (
              <>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${completionPercentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {Math.round(completionPercentage)}% Selesai
                  </Text>
                </View>

                {/* Task List */}
                {worksheets.map((worksheet, index) => (
                  <TouchableOpacity
                    key={worksheet.id}
                    style={[
                      styles.worksheetItem,
                      worksheet.is_completed && styles.worksheetItemCompleted
                    ]}
                    onPress={() => {
                      if (worksheet.is_completed) {
                        handleUncheckTask(worksheet);
                      } else {
                        handleOpenChecklistModal(worksheet);
                      }
                    }}
                  >
                    <View style={styles.worksheetItemLeft}>
                      <View style={[
                        styles.checkboxContainer,
                        worksheet.is_completed && styles.checkboxChecked
                      ]}>
                        {worksheet.is_completed && (
                          <FontAwesome5 name="check" size={14} color="white" />
                        )}
                      </View>
                      <View style={styles.worksheetItemContent}>
                        <Text style={[
                          styles.worksheetItemTitle,
                          worksheet.is_completed && styles.worksheetItemTitleCompleted
                        ]}>
                          {worksheet.task_templates?.title || 'Task'}
                        </Text>
                        {worksheet.task_templates?.category && (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                              {worksheet.task_templates.category}
                            </Text>
                          </View>
                        )}
                        {worksheet.is_completed && worksheet.completed_at && (
                          <Text style={styles.completedTime}>
                            Selesai: {formatTimeFromISO(worksheet.completed_at)} WIB
                          </Text>
                        )}
                      </View>
                    </View>
                    <FontAwesome5 
                      name="chevron-right" 
                      size={14} 
                      color={worksheet.is_completed ? '#999' : '#5EC898'} 
                    />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
          {/* =================== END WORKSHEET SECTION =================== */}

          {/* Riwayat Absensi Section */}
          <View style={styles.riwayatSection}>
            <View style={styles.riwayatHeader}>
              <Text style={styles.riwayatTitle}>Riwayat Absensi</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RiwayatKehadiran')}>
                <Text style={styles.lihatSemua}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {attendanceHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Belum ada riwayat absensi</Text>
              </View>
            ) : (
              attendanceHistory.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.absensiItem}>
                  <View style={styles.absensiLeft}>
                    <View style={[
                      styles.avatarContainer, 
                      item.status === 'in' ? styles.avatarIn : styles.avatarOut
                    ]}>
                      <Text style={styles.avatarText}>{item.avatar}</Text>
                      <View style={[
                        styles.statusIndicator, 
                        item.status === 'in' ? styles.statusIn : styles.statusOut
                      ]}>
                        <FontAwesome5 
                          name={item.status === 'in' ? 'arrow-right' : 'arrow-left'} 
                          size={8} 
                          color="white" 
                        />
                      </View>
                    </View>
                    <View style={styles.absensiInfo}>
                      <Text style={styles.absensiName}>{item.name}</Text>
                      <Text style={styles.absensiPosition}>{item.position}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.timeContainer, 
                    item.status === 'in' ? styles.timeIn : styles.timeOut
                  ]}>
                    <Text style={[
                      styles.timeText,
                      { color: item.status === 'in' ? '#4CAF50' : '#FF6B6B' }
                    ]}>
                      {item.time} WIB
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* =================== CHECKLIST MODAL =================== */}
      <Modal
        visible={checklistModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseChecklistModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selesaikan Task</Text>
              <TouchableOpacity onPress={handleCloseChecklistModal}>
                <FontAwesome5 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedWorksheet && (
                <>
                  <View style={styles.taskDetailCard}>
                    <Text style={styles.taskDetailTitle}>
                      {selectedWorksheet.task_templates?.title}
                    </Text>
                    {selectedWorksheet.task_templates?.description && (
                      <Text style={styles.taskDetailDescription}>
                        {selectedWorksheet.task_templates.description}
                      </Text>
                    )}
                    {selectedWorksheet.task_templates?.category && (
                      <View style={styles.taskDetailCategory}>
                        <Text style={styles.taskDetailCategoryText}>
                          {selectedWorksheet.task_templates.category}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Upload Foto Section */}
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadLabel}>Foto Bukti (Opsional)</Text>
                    {uploadedImage ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image 
                          source={{ uri: uploadedImage.uri }} 
                          style={styles.imagePreview} 
                        />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setUploadedImage(null)}
                        >
                          <FontAwesome5 name="times-circle" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.uploadButton}
                        onPress={handlePickImage}
                      >
                        <FontAwesome5 name="camera" size={24} color="#5EC898" />
                        <Text style={styles.uploadButtonText}>Upload Foto</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Catatan Section */}
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Catatan (Opsional)</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Tambahkan catatan..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      value={notes}
                      onChangeText={setNotes}
                      textAlignVertical="top"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCloseChecklistModal}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  submittingChecklist && styles.submitButtonDisabled
                ]}
                onPress={handleSubmitChecklist}
                disabled={submittingChecklist}
              >
                {submittingChecklist ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <FontAwesome5 name="check" size={16} color="white" style={styles.submitButtonIcon} />
                    <Text style={styles.submitButtonText}>Selesai</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* =================== END CHECKLIST MODAL =================== */}
    </View>
  );
};

// Placeholder components for other tabs
const RiwayatScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Riwayat Screen</Text>
  </View>
);

const AbsenScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Absen Screen</Text>
  </View>
);

const AktivitasScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Aktivitas Screen</Text>
  </View>
);

const ProfilScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Profil Screen</Text>
  </View>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const HomeWithTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Beranda') {
            iconName = 'home';
          } else if (route.name === 'Riwayat') {
            iconName = 'history';
          } else if (route.name === 'Absen') {
            return (
              <View style={{
                width: 60,
                height: 60,
                backgroundColor: '#5EC898',
                borderRadius: 60 / 2,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#4CAF50',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
                marginTop: -40
              }}>
                <FontAwesome5 
                  name="qrcode" 
                  size={30} 
                  color="white" 
                />
              </View>
            );
          } else if (route.name === 'Aktivitas') {
            iconName = 'tasks';
          } else if (route.name === 'Profil') {
            iconName = 'user';
          }
          
          return <FontAwesome5 name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5EC898',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingBottom: 8,
          height: 75,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      })}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          if (route.name === 'Absen') {
            e.preventDefault();
            checkPendingStatusAndNavigate(navigation);
          }
          else if (route.name === 'Riwayat') {
            e.preventDefault();
            navigation.navigate('RiwayatKehadiranScreen');
          }
          else if (route.name === 'Aktivitas') {
            e.preventDefault();
            navigation.navigate('AktivitasScreen');
          } else if (route.name === 'Profil') {
            e.preventDefault();
            navigation.navigate('ProfilScreen');
          }
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Riwayat" component={RiwayatScreen} />
      <Tab.Screen name="Absen" component={AbsenScreen} />
      <Tab.Screen name="Aktivitas" component={AktivitasScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
};

const checkPendingStatusAndNavigate = async (navigation) => {
  try {
    const userData = await AsyncStorage.getItem('@dataSelf');
    if (!userData) return;
    
    const parsedUserData = JSON.parse(userData);
    if (!parsedUserData?.user?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `${API_URL}/api/attendance?user_id=${parsedUserData.user.id}&start_date=${today}&end_date=${today}`
    );
    
    if (!response.ok) {
      // Jika ada error saat fetch, tampilkan alert
      Alert.alert(
        'Error Memuat Data',
        'Tidak dapat memuat data absensi. Silakan refresh data terlebih dahulu dari halaman utama.',
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      return;
    }
    
    const result = await response.json();
    
    if (result.attendance && result.attendance.length > 0) {
      const todayAttendance = result.attendance.find(item => 
        item.date === today
      );
      
      if (todayAttendance) {
        const checkInStatus = todayAttendance.check_in?.status;
        const checkOutStatus = todayAttendance.check_out?.status;
        const breakInStatus = todayAttendance.break_in?.status;
        const breakOutStatus = todayAttendance.break_out?.status;
        
        const hasPending = checkInStatus === 'Pending' || 
                         checkOutStatus === 'Pending' || 
                         breakInStatus === 'Pending' || 
                         breakOutStatus === 'Pending';
        
        if (hasPending) {
          Alert.alert(
            'Absensi Pending',
            'Anda masih memiliki absensi dengan status pending. Harap tunggu konfirmasi admin sebelum melakukan absensi berikutnya.',
            [
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
          return;
        }
      }
    }
    
    navigation.navigate('Camera');
  } catch (error) {
    console.log('Error checking pending status:', error);
    Alert.alert(
      'Error',
      'Terjadi kesalahan saat memuat data. Silakan coba lagi.',
      [
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  }
};

export default HomeWithTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // MAIN SCROLLVIEW - Yang membungkus semua content
  mainScrollView: {
    flex: 1,
  },
  headerBackground: {
    height: 180,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    width: '100%'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  position: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgb(255, 255, 255)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -40,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // CONTENT CONTAINER - Yang menampung semua card dan section
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space untuk bottom tab
  },
  attendanceCard: {
    backgroundColor: 'white',
    marginTop: -65,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20, // Spacing ke section berikutnya
  },
  dateText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  absenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  upcomingSchedulesContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fullScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5EC898',
  },
  calendarIcon: {
    marginRight: 6,
  },
  fullScheduleText: {
    fontSize: 13,
    color: '#5EC898',
    fontWeight: '600',
    marginRight: 6,
  },
  restTimeContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  restLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  restTime: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#C62828',
    marginLeft: 6,
    fontWeight: '500',
  },
  pendingWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    marginTop: 10,
  },
  pendingText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 6,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5EC898',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    width: (screenWidth - 60) / 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#333',
    lineHeight: 14,
  },
  
  // =================== WORKSHEET STYLES ===================
  worksheetSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  worksheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  worksheetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  worksheetIcon: {
    marginRight: 8,
  },
  worksheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5EC898',
  },
  worksheetLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingSmallText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyWorksheet: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyWorksheetText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5EC898',
    borderRadius: 4,
  },
  progressPercentage: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  worksheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    marginBottom: 10,
  },
  worksheetItemCompleted: {
    backgroundColor: '#E8F5E8',
    opacity: 0.8,
  },
  worksheetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#5EC898',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#5EC898',
  },
  worksheetItemContent: {
    flex: 1,
  },
  worksheetItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  worksheetItemTitleCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#5EC898',
    fontWeight: '500',
  },
  completedTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },

  // =================== MODAL STYLES ===================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  taskDetailCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  taskDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskDetailDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  taskDetailCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  taskDetailCategoryText: {
    fontSize: 12,
    color: '#5EC898',
    fontWeight: '600',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#5EC898',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#5EC898',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A0D9C3',
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // =================== END MODAL STYLES ===================
  
  riwayatSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20, // Spacing untuk bottom tab
  },
  riwayatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  riwayatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lihatSemua: {
    fontSize: 12,
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  absensiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  absensiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarIn: {
    backgroundColor: '#E8F5E8',
  },
  avatarOut: {
    backgroundColor: '#FFE8E8',
  },
  avatarText: {
    fontSize: 18,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIn: {
    backgroundColor: '#4CAF50',
  },
  statusOut: {
    backgroundColor: '#FF6B6B',
  },
  absensiInfo: {
    flex: 1,
  },
  absensiName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  absensiPosition: {
    fontSize: 12,
    color: '#999',
  },
  timeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeIn: {
    backgroundColor: '#E8F5E8',
  },
  timeOut: {
    backgroundColor: '#FFE8E8',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
  },
});