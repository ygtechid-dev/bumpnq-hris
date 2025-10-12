import { 
  ActivityIndicator, 
  Image, 
  Linking, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Dimensions,
  SafeAreaView,
  Modal
} from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { getDatabase, ref, set,get, update } from 'firebase/database';
import Logo from '../../assets/logoloffee.png'
import ICMembership from '../../assets/Slide1.png'
import ICBookmenu from '../../assets/icbookmenu.png'
import ICReservation from '../../assets/Slide2.png'
import ICVoucher from '../../assets/Slide7.png'
import ICKupon from '../../assets/Slide6.png'
import ICWaitinglist from '../../assets/Slide3.png'
import ICUsersetting from '../../assets/Slide4.png'
import ICcontactus from '../../assets/Slide5.png'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import Firebase v9 functions
import { database } from '../../config/Fire'; 
import { Modal as PaperModal } from 'react-native-paper'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import { OneSignal } from 'react-native-onesignal'

const { width } = Dimensions.get('window')

const Home = ({navigation}) => {
  const [dataFindSelf, setdataFindself] = useState({})
  const [dataSetting, setDataSetting] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const scrollViewRef = useRef(null)
  

   const intervalRef = useRef(null)

   
  // State untuk banner modal
  const [bannerData, setBannerData] = useState([])
  const [selectedBanner, setSelectedBanner] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  console.log('ddd', dataSetting);
  console.log('x', dataFindSelf);

  // Function untuk get data self dari AsyncStorage
  const getDats = async () => {
    try {
      const getData = await AsyncStorage.getItem('@dataSelf')
      if (getData) {
        const parsingData = JSON.parse(getData);
        console.log('DTSz from AsyncStorage:', parsingData);
        setdataFindself(parsingData)

        const database = getDatabase();

  // Dapatkan OneSignal ID
  OneSignal.User.getOnesignalId().then(async (userId) => {
    console.log('ONESIGID', userId);

    if (parsingData) {
      const userRef = ref(database, `userlogin/${parsingData[0].uid}`);
      try {
        await update(userRef, {
          onesignal_id: userId,
        });
        console.log('✅ OneSignal ID berhasil disimpan ke Firebase Realtime DB');
      } catch (error) {
        console.error('❌ Gagal simpan OneSignal ID:', error.message);
      }
    } else {
      console.warn('⚠️ UID tidak ditemukan, OneSignal ID tidak disimpanssss');
    }
  });
      }
    } catch (error) {
      console.error('Error getting dataSelf:', error);
    }
  }

  // Function untuk refresh data dari Firebase
  const refreshDataFromFirebase = async () => {
    try {
      // Ambil data user saat ini untuk mendapatkan identifier
      const currentData = await AsyncStorage.getItem('@dataSelf');
      if (currentData) {
        const userData = JSON.parse(currentData);
        const userPhone = userData[0]?.handphone; // atau field identifier lainnya
        
        if (userPhone) {
          console.log('Refreshing data from Firebase for phone:', userPhone);
          
          // Fetch data terbaru dari Firebase
          const dbRef = ref(database, 'userlogin/');
          const snapshot = await get(dbRef);
          
          if (snapshot.exists()) {
            const allUsers = snapshot.val();
            const usersArray = Object.values(allUsers);
            
            // Cari user berdasarkan nomor handphone
            const updatedUser = usersArray.find(user => user.handphone === userPhone);
            
            if (updatedUser) {
              // Update AsyncStorage dengan data terbaru
              const updatedDataArray = [updatedUser];
              await AsyncStorage.setItem('@dataSelf', JSON.stringify(updatedDataArray));
              
              // Update state
              setdataFindself(updatedDataArray);
              console.log('Data successfully refreshed from Firebase:', updatedUser);
            } else {
              console.log('User not found in Firebase');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data from Firebase:', error);
      // Fallback ke data lokal jika gagal
      getDats();
    }
  }

  // Setup auto-refresh
  const setupAutoRefresh = () => {
    // Clear existing interval jika ada
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Setup interval baru untuk refresh dari Firebase setiap 5 detik
    intervalRef.current = setInterval(() => {
      console.log('Auto-refreshing dataFindSelf from Firebase...');
      refreshDataFromFirebase();
    }, 5000); // 5 detik
  }


 
const getDataSetting = async () => {
  setLoading(true);
  
  try {
    // Firebase v9 syntax
    const dbRef = ref(database, 'setting/');
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const value = snapshot.val();
      console.log('valyuwa', value);
      
      if (value) {
        // Lebih simple pakai Object.values() langsung
        const datled = Object.values(value);
        
        // Simpan nomor WA ke AsyncStorage
        const jsonValue = JSON.stringify(datled[0]?.no_wa || '');
        await AsyncStorage.setItem('kontak', jsonValue);
        
        // Set state
        setDataSetting(datled);
        
        // Set banner data
        setBannerData(datled[0]?.banner || defaultBannerData);
      }
    } else {
      console.log('No setting data available');
      // Set default values jika tidak ada data
      setDataSetting([]);
      setBannerData(defaultBannerData);
    }
  } catch (error) {
    console.error('Error getting setting data:', error);
    // Handle error - set default values
    setDataSetting([]);
    setBannerData(defaultBannerData);
  } finally {
    setLoading(false);
  }
};



// Alternative version yang lebih clean
const getDataSettingClean = async () => {
  setLoading(true);
  
  try {
    const dbRef = ref(database, 'setting/');
    const snapshot = await get(dbRef);
    const value = snapshot.val();
    
    console.log('valyuwa', value);
    
    if (value) {
      const datled = Object.values(value);
      const settingData = datled[0] || {};
      
      // Simpan nomor WA
      if (settingData.no_wa) {
        const jsonValue = JSON.stringify(settingData.no_wa);
        await AsyncStorage.setItem('kontak', jsonValue);
      }
      
      // Set states
      setDataSetting(datled);
      setBannerData(settingData.banner || defaultBannerData);
    } else {
      // Default values jika tidak ada data
      setDataSetting([]);
      setBannerData(defaultBannerData);
    }
  } catch (error) {
    console.error('Error getting setting data:', error);
    setDataSetting([]);
    setBannerData(defaultBannerData);
  } finally {
    setLoading(false);
  }
};

  const cleanupAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  

 useEffect(() => {
  getDats();
  getDataSetting();

  

  // Setup auto-refresh
  const setupTimer = setTimeout(() => {
    setupAutoRefresh();
  }, 2000);

  // Cleanup saat komponen unmount
  return () => {
    clearTimeout(setupTimer);
    cleanupAutoRefresh();
  };
}, []);


  const handleRegister = async () => {
    alert('Silahkan melakukan Pendaftaran Akun untuk Mengakses Fitur Ini.')
    await AsyncStorage.clear();
    navigation.replace('Register')
  }

  const handleLogout = () => {
    AsyncStorage.clear()
    navigation.replace('Login')
  }

  // Default banner data
  const defaultBannerData = [
    { 
      id: 1, 
      uri: 'https://drive.google.com/uc?id=18yBmxz3p-eRvATWD3ORMsg36qMnJEEen', 
      title: 'Promo Spesial Hari Ini',
      description: 'Dapatkan diskon hingga 50% untuk semua menu favorit Anda. Promo berlaku terbatas sampai persediaan habis!',
      validUntil: '31 Desember 2024'
    },
    { 
      id: 2, 
      uri: 'https://drive.google.com/uc?id=18yBmxz3p-eRvATWD3ORMsg36qMnJEEen', 
      title: 'Menu Baru: Seasonal Drinks',
      description: 'Coba menu terbaru kami dengan cita rasa yang unik dan menyegarkan. Dibuat dari bahan pilihan berkualitas tinggi.',
      validUntil: '15 Januari 2025'
    },
    { 
      id: 3, 
      uri: 'https://drive.google.com/uc?id=18yBmxz3p-eRvATWD3ORMsg36qMnJEEen', 
      title: 'Event Loffee Anniversary',
      description: 'Bergabunglah dengan event spesial anniversary Loffee dan dapatkan pengalaman tak terlupakan bersama teman-teman.',
      validUntil: '28 Februari 2025'
    },
  ]

  const handleBannerPress = (banner) => {
    setSelectedBanner(banner)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedBanner(null)
  }

  // Menu data configuration
  const menuItems = [
    {
      id: 'membership',
      title: 'Membership',
      image: ICMembership,
      onPress: () => {
        if (dataFindSelf.length > 0 && dataFindSelf[0].membership_status === "GUEST") {
          handleRegister()
        } else {
          navigation.push('MembershipPage', { data: dataFindSelf })
        }
      }
    },
    {
      id: 'reservation',
      title: 'Reservasi',
      image: ICReservation,
      // onPress: () => {
        // if (dataFindSelf.length > 0 && dataFindSelf[0].membership_status === "GUEST") {
        //   handleRegister()
        // } else {
        //   navigation.push('ReservationPage')
        // }
      
      // }
       onPress: () => {
        if (dataSetting.length > 0) {
          Linking.openURL('https://wa.me/' + dataSetting[0].no_wa)
        }
      }
    },
    {
      id: 'waiting',
      title: 'Waiting List',
      image: ICWaitinglist,
      onPress: () => navigation.push('Camera')
    },
    {
      id: 'kupon',
      title: 'Kupon',
      image: ICKupon,
      onPress: () => {
        if (dataFindSelf.length > 0 && dataFindSelf[0].membership_status === "GUEST") {
          handleRegister()
        } else {
          navigation.push('KuponPage')
        }
      }
    },
    {
      id: 'voucher',
      title: 'Voucher',
      image: ICVoucher,
      onPress: () => {
        if (dataFindSelf.length > 0 && dataFindSelf[0].membership_status === "GUEST") {
          handleRegister()
        } else {
          navigation.push('VoucherPage', { data: dataFindSelf })
        }
      }
    },
    {
      id: 'setting',
      title: 'User Setting',
      image: ICUsersetting,
      onPress: () => navigation.push('UserSetting', { dataSelf: dataFindSelf })
    },
    {
      id: 'contact',
      title: 'Contact Us',
      image: ICcontactus,
      onPress: () => {
        if (dataSetting.length > 0) {
          Linking.openURL('https://wa.me/' + dataSetting[0].no_wa)
        }
      }
    }
  ]

  // Membagi menu items menjadi pages (6 items per page)
  const menuPages = []
  for (let i = 0; i < menuItems.length; i += 6) {
    menuPages.push(menuItems.slice(i, i + 6))
  }

  const renderMainMenuItem = (item, index) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.mainMenuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mainMenuImageContainer}>
        <Image source={item.image} style={styles.mainMenuImage} />
      </View>
      <Text style={styles.mainMenuTitle}>{item.title}</Text>
    </TouchableOpacity>
  )

  const renderMenuPage = (pageItems, pageIndex) => (
    <View key={pageIndex} style={styles.menuPage}>
      <View style={styles.mainMenuGrid}>
        <View style={styles.menuRow}>
          {pageItems.slice(0, 3).map((item, index) => renderMainMenuItem(item, index))}
        </View>
        <View style={styles.menuRow}>
          {pageItems.slice(3, 6).map((item, index) => renderMainMenuItem(item, index + 3))}
        </View>
      </View>
    </View>
  )

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const pageWidth = width - 32 // considering padding
    const currentPageIndex = Math.round(scrollPosition / pageWidth)
    setCurrentPage(currentPageIndex)
  }

  const scrollToPage = (pageIndex) => {
    const pageWidth = width - 32
    scrollViewRef.current?.scrollTo({
      x: pageIndex * pageWidth,
      animated: true
    })
    setCurrentPage(pageIndex)
  }

  const getMembershipStatus = () => {
    if (!dataFindSelf.length) return 'Guest'
    
    switch (dataFindSelf[0].membership_status) {
      case 'TemanLoffee': return 'Loffee Family'
      case 'Bronze': return 'Bronze Member'
      case 'Silver': return 'Silver Member'
      case 'Gold': return 'Gold Member'
      case 'Platinum': return 'Platinum Member'
      default: return 'Guest'
    }
  }

  const getMembershipColor = () => {
    if (!dataFindSelf.length) return '#6c757d'
    
    switch (dataFindSelf[0].membership_status) {
      case 'TemanLoffee': return '#8B4513'
      case 'Bronze': return '#CD7F32'
      case 'Silver': return '#C0C0C0'
      case 'Gold': return '#FFD700'
      default: return '#6c757d'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
       
          
          
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            {dataFindSelf.length > 0 && (
              <>
                <Text style={styles.welcomeText}>
                  Welcome Back,
                </Text>
                <Text style={styles.userName}>
                  {dataFindSelf[0].namaLengkap}
                </Text>
                
                {/* Membership Status */}
                <View style={[
                  styles.membershipBadge,
                  { backgroundColor: getMembershipColor() }
                ]}>
                  <FontAwesome5 name="crown" size={12} color="white" />
                  <Text style={styles.membershipText}>
                    {getMembershipStatus()}
                  </Text>
                </View>

                {/* Points Display */}
                {dataFindSelf[0].point_wallet !== undefined && (
                  <View style={styles.pointsContainer}>
                    <FontAwesome5 name="coins" size={14} color="#FFD700" />
                    <Text style={styles.pointsText}>
                      {(dataFindSelf[0].point_wallet || 0).toLocaleString()} Poin Wallet
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

             <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <FontAwesome5 name="sign-out-alt" size={14} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <Image source={Logo} style={styles.logo} />

          </View>
        </View>

        {/* Menu Grid Section with Swiper */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="th-large" size={16} color="#7F6000" /> Menu Utama
          </Text>
          
          {/* Swipeable Menu Pages */}
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.menuSwiper}
          >
            {menuPages.map((pageItems, pageIndex) => renderMenuPage(pageItems, pageIndex))}
          </ScrollView>

          {/* Page Indicators */}
          {menuPages.length > 1 && (
            <View style={styles.pageIndicatorContainer}>
              {menuPages.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pageIndicator,
                    currentPage === index && styles.activePageIndicator
                  ]}
                  onPress={() => scrollToPage(index)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Loffee Updates Section */}
        <View style={styles.updatesSection}>
          <View style={styles.updatesTitleContainer}>
            <FontAwesome5 name="newspaper" size={16} color="#7F6000" />
            <Text style={styles.updatesTitle}>Loffee Updates</Text>
          </View>
          
          {/* Banner List */}
          <View style={styles.bannerList}>
            {bannerData.map((banner, index) => (
              <TouchableOpacity 
                key={banner.id || index}
                style={styles.bannerItem}
                onPress={() => handleBannerPress(banner)}
                activeOpacity={0.7}
              >
                {/* Content Container */}
                <View style={styles.bannerContent}>
                  {/* Image Container di kiri */}
                  <View style={styles.bannerImageSection}>
                    <Image 
                      source={{ uri: banner.uri }} 
                      style={styles.bannerImage} 
                    />
                    <View style={styles.imageOverlay} />
                  </View>

                  {/* Text Content di kanan */}
                  <View style={styles.bannerTextSection}>
                    <View style={styles.textContainer}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.bannerTitle} numberOfLines={2}>
                          {banner.title}
                        </Text>
                        {/* <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>HOT</Text>
                        </View> */}
                      </View>
                      
                      <Text style={styles.bannerSubtitle} numberOfLines={1}>
                        Tap untuk detail lengkap
                      </Text>
                      
                      <View style={styles.bannerFooter}>
                        {/* <View style={styles.dateContainer}>
                          <FontAwesome5 name="calendar-alt" size={9} color="#7F6000" />
                          <Text style={styles.bannerDate}>
                            {banner.validUntil}
                          </Text>
                        </View> */}
                        
                        <View style={styles.readMoreContainer}>
                          <Text style={styles.readMoreText}>Lihat</Text>
                          <FontAwesome5 name="chevron-right" size={9} color="#7F6000" />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Updates Description */}
          <View style={styles.updatesDescription}>
            <Text style={styles.updatesDescText}>
              Dapatkan informasi terbaru tentang promo, menu baru, dan event menarik dari Loffee!
            </Text>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <View style={styles.supportContainer}>
            <FontAwesome5 name="headset" size={20} color="#7F6000" />
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Butuh Bantuan?</Text>
              <Text style={styles.supportDesc}>Tim support kami siap membantu Anda</Text>
            </View>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => dataSetting.length > 0 && Linking.openURL('https://wa.me/' + dataSetting[0].no_wa)}
            >
              <FontAwesome5 name="whatsapp" size={16} color="white" />
              <Text style={styles.contactButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Loffee Mobile v1.0.0</Text>
          <Text style={styles.footerSubText}>Always Loffee You ❤️</Text>
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <PaperModal visible={loading} transparent>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7F6000" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </PaperModal>

      {/* Banner Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Informasi</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeModal}
              >
                <FontAwesome5 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedBanner && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner Image */}
                <View style={styles.modalImageContainer}>
                  <Image 
                    source={{ uri: selectedBanner.uri }} 
                    style={styles.modalImage} 
                  />
                </View>

                {/* Content */}
                <View style={styles.modalBody}>
                  <Text style={styles.modalBannerTitle}>
                    {selectedBanner.title}
                  </Text>
                  
                  <Text style={styles.modalDescription}>
                    {selectedBanner.deskripsi || 'Informasi detail untuk banner ini akan segera tersedia. Pantau terus update terbaru dari Loffee!'}
                  </Text>

                  {/* Additional Info */}
                  {/* <View style={styles.additionalInfo}>
                    <View style={styles.infoItem}>
                      <FontAwesome5 name="calendar-alt" size={14} color="#7F6000" />
                      <Text style={styles.infoText}>
                        Berlaku hingga {selectedBanner.validUntil || 'waktu yang tidak ditentukan'}
                      </Text>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <FontAwesome5 name="map-marker-alt" size={14} color="#7F6000" />
                      <Text style={styles.infoText}>
                        Berlaku di semua outlet Loffee
                      </Text>
                    </View>
                    
                    <View style={styles.infoItem}>
                      <FontAwesome5 name="clock" size={14} color="#7F6000" />
                      <Text style={styles.infoText}>
                        Berlaku selama jam operasional
                      </Text>
                    </View>
                  </View> */}

                  {/* Action Buttons */}
                  {/* <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton}>
                      <FontAwesome5 name="coffee" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Lihat Menu</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.secondaryButton}>
                      <FontAwesome5 name="share-alt" size={16} color="#7F6000" />
                      <Text style={styles.secondaryButtonText}>Bagikan</Text>
                    </TouchableOpacity>
                  </View> */}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    paddingBottom: 20
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  logo: {
    width: 120,
    height: 100,
    resizeMode: 'contain'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F6000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2
  },
  logoutText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    marginLeft: 4
  },
  welcomeSection: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    color: '#6c757d',
    fontFamily: 'Poppins-Regular',
    fontSize: 14
  },
  userName: {
    color: '#7F6000',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    marginBottom: 8
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  membershipText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    marginLeft: 4
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  pointsText: {
    color: '#856404',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    marginLeft: 6
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  sectionTitle: {
    color: '#7F6000',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginBottom: 16
  },
  menuSwiper: {
    marginHorizontal: -16
  },
  menuPage: {
    width: width - 32,
    paddingHorizontal: 16
  },
  mainMenuGrid: {
    paddingVertical: 8,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  mainMenuItem: {
    width: (width - 80) / 3,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginHorizontal: 4,
  },
  mainMenuImageContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  mainMenuImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain'
  },
  mainMenuTitle: {
    color: '#495057',
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d6d8db',
    marginHorizontal: 4
  },
  activePageIndicator: {
    backgroundColor: '#7F6000',
    width: 20
  },
  updatesSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  updatesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  updatesTitle: {
    color: '#7F6000',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginLeft: 8
  },
  bannerList: {
    gap: 16,
    marginBottom: 16,
  },
  bannerItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#7F6000',
    marginBottom: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerImageSection: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  bannerTextSection: {
    flex: 1,
    paddingRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#212529',
    lineHeight: 18,
    flex: 1,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: '#7F6000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  newBadgeText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#6c757d',
    lineHeight: 14,
    marginBottom: 8,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bannerDate: {
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    color: '#856404',
    marginLeft: 3,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#7F6000',
    marginRight: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  carouselContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12
  },
  updatesDescription: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#7F6000'
  },
  updatesDescText: {
    color: '#6c757d',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 16
  },
  supportSection: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  supportTextContainer: {
    flex: 1,
    marginLeft: 12
  },
  supportTitle: {
    color: '#212529',
    fontFamily: 'Poppins-Bold',
    fontSize: 14
  },
  supportDesc: {
    color: '#6c757d',
    fontFamily: 'Poppins-Regular',
    fontSize: 11
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16
  },
  contactButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    marginLeft: 4
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16
  },
  footerText: {
    color: '#adb5bd',
    fontFamily: 'Poppins-Regular',
    fontSize: 11
  },
  footerSubText: {
    color: '#7F6000',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginTop: 2
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center'
  },
  loadingText: {
    color: '#212529',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginTop: 8
  },
  
  // Modal Styles untuk Banner
// Ganti bagian Modal Styles di StyleSheet dengan yang ini:

  // Modal Styles untuk Banner - CENTER MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',  // Ubah dari 'flex-end' ke 'center'
    alignItems: 'center',      // Tambahkan ini
    padding: 20,               // Tambahkan padding
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,          // Ubah dari borderTopLeftRadius & borderTopRightRadius
    width: '100%',             // Tambahkan width
    maxWidth: 400,             // Tambahkan maxWidth untuk tablet
    maxHeight: '80%',          // Ubah dari 85% ke 80%
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
  },
  modalImageContainer: {
    height: 200,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalBody: {
    padding: 20,
  },
  modalBannerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#7F6000',
    marginBottom: 12,
    lineHeight: 28,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  additionalInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#7F6000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#7F6000',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#7F6000',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginLeft: 8,
  },
})