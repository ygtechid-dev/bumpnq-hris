import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../context/APIUrl';

const { width: screenWidth } = Dimensions.get('window');

const RiwayatKehadiranScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [shiftScheduleData, setShiftScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState({
    jumlahHadir: 0,
    tidakHadir: 0,
    terlambat: 0,
    persentaseKehadiran: 0
  });
  
  // State untuk Month Picker Modal
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    loadUserData();
    generateAvailableMonths();
  }, []);

  useEffect(() => {
    if (userData?.user?.id) {
      loadAttendanceData();
    }
  }, [userData, selectedMonth]);

  // Generate list of available months (last 12 months from current month)
  const generateAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        date: date,
        label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        value: date.toISOString()
      });
    }
    
    setAvailableMonths(months);
  };

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

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Get start and end of selected month
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('====================================');
      console.log('Loading data for period:', startDateStr, 'to', endDateStr);
      console.log('====================================');

      // Fetch attendance data
      const attendanceResponse = await fetch(
        `${API_URL}/api/attendance?user_id=${userData.user.id}&start_date=${startDateStr}&end_date=${endDateStr}`
      );

      // Fetch shift schedules for the same period
      const shiftResponse = await fetch(
        `${API_URL}/api/shift-schedules?user_id=${userData.user.id}&start_date=${startDateStr}&end_date=${endDateStr}`
      );
      
      if (attendanceResponse.ok && shiftResponse.ok) {
        const attendanceResult = await attendanceResponse.json();
        const shiftResult = await shiftResponse.json();
        
        console.log('====================================');
        console.log('Attendance Data:', attendanceResult.attendance);
        console.log('Shift Schedule Data:', shiftResult.shift_schedules);
        console.log('====================================');
        
        setAttendanceData(attendanceResult.attendance || []);
        setShiftScheduleData(shiftResult.shift_schedules || []);
        calculateStats(attendanceResult.attendance || [], shiftResult.shift_schedules || [], startDate, endDate);
      } else {
        console.log('Failed to load attendance or shift data');
        setAttendanceData([]);
        setShiftScheduleData([]);
        calculateStats([], [], startDate, endDate);
      }
    } catch (error) {
      console.log('Error loading attendance data:', error);
      setAttendanceData([]);
      setShiftScheduleData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendance, shiftSchedules, startDate, endDate) => {
    const totalWorkDays = getWorkDaysInMonth(startDate, endDate);
    
    // Count attended days - check if check_in.time exists
    const attendedDays = attendance.filter(item => item.check_in?.time).length;
    const absentDays = totalWorkDays - attendedDays;
    
    // Calculate late arrivals based on shift start_time
    const lateArrivals = attendance.filter(item => {
      return isLateBasedOnShift(item, shiftSchedules);
    }).length;

    const attendancePercentage = totalWorkDays > 0 ? ((attendedDays / totalWorkDays) * 100).toFixed(1) : 0;

    setMonthlyStats({
      jumlahHadir: attendedDays,
      tidakHadir: absentDays,
      terlambat: lateArrivals,
      persentaseKehadiran: parseFloat(attendancePercentage)
    });
  };

  // Helper function to get shift schedule for a specific date
  const getShiftForDate = (date, shiftSchedules) => {
    if (!shiftSchedules || shiftSchedules.length === 0) return null;
    
    const shift = shiftSchedules.find(schedule => {
      const scheduleDate = new Date(schedule.shift_date).toISOString().split('T')[0];
      const targetDate = new Date(date).toISOString().split('T')[0];
      return scheduleDate === targetDate;
    });
    
    return shift;
  };

  // Helper function to get shift start time from shift schedule
  const getShiftStartTimeFromSchedule = (shiftSchedule) => {
    if (shiftSchedule && shiftSchedule.shifts && shiftSchedule.shifts.start_time) {
      const startTime = shiftSchedule.shifts.start_time;
      if (startTime.includes(':')) {
        const parts = startTime.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`;
        }
        return startTime;
      }
      return startTime;
    }
    return null;
  };

  // Helper function to check if late based on shift
  const isLateBasedOnShift = (item, shiftSchedules) => {
    if (!item.check_in?.time) return false;
    
    const shiftSchedule = getShiftForDate(item.date, shiftSchedules);
    if (!shiftSchedule) return false;
    
    const shiftStartTime = getShiftStartTimeFromSchedule(shiftSchedule);
    if (!shiftStartTime) return false;

    const checkInDate = new Date(item.check_in.time);
    
    const checkInTimeString = checkInDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
      hour12: false 
    });

    const [checkInHour, checkInMinute, checkInSecond] = checkInTimeString.split(':').map(Number);
    const [shiftHour, shiftMinute, shiftSecond] = shiftStartTime.split(':').map(Number);

    const checkInTotalSeconds = checkInHour * 3600 + checkInMinute * 60 + checkInSecond;
    const shiftStartTotalSeconds = shiftHour * 3600 + shiftMinute * 60 + (shiftSecond || 0);

    return checkInTotalSeconds > shiftStartTotalSeconds;
  };

  const getWorkDaysInMonth = (startDate, endDate) => {
    let workDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workDays;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });
  };

  const changeMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const handleMonthSelect = (monthData) => {
    setSelectedMonth(new Date(monthData.date));
    setShowMonthPicker(false);
  };

  const getStatusColor = (item) => {
    if (!item.check_in?.time) return '#FF6B6B'; // Absent - Red
    if (isLateBasedOnShift(item, shiftScheduleData)) return '#FF9800'; // Late - Orange
    return '#4CAF50'; // On time - Green
  };

  const getStatusText = (item) => {
    if (!item.check_in?.time) return 'Tidak Hadir';
    if (isLateBasedOnShift(item, shiftScheduleData)) return 'Terlambat';
    return 'Hadir';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#5EC898" />
        <Text style={styles.loadingText}>Memuat data kehadiran...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.replace('HomeWithTabs')}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Kehadiran</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Monthly Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.monthSelector}>
            <Text style={styles.summaryTitle}>Perhitungan Bulanan</Text>
            <TouchableOpacity 
              style={styles.monthButton}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={styles.monthButtonText}>{getMonthName(selectedMonth)}</Text>
              <FontAwesome5 name="chevron-down" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{monthlyStats.jumlahHadir}</Text>
              <Text style={styles.statLabel}>Jumlah Hadir</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{monthlyStats.tidakHadir}</Text>
              <Text style={styles.statLabel}>Tidak Hadir</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{monthlyStats.terlambat}</Text>
              <Text style={styles.statLabel}>Terlambat</Text>
            </View>
          </View>
        </View>

        {/* Attendance Percentage */}
        <View style={styles.attendanceCard}>
          <Text style={styles.attendanceTitle}>Kehadiran</Text>
          
          <View style={styles.attendanceRow}>
            <Text style={styles.attendancePercentage}>{monthlyStats.persentaseKehadiran}%</Text>
            <View style={styles.attendanceInfo}>
              <View style={styles.attendanceChange}>
                <FontAwesome5 
                  name={monthlyStats.persentaseKehadiran >= 90 ? "arrow-up" : "arrow-down"} 
                  size={12} 
                  color={monthlyStats.persentaseKehadiran >= 90 ? "#4CAF50" : "#FF6B6B"} 
                />
                <Text style={[
                  styles.changeText,
                  { color: monthlyStats.persentaseKehadiran >= 90 ? "#4CAF50" : "#FF6B6B" }
                ]}>
                  {monthlyStats.persentaseKehadiran}%
                </Text>
              </View>
              <Text style={styles.previousMonth}>
                Bulan: {getMonthName(selectedMonth)}
              </Text>
            </View>
          </View>

          {/* Period Tabs */}
          <View style={styles.periodTabs}>
            <TouchableOpacity 
              style={styles.periodTab}
              onPress={() => {
                const newDate = new Date();
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedMonth(newDate);
              }}
            >
              <Text style={styles.periodTabText}>1M</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodTab, styles.activePeriodTab]}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={[styles.periodTabText, styles.activePeriodTabText]}>
                {selectedMonth.toLocaleDateString('id-ID', { month: 'short' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.periodTab}
              onPress={() => {
                const newDate = new Date();
                newDate.setMonth(newDate.getMonth() - 3);
                setSelectedMonth(newDate);
              }}
            >
              <Text style={styles.periodTabText}>3M</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attendance Records */}
        <View style={styles.recordsCard}>
          {/* Records List */}
          {attendanceData.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="calendar-times" size={50} color="#DDD" />
              <Text style={styles.emptyText}>Tidak ada data kehadiran untuk bulan ini</Text>
              <Text style={styles.emptySubText}>{getMonthName(selectedMonth)}</Text>
            </View>
          ) : (
            attendanceData.map((item, index) => (
              <View key={index} style={styles.recordItem}>
                <View style={styles.recordDate}>
                  <Text style={styles.recordDateText}>
                    {new Date(item.date).toLocaleDateString('id-ID', { 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Text>
                  <Text style={styles.recordDayText}>
                    {new Date(item.date).toLocaleDateString('id-ID', { 
                      weekday: 'short'
                    })}
                  </Text>
                </View>

                <View style={styles.recordDetails}>
                  <View style={styles.recordTimes}>
                    <View style={styles.timeEntry}>
                      <Text style={styles.timeLabel}>Masuk:</Text>
                      <Text style={styles.timeValue}>
                        {formatTime(item.check_in?.time)}
                      </Text>
                    </View>
                    <View style={styles.timeEntry}>
                      <Text style={styles.timeLabel}>Pulang:</Text>
                      <Text style={styles.timeValue}>
                        {formatTime(item.check_out?.time)}
                      </Text>
                    </View>
                    {getShiftForDate(item.date, shiftScheduleData) && (
                      <View style={styles.timeEntry}>
                        <Text style={styles.timeLabel}>Shift:</Text>
                        <Text style={[styles.timeValue, { color: '#5EC898' }]}>
                          {getShiftForDate(item.date, shiftScheduleData)?.shifts?.name || '-'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(item) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(item) }
                    ]}>
                      {getStatusText(item)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* =============== MONTH PICKER MODAL =============== */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Bulan</Text>
              <TouchableOpacity 
                onPress={() => setShowMonthPicker(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome5 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Month List */}
            <FlatList
              data={availableMonths}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = 
                  item.date.getMonth() === selectedMonth.getMonth() &&
                  item.date.getFullYear() === selectedMonth.getFullYear();
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.monthPickerItem,
                      isSelected && styles.monthPickerItemSelected
                    ]}
                    onPress={() => handleMonthSelect(item)}
                  >
                    <View style={styles.monthPickerItemContent}>
                      <FontAwesome5 
                        name="calendar-alt" 
                        size={16} 
                        color={isSelected ? '#5EC898' : '#999'} 
                      />
                      <Text style={[
                        styles.monthPickerItemText,
                        isSelected && styles.monthPickerItemTextSelected
                      ]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <FontAwesome5 name="check-circle" size={20} color="#5EC898" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Quick Select Buttons */}
            <View style={styles.quickSelectContainer}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const currentDate = new Date();
                  setSelectedMonth(currentDate);
                  setShowMonthPicker(false);
                }}
              >
                <FontAwesome5 name="calendar-day" size={14} color="#5EC898" />
                <Text style={styles.quickSelectText}>Bulan Ini</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setSelectedMonth(lastMonth);
                  setShowMonthPicker(false);
                }}
              >
                <FontAwesome5 name="calendar-minus" size={14} color="#5EC898" />
                <Text style={styles.quickSelectText}>Bulan Lalu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* =============== END MONTH PICKER MODAL =============== */}
    </View>
  );
};

// Placeholder components for other tabs
const BerandaScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Beranda Screen</Text>
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

const RiwayatWithTabs = ({ navigation }) => {
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
            navigation.navigate('Camera');
          } else if (route.name === 'Beranda') {
            e.preventDefault();
            navigation.navigate('HomeWithTabs');
          } else if (route.name === 'Aktivitas') {
            e.preventDefault();
            navigation.navigate('AktivitasScreen');
          } else if (route.name === 'Profil') {
            e.preventDefault();
            navigation.navigate('ProfilScreen');
          }
        },
      })}
      initialRouteName="Riwayat"
    >
      <Tab.Screen name="Beranda" component={BerandaScreen} />
      <Tab.Screen name="Riwayat" component={RiwayatKehadiranScreen} />
      <Tab.Screen name="Absen" component={AbsenScreen} />
      <Tab.Screen name="Aktivitas" component={AktivitasScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
};

export default RiwayatWithTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5EC898',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  monthButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  attendanceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  attendancePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 20,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  previousMonth: {
    fontSize: 12,
    color: '#999',
  },
  periodTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  periodTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  activePeriodTab: {
    backgroundColor: '#5EC898',
    borderColor: '#5EC898',
  },
  periodTabText: {
    fontSize: 14,
    color: '#999',
  },
  activePeriodTabText: {
    color: '#fff',
  },
  recordsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 12,
    color: '#BBB',
    marginTop: 5,
  },
  recordItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordDate: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 50,
  },
  recordDateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  recordDayText: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  recordDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTimes: {
    flex: 1,
  },
  timeEntry: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    width: 50,
  },
  timeValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  
  // =============== MODAL STYLES ===============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  monthPickerItemSelected: {
    backgroundColor: '#E8F5E8',
  },
  monthPickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthPickerItemText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  monthPickerItemTextSelected: {
    color: '#5EC898',
    fontWeight: '600',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  quickSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
  },
  quickSelectText: {
    fontSize: 13,
    color: '#5EC898',
    fontWeight: '600',
    marginLeft: 8,
  },
  // =============== END MODAL STYLES ===============
  
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