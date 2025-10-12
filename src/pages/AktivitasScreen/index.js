import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../context/APIUrl';
import BgHeader from '../../assets/bgheaderbump.png';

const AktivitasScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredActivities, setFilteredActivities] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData?.user?.id) {
      loadActivities();
    }
  }, [userData]);

  useEffect(() => {
    filterActivities();
  }, [searchQuery, activities]);

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

  const loadActivities = async () => {
    try {
      setLoading(true);
      const allActivities = [];
      
      // Load attendance data
      const attendanceResponse = await fetch(
        `${API_URL}/api/attendance?user_id=${userData.user.id}`
      );
      if (attendanceResponse.ok) {
        const attendanceResult = await attendanceResponse.json();
        console.log('Attendance Result:', JSON.stringify(attendanceResult, null, 2));
        
        if (attendanceResult.attendance && attendanceResult.attendance.length > 0) {
          const attendanceActivities = attendanceResult.attendance.map(item => {
            console.log('Processing item:', JSON.stringify(item, null, 2));
            return {
              id: `attendance_${item.id}`,
              type: 'attendance',
              title: item.check_in?.time ? 'Absen Masuk' : 'Tidak Hadir',
              time: item.check_in?.time ? formatTime(item.check_in.time) : '-',
              date: item.date,
              icon: 'user-check',
              iconColor: item.check_in?.time ? '#5EC898' : '#FF6B6B',
              details: {
                check_in: formatTime(item.check_in?.time),
                check_out: formatTime(item.check_out?.time),
                notes: item.notes
              }
            };
          });
          console.log('Mapped attendance activities:', JSON.stringify(attendanceActivities, null, 2));
          allActivities.push(...attendanceActivities);
        }
      }

      // Load leave requests
      const leaveResponse = await fetch(
        `${API_URL}/api/leave-requests?user_id=${userData.user.id}`
      );
      if (leaveResponse.ok) {
        const leaveResult = await leaveResponse.json();
        const leaveActivities = leaveResult.leave_requests.map(item => ({
          id: `leave_${item.id}`,
          type: 'leave',
          title: `Pengajuan ${item.category}`,
          time: formatTime(item.created_at),
          date: item.created_at.split('T')[0],
          icon: 'calendar-alt',
          iconColor: getStatusColor(item.status),
          details: {
            status: item.status,
            start_date: item.start_date,
            end_date: item.end_date,
            description: item.description,
            category: item.category
          }
        }));
        allActivities.push(...leaveActivities);
      }

      // Load overtime requests
      const overtimeResponse = await fetch(
        `${API_URL}/api/overtime-requests?user_id=${userData.user.id}`
      );
      if (overtimeResponse.ok) {
        const overtimeResult = await overtimeResponse.json();
        const overtimeActivities = overtimeResult.overtime_requests.map(item => ({
          id: `overtime_${item.id}`,
          type: 'overtime',
          title: 'Pengajuan Lembur',
          time: formatTime(item.created_at),
          date: item.created_at.split('T')[0],
          icon: 'clock',
          iconColor: getStatusColor(item.status),
          details: {
            status: item.status,
            overtime_date: item.overtime_date,
            start_time: item.start_time,
            end_time: item.end_time,
            reason: item.reason
          }
        }));
        allActivities.push(...overtimeActivities);
      }

      // Sort activities by date (newest first)
      allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      console.log('All activities after sorting:', JSON.stringify(allActivities, null, 2));
      setActivities(allActivities);
      
    } catch (error) {
      console.log('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const filterActivities = () => {
    console.log('Filtering activities. Current activities count:', activities.length);
    console.log('Search query:', searchQuery);
    
    if (!searchQuery.trim()) {
      setFilteredActivities(activities);
      console.log('No search query, showing all activities:', activities.length);
      return;
    }

    const filtered = activities.filter(activity =>
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.details.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.details.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log('Filtered activities count:', filtered.length);
    setFilteredActivities(filtered);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Hari Ini';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Minggu Lalu';
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'Approved':
        return '#4CAF50';
      case 'rejected':
      case 'Cancelled':
        return '#FF6B6B';
      case 'pending':
      case 'Pending':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    console.log('====================================');
    console.log('status', status);
    console.log('====================================');
   switch (status) {
  case 'Approved':
  case 'approved':
    return 'Disetujui';
  case 'Cancelled':
  case 'cancelled':
    return 'Ditolak';
  case 'Pending':
  case 'pending':
    return 'Menunggu';
  default:
    return 'Unknown';
}

  };

  const groupActivitiesByDate = (activities) => {
    console.log('Grouping activities by date. Activities count:', activities.length);
    const grouped = {};
    activities.forEach(activity => {
      const dateKey = activity.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    console.log('Grouped activities:', JSON.stringify(grouped, null, 2));
    console.log('Grouped keys:', Object.keys(grouped));
    return grouped;
  };

  const renderActivityItem = (activity) => {
    return (
      <TouchableOpacity key={activity.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: activity.iconColor + '20' }]}>
          <FontAwesome5 name={activity.icon} size={16} color={activity.iconColor} />
        </View>
        
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityTime}>{activity.time}</Text>
          
          {activity.type === 'attendance' && activity.details.check_in !== '-' && (
            <View style={styles.activityDetails}>
              <Text style={styles.detailText}>
                Masuk: {activity.details.check_in} • Pulang: {activity.details.check_out}
              </Text>
            </View>
          )}
          
          {activity.type === 'leave' && (
            <View style={styles.activityDetails}>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: activity.iconColor }]}>
                  {getStatusText(activity.details.status)}
                </Text>
              </View>
              <Text style={styles.detailText}>
                {activity.details.start_date} - {activity.details.end_date}
              </Text>
            </View>
          )}
          
          {activity.type === 'overtime' && (
            <View style={styles.activityDetails}>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: activity.iconColor }]}>
                  {getStatusText(activity.details.status)}
                </Text>
              </View>
              <Text style={styles.detailText}>
                {activity.details.overtime_date} • {activity.details.start_time}-{activity.details.end_time}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
        <ActivityIndicator size="large" color="#5EC898" />
        <Text style={styles.loadingText}>Memuat aktivitas...</Text>
      </View>
    );
  }

  const groupedActivities = groupActivitiesByDate(filteredActivities);
  console.log('Final grouped activities for render:', Object.keys(groupedActivities).length);
  console.log('Filtered activities count for render:', filteredActivities.length);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Header with Background */}
      <ImageBackground source={BgHeader} style={styles.header} resizeMode="cover">
        <Text style={styles.headerTitle}>Aktivitas</Text>
         <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome5 name="filter" size={16} color="#999" />
        </TouchableOpacity>
      </View>
      </ImageBackground>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5EC898']}
            tintColor="#5EC898"
          />
        }
      >
        {Object.keys(groupedActivities).length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="tasks" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>Tidak ada aktivitas ditemukan</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Aktivitas akan muncul di sini'}
            </Text>
          </View>
        ) : (
          Object.keys(groupedActivities).map(date => {
            console.log('Rendering date group:', date, 'with', groupedActivities[date].length, 'activities');
            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.activitiesList}>
                <Text style={styles.dateHeader}>{formatDate(date)}</Text>

                  {groupedActivities[date].map((activity, index) => {
                    console.log('Rendering activity:', activity.id, activity.title);
                    return renderActivityItem(activity);
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

// Placeholder components for other tabs
const BerandaScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Beranda Screen</Text>
  </View>
);

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

const ProfilScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Profil Screen</Text>
  </View>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const AktivitasWithTabs = ({ navigation }) => {
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
                shadowColor: '#5EC898',
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
          } else if (route.name === 'Riwayat') {
            e.preventDefault();
            navigation.navigate('RiwayatKehadiranScreen');
          } else if (route.name === 'Profil') {
            e.preventDefault();
            navigation.navigate('ProfilScreen');
          }
        },
      })}
      initialRouteName="Aktivitas"
    >
      <Tab.Screen name="Beranda" component={BerandaScreen} />
      <Tab.Screen name="Riwayat" component={RiwayatScreen} />
      <Tab.Screen name="Absen" component={AbsenScreen} />
      <Tab.Screen name="Aktivitas" component={AktivitasScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
};

export default AktivitasWithTabs;

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
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: -10
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 48
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -50
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 25,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
    marginLeft: 5,
    padding: 10
  },
  activitiesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
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