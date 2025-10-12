import React, { useEffect, useState } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../../config/Fire'; // Pastikan database di-export dari config
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const Carousel = () => {
  const [dataSetting, setDataSetting] = useState([])
  const [selectedBanner, setSelectedBanner] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  console.log('sett', dataSetting);


const getDataSetting = async () => {
  try {
    // Firebase v9 syntax
    const dbRef = ref(database, 'setting/');
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const value = snapshot.val();
      console.log('valyuwa', value);
      
      const datled = [];
      
      if (value) {
        Object.keys(value).forEach((item) => {  
          datled.push(value[item]);
        });

        // Menyimpan data banner
        setDataSetting(datled[0]?.banner || []);
      }
    } else {
      console.log('No data available');
      setDataSetting([]);
    }
  } catch (error) {
    console.error('Error getting data:', error);
    setDataSetting([]);
  }
};

// Alternative dengan async/await yang lebih clean
const getDataSettingClean = async () => {
  try {
    const dbRef = ref(database, 'setting/');
    const snapshot = await get(dbRef);
    const value = snapshot.val();
    
    console.log('valyuwa', value);
    
    if (value) {
      // Langsung ambil array dari Object.values() lebih simple
      const datled = Object.values(value);
      setDataSetting(datled[0]?.banner || []);
    } else {
      setDataSetting([]);
    }
  } catch (error) {
    console.error('Error getting data:', error);
    setDataSetting([]);
  }
};

  useEffect(() => {
    getDataSetting()
  }, [])

  const handleBannerPress = (banner) => {
    setSelectedBanner(banner)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedBanner(null)
  }

  // Data dummy jika tidak ada data dari Firebase
  const defaultImages = [
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
  ];

  const bannerData = dataSetting.length > 0 ? dataSetting : defaultImages;

  const renderBannerItem = (banner, index) => (
    <TouchableOpacity 
      key={banner.id || index}
      style={styles.bannerItem}
      onPress={() => handleBannerPress(banner)}
      activeOpacity={0.8}
    >
      {/* Icon dan Text Container */}
      <View style={styles.bannerRow}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="bullhorn" size={16} color="#7F6000" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={styles.bannerDate}>
            {banner.validUntil || 'Informasi terbaru'}
          </Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <FontAwesome5 name="chevron-right" size={14} color="#7F6000" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Banner List */}
      <View style={styles.bannerList}>
        {bannerData.map((banner, index) => renderBannerItem(banner, index))}
      </View>

      {/* Modal untuk detail banner */}
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
                    {selectedBanner.description || 'Informasi detail untuk banner ini akan segera tersedia. Pantau terus update terbaru dari Loffee!'}
                  </Text>

                  {/* Additional Info */}
                  <View style={styles.additionalInfo}>
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
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton}>
                      <FontAwesome5 name="coffee" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Lihat Menu</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.secondaryButton}>
                      <FontAwesome5 name="share-alt" size={16} color="#7F6000" />
                      <Text style={styles.secondaryButtonText}>Bagikan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerList: {
    gap: 8,
  },
  bannerItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#7F6000',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#212529',
    marginBottom: 2,
  },
  bannerDate: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#6c757d',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
});

export default Carousel;