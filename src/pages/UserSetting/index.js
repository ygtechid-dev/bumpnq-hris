import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const UserSetting = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataKontak, setDataKontak] = useState("");

  // Auto refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getUserProfile();
      getContact();
    }, [])
  );

  // Initial load
  useEffect(() => {
    getUserProfile();
    getContact();
  }, []);

  const getUserProfile = async () => {
    try {
      const getData = await AsyncStorage.getItem('@dataSelf');
      if (getData) {
        const parsingData = JSON.parse(getData);
        setUserProfile(parsingData[0]);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      Alert.alert('Error', 'Gagal memuat profil user');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getContact = async () => {
    try {
      const get = await AsyncStorage.getItem('kontak');
      if (get) {
        const parsingKontak = JSON.parse(get);
        setDataKontak(parsingKontak);
      }
    } catch (error) {
      console.error('Error getting contact:', error);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getUserProfile();
    getContact();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('EditUserProfile', { 
      dataSelf: [userProfile] 
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@dataSelf');
              navigation.replace('Login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const formatMembershipStatus = (status) => {
    switch (status) {
      case 'TemanLoffee':
        return 'Loffee Family';
      case 'Bronze':
        return 'Bronze Member';
      case 'Silver':
        return 'Silver Member';
      case 'Gold':
        return 'Gold Member';
      default:
        return status || 'Bronze Member';
    }
  };

  const getMembershipColor = (status) => {
    switch (status) {
      case 'TemanLoffee':
        return '#8B4513';
      case 'Bronze':
        return '#CD7F32';
      case 'Silver':
        return '#C0C0C0';
      case 'Gold':
        return '#FFD700';
      default:
        return '#CD7F32';
    }
  };

  // Format gender display
  const formatGender = (gender) => {
    if (!gender) return 'Tidak diset';
    switch (gender.toLowerCase()) {
      case 'male':
      case 'laki-laki':
      case 'l':
        return 'Laki-laki';
      case 'female':
      case 'perempuan':
      case 'p':
        return 'Perempuan';
      default:
        return gender;
    }
  };

  // Format birth date display
  const formatBirthDate = (birthDate) => {
    if (!birthDate) return 'Tidak diset';
    
    try {
      // Try to parse the date and format it nicely
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        return birthDate; // Return original if can't parse
      }
      
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Jakarta'
      };
      return date.toLocaleDateString('id-ID', options);
    } catch (error) {
      return birthDate; // Return original on error
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7F6000" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-triangle" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>Gagal memuat profil user</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getUserProfile}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#495057" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <FontAwesome5 name="edit" size={18} color="#7F6000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7F6000']} // Android
            tintColor="#7F6000" // iOS
            title="Memuat ulang..." // iOS
            titleColor="#7F6000" // iOS
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userProfile.foto_profile ? (
              <Image 
                source={{ uri: userProfile.foto_profile }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="user" size={40} color="#7F6000" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{userProfile.namaLengkap}</Text>
          
          {/* Membership Badge */}
          <View style={[
            styles.membershipBadge, 
            { backgroundColor: getMembershipColor(userProfile.membership_status) }
          ]}>
            <FontAwesome5 name="crown" size={12} color="white" />
            <Text style={styles.membershipText}>
              {formatMembershipStatus(userProfile.membership_status)}
            </Text>
          </View>

          {/* Points */}
          <View style={styles.pointsContainer}>
            <FontAwesome5 name="coins" size={16} color="#FFD700" />
            <Text style={styles.pointsText}>
              {(userProfile.point_member || 0).toLocaleString()} Poin
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.profileInfo}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
          
          {/* Email */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="envelope" size={16} color="#7F6000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userProfile.email || 'Tidak diset'}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="phone" size={16} color="#7F6000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>No. Handphone</Text>
              <Text style={styles.infoValue}>{userProfile.handphone || 'Tidak diset'}</Text>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="venus-mars" size={16} color="#7F6000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jenis Kelamin</Text>
              <Text style={styles.infoValue}>{formatGender(userProfile.gender)}</Text>
            </View>
          </View>

          {/* Birth Date */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="birthday-cake" size={16} color="#7F6000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tanggal Lahir</Text>
              <Text style={styles.infoValue}>{formatBirthDate(userProfile.birth_date)}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#7F6000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>{userProfile.address || 'Tidak diset'}</Text>
            </View>
          </View>

          {/* Company Info (if exists) */}
          {userProfile.company_name && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <FontAwesome5 name="building" size={16} color="#7F6000" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Perusahaan</Text>
                <Text style={styles.infoValue}>{userProfile.company_name}</Text>
              </View>
            </View>
          )}

          {/* User ID */}
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <FontAwesome5 name="id-card" size={16} color="#7F6000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue}>{userProfile.uid || 'Tidak tersedia'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <FontAwesome5 name="edit" size={16} color="white" />
            <Text style={styles.editProfileButtonText}>Edit Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <FontAwesome5 name="sign-out-alt" size={16} color="#e74c3c" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Butuh Bantuan?</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => dataKontak && Linking.openURL('https://wa.me/' + dataKontak)}
          >
            <FontAwesome5 name="whatsapp" size={16} color="#25D366" />
            <Text style={styles.contactButtonText}>Hubungi Kami</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Loffee Mobile v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default UserSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#6c757d',
    marginTop: 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 32
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#6c757d',
    textAlign: 'center',
    marginVertical: 16
  },
  retryButton: {
    backgroundColor: '#7F6000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: 'white'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa'
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#212529'
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa'
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16
  },
  avatarContainer: {
    marginBottom: 16
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#7F6000'
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#7F6000'
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#212529',
    marginBottom: 8
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12
  },
  membershipText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginLeft: 6
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#856404',
    marginLeft: 8
  },
  profileInfo: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#212529',
    marginBottom: 16
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa'
  },
  infoIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 16
  },
  infoContent: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6c757d',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#212529'
  },
  actionSection: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F6000',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  editProfileButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginLeft: 8
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c'
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#e74c3c',
    marginLeft: 8
  },
  supportSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  supportTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#6c757d',
    marginBottom: 12
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  contactButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginLeft: 8
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#adb5bd'
  }
});