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
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  // State baru untuk notifikasi
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
        
        // Hitung notifikasi yang belum dibaca
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

  // Fungsi untuk load semua data sekaligus
  const loadAllData = async () => {
    try {
      console.log('Loading all data...');
      await Promise.all([
        loadShiftSchedule(),
        loadUpcomingSchedules(),
        loadTodayAttendance(),
        loadAttendanceHistory(),
        loadUnreadNotifications() // Tambahkan load notifikasi
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
      
      console.log('====================================');
      console.log('Shift Schedule Response Status:', response.status);
      console.log('====================================');
      
      if (response.ok) {
        const result = await response.json();
        console.log('Shift Schedule Result:', result);
        
        if (result.shift_schedules && result.shift_schedules.length > 0) {
          // Filter data berdasarkan tanggal yang sama persis
          const todayShift = result.shift_schedules.find(item => 
            isSameDate(item.shift_date, today)
          );
          
          console.log('Today Shift Found:', todayShift);
          setShiftSchedule(todayShift || null);
        } else {
          console.log('No shift schedule found for today');
          setShiftSchedule(null);
        }
      } else {
        console.log('Failed to load shift schedule, status:', response.status);
        setShiftSchedule(null);
      }
    } catch (error) {
      console.log('Error loading shift schedule:', error);
      setShiftSchedule(null);
    }
  };

  // Fungsi baru untuk load jadwal besok dan lusa
  const loadUpcomingSchedules = async () => {
    if (!userData?.user?.id) return;
    
    try {
      const tomorrow = getTomorrowDate();
      const dayAfter = getDayAfterTomorrowDate();
      
      // Get schedules for the next 2 days
      const response = await fetch(
        `${API_URL}/api/shift-schedules?user_id=${userData.user.id}&start_date=${tomorrow}&end_date=${dayAfter}`
      );
      
      console.log('====================================');
      console.log('Upcoming Schedules Response Status:', response.status);
      console.log('====================================');
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upcoming Schedules Result:', result);
        
        if (result.shift_schedules && result.shift_schedules.length > 0) {
          const tomorrowShift = result.shift_schedules.find(item => 
            isSameDate(item.shift_date, tomorrow)
          );
          
          const dayAfterShift = result.shift_schedules.find(item => 
            isSameDate(item.shift_date, dayAfter)
          );
          
          console.log('Tomorrow Shift Found:', tomorrowShift);
          console.log('Day After Shift Found:', dayAfterShift);
          
          setUpcomingSchedules({
            tomorrow: tomorrowShift || null,
            dayAfter: dayAfterShift || null
          });
        } else {
          console.log('No upcoming schedules found');
          setUpcomingSchedules({ tomorrow: null, dayAfter: null });
        }
      } else {
        console.log('Failed to load upcoming schedules, status:', response.status);
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
      const today = getTodayDate();
      const response = await fetch(
        `${API_URL}/api/attendance?user_id=${userData.user.id}&start_date=${today}&end_date=${today}`
      );
      
      console.log('====================================');
      console.log('Attendance API URL:', 
        `${API_URL}/api/attendance?user_id=${userData.user.id}&start_date=${today}&end_date=${today}`
      );
      console.log('Attendance Response Status:', response.status);
      console.log('====================================');
      
      if (response.ok) {
        const result = await response.json();
        console.log('====================================');
        console.log('Attendance Result:', result);
        console.log('====================================');
        
        if (result.attendance && result.attendance.length > 0) {
          // Filter data berdasarkan tanggal yang sama persis
          const todayData = result.attendance.find(item => 
            isSameDate(item.date, today)
          );
          console.log('Today Attendance Found:', todayData);
          
          setTodayAttendance(todayData || null);
        } else {
          console.log('No attendance found for today');
          setTodayAttendance(null);
        }
      } else {
        console.log('Failed to load today attendance, status:', response.status);
        setTodayAttendance(null);
      }
    } catch (error) {
      console.log('Error loading today attendance:', error);
      setTodayAttendance(null);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!userData?.user?.id) return;
    
    try {
      // Get last 30 days to show more data
      const endDate = getTodayDate();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = formatDateToYMD(startDate);

      const response = await fetch(
        `${API_URL}/api/attendance?user_id=${userData.user.id}&start_date=${startDateStr}&end_date=${endDate}`
      );

      console.log('====================================');
      console.log('Attendance History Response Status:', response.status);
      console.log('====================================');
      
      if (response.ok) {
        const result = await response.json();
        console.log('Attendance History Result:', result);
        
        if (result.attendance) {
          const today = getTodayDate();
          
          // Process all attendance data - create entries for both check-in and check-out
          let formattedHistory = [];
          
          result.attendance.forEach(item => {
            const checkInTime = item.check_in?.time 
              ? formatTimeFromISO(item.check_in.time)
              : null;
            const checkOutTime = item.check_out?.time 
              ? formatTimeFromISO(item.check_out.time)
              : null;

            // Add check-in entry if exists
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

            // Add check-out entry if exists
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

          // Sort by datetime descending (most recent first)
          formattedHistory.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

          console.log('Formatted History:', formattedHistory.length, 'entries');
          setAttendanceHistory(formattedHistory);
        } else {
          console.log('No attendance history found');
          setAttendanceHistory([]);
        }
      } else {
        console.log('Failed to load attendance history, status:', response.status);
        setAttendanceHistory([]);
      }
    } catch (error) {
      console.log('Error loading attendance history:', error);
      setAttendanceHistory([]);
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

  // Format shift start time to HH:MM format
  const getShiftStartTime = (shift = null) => {
    const shiftToUse = shift || shiftSchedule;
    if (shiftToUse && shiftToUse.shifts && shiftToUse.shifts.start_time) {
      const startTime = shiftToUse.shifts.start_time;
      // If it's in HH:MM:SS format, extract only HH:MM
      if (startTime.includes(':')) {
        const parts = startTime.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
      return startTime;
    }
    return 'Tidak Ada Jadwal'; // Default jika tidak ada shift
  };

  // Fungsi baru untuk mendapatkan text jadwal hari ini
// Fungsi untuk mendapatkan waktu pulang dari shift
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

// Fungsi untuk mendapatkan waktu break in dari shift
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

  // Fungsi baru untuk mendapatkan text jadwal hari ini
  const getTodayScheduleText = () => {
    if (!shiftSchedule || !shiftSchedule.shifts || !shiftSchedule.shifts.start_time) {
      return "Tidak Ada Jadwal/Libur";
    }

    // Cek status absensi untuk menentukan jadwal mana yang ditampilkan
    if (!todayAttendance) {
      // Belum ada absensi sama sekali
      return `Jadwal Masuk: ${getShiftStartTime()} WIB`;
    }

    // Belum check in
    if (!todayAttendance.check_in?.time) {
      return `Jadwal Masuk: ${getShiftStartTime()} WIB`;
    }

    // Sudah check in, belum break out (istirahat)
    if (todayAttendance.check_in?.time && !todayAttendance.break_out?.time) {
      return `Jadwal Istirahat: ${getShiftBreakOutTime()} WIB`;
    }

    // Sudah istirahat, belum kembali dari istirahat
    if (todayAttendance.break_out?.time && !todayAttendance.break_in?.time) {
      return `Jadwal Kembali: ${getShiftBreakInTime()} WIB`;
    }

    // Sudah kembali dari istirahat, belum check out
    if (todayAttendance.break_in?.time && !todayAttendance.check_out?.time) {
      const endTime = getShiftEndTime();
      return endTime ? `Jadwal Pulang: ${endTime} WIB` : "Jadwal Pulang";
    }

    // Sudah selesai semua
    if (todayAttendance.check_out?.time) {
      return "Absensi Hari Ini Selesai";
    }

    return `Jadwal Masuk: ${getShiftStartTime()} WIB`;
  };

  // Fungsi untuk cek apakah ada status pending
  const hasPendingAttendance = () => {
    if (!todayAttendance) return false;
    
    // Cek semua status attendance hari ini
    const checkInStatus = todayAttendance.check_in?.status;
    const checkOutStatus = todayAttendance.check_out?.status;
    const breakInStatus = todayAttendance.break_in?.status;
    const breakOutStatus = todayAttendance.break_out?.status;
    
    // Jika ada yang pending, return true
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
    
    // Belum check in
    if (!todayAttendance.check_in?.time) {
      return {
        type: 'check_in',
        title: 'Status Absen Masuk',
        text: 'Belum Absen',
        color: '#FF6B6B',
        hasCheckedIn: false
      };
    }
    
    // Sudah check in, belum break out (istirahat)
    if (todayAttendance.check_in?.time && !todayAttendance.break_out?.time) {
      return {
        type: 'break_out',
        title: 'Absen Istirahat',
        text: 'Belum Absen Istirahat',
        color: '#FF9800',
        hasCheckedIn: true
      };
    }
    
    // Sudah istirahat, belum kembali dari istirahat
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
    
    // Sudah kembali dari istirahat, belum check out
    if (todayAttendance.break_in?.time && !todayAttendance.check_out?.time) {
      return {
        type: 'check_out',
        title: 'Absen Pulang',
        text: 'Belum Absen Pulang',
        color: '#9C27B0',
        hasCheckedIn: true
      };
    }
    
    // Sudah selesai semua
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

  // Fungsi untuk handle tap absen dengan validasi pending
  const handleAbsenPress = () => {
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
    
    // Jika tidak ada pending, lanjutkan ke camera
    navigation.navigate('Camera');
  };

  // Handler untuk navigasi ke NotificationScreen dengan refresh badge
  const handleNotificationPress = () => {
    navigation.navigate('NotificationScreen');
    // Refresh unread count setelah berpindah ke notification screen
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

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
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
            {/* Badge untuk notifikasi yang belum dibaca */}
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
          
          {/* Tombol Cek Jadwal Lengkap */}
          <TouchableOpacity 
            style={styles.fullScheduleButton}
            onPress={() => navigation.navigate('InformationStructureScreen')} // Ganti dengan nama screen jadwal lengkap
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
          {/* Tampilkan warning jika ada status pending */}
          {hasPendingAttendance() && (
            <View style={styles.pendingWarning}>
              <FontAwesome5 name="exclamation-triangle" size={14} color="#FF9800" />
              <Text style={styles.pendingText}>Status absensi pending</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
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
            // Cek status pending sebelum navigasi ke camera
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

// Fungsi helper untuk cek status pending di tab navigator
const checkPendingStatusAndNavigate = async (navigation) => {
  try {
    // Ambil data user dari AsyncStorage
    const userData = await AsyncStorage.getItem('@dataSelf');
    if (!userData) return;
    
    const parsedUserData = JSON.parse(userData);
    if (!parsedUserData?.user?.id) return;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch today's attendance
    const response = await fetch(
      `${API_URL}/api/attendance?user_id=${parsedUserData.user.id}&start_date=${today}&end_date=${today}`
    );
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.attendance && result.attendance.length > 0) {
        const todayAttendance = result.attendance.find(item => 
          item.date === today
        );
        
        if (todayAttendance) {
          // Cek apakah ada status pending
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
    }
    
    // Jika tidak ada pending atau error, lanjutkan ke camera
    navigation.navigate('Camera');
  } catch (error) {
    console.log('Error checking pending status:', error);
    // Jika ada error, tetap lanjutkan ke camera
    navigation.navigate('Camera');
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
  // Style untuk badge notifikasi
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
  attendanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -65,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  // Styles untuk upcoming schedules
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
  // Style untuk pending warning
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
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
  riwayatSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 100,
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