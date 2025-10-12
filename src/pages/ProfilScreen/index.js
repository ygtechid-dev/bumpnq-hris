import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../context/APIUrl';
import BgHeader from '../../assets/bgheaderbump.png';

const ProfilScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@dataSelf');
      if (data) {
        const parsedData = JSON.parse(data);
        
        setUserData(parsedData);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@dataSelf');
              await AsyncStorage.removeItem('@token');

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.log('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      section: 'Umum',
      items: [
        {
          icon: 'user',
          title: 'Pengaturan Akun',
          onPress: () => navigation.navigate('EditProfileScreen')
        }
      ]
    },
    {
      section: 'Perusahaan',
      items: [
        
        {
          icon: 'sitemap',
          title: 'Kalender Karyawan & informasi',
          onPress: () => navigation.navigate('InformationStructureScreen')
            // onPress: () => alert('Sedang dalam pengembangan')

        }
      ]
    },
    {
      section: 'Tentang',
      items: [
        {
          icon: 'question-circle',
          title: 'Pusat Bantuan',
          onPress: () => Linking.openURL('https://wa.me/6285336666193')
      

        },
        {
          icon: 'file-alt',
          title: 'Privacy Policy',
          // onPress: () => navigation.navigate('PrivacyPolicy')
            onPress: () => Linking.openURL('https://www.termsfeed.com/live/723fee81-1714-4474-8ec2-8452199e51b5')

        },
        {
          icon: 'sign-out-alt',
          title: 'Logout',
          onPress: handleLogout,
          isLogout: true
        }
      ]
    }
  ];

  const renderMenuItem = (item, itemIndex, isLastItem) => (
    <TouchableOpacity
      key={itemIndex}
      style={[
        styles.menuItem,
        !isLastItem && styles.menuItemBorder
      ]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuIcon,
          item.isLogout ? styles.menuIconLogout : styles.menuIconDefault
        ]}>
          <FontAwesome5
            name={item.icon}
            size={16}
            color={item.isLogout ? '#FF6B6B' : '#666'}
          />
        </View>
        <Text style={[
          styles.menuItemText,
          item.isLogout && styles.menuItemTextLogout
        ]}>
          {item.title}
        </Text>
      </View>
      <FontAwesome5 name="chevron-right" size={16} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Header with Background */}
      <ImageBackground source={BgHeader} style={styles.header} >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {userData?.user?.profile_image ? (
              <Image
                source={{ uri: userData.user.profile_image }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <FontAwesome5 name="user" size={32} color="#999" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton}>
              <FontAwesome5 name="camera" size={12} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>
            {userData?.user?.full_name || 'Mike Cooper'}
          </Text>
          <Text style={styles.profilePosition}>
            {userData?.user?.position || 'Marketing Officer'} • {userData?.user?.employee_id || 'DE3824-MO4'}
          </Text>
          <Text style={styles.profileHireDate}>
            Bekerja sejak {userData?.user?.hire_date ? new Date(userData.user.hire_date).getFullYear() : '2023'}
          </Text>
        </View>
      </ImageBackground>

      {/* Menu Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) =>
                renderMenuItem(item, itemIndex, itemIndex === section.items.length - 1)
              )}
            </View>
          </View>
        ))}
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

const AktivitasScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Aktivitas Screen</Text>
  </View>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const ProfilWithTabs = ({ navigation }) => {
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
              <View style={styles.absenButton}>
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
          }  else if (route.name === 'Aktivitas') {
            e.preventDefault();
            navigation.navigate('AktivitasScreen');
          }
        },
      })}
      initialRouteName="Profil"
    >
      <Tab.Screen name="Beranda" component={BerandaScreen} />
      <Tab.Screen name="Riwayat" component={RiwayatScreen} />
      <Tab.Screen name="Absen" component={AbsenScreen} />
      <Tab.Screen name="Aktivitas" component={AktivitasScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
};

export default ProfilWithTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    

  },
  profileSection: {
    alignItems: 'center',
    marginTop: -10,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  profileHireDate: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 40,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
    marginLeft: 5,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconDefault: {
    backgroundColor: '#F5F5F5',
  },
  menuIconLogout: {
    backgroundColor: '#FFF5F5',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuItemTextLogout: {
    color: '#FF6B6B',
  },
  absenButton: {
    width: 60,
    height: 60,
    backgroundColor: '#5EC898',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5EC898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginTop: -40,
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