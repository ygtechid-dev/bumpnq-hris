import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  Image,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import DatePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../context/APIUrl';

const PengajuanIzin = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('Annual Leave');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [description, setDescription] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  // Map categories to match API schema
  const categories = [
   'Cuti','Sakit', 'Liburan', 'Hamil', 'Keperluan Pribadi'
  ];

  const formatDate = (date) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const onFromDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || fromDate;
    setShowFromPicker(false);
    setFromDate(currentDate);
    
    // Auto adjust toDate if it's before fromDate
    if (currentDate > toDate) {
      setToDate(currentDate);
    }
  };

  const onToDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || toDate;
    setShowToPicker(false);
    
    // Validate that toDate is not before fromDate
    if (currentDate >= fromDate) {
      setToDate(currentDate);
    } else {
      Alert.alert('Error', 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai');
    }
  };

  const handleDescriptionChange = (text) => {
    if (text.length <= 2000) {
      setDescription(text);
      setCharCount(text.length);
    }
  };

  const handleUploadDocument = () => {
    const options = {
      mediaType: 'mixed',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    Alert.alert(
      'Pilih Dokumen',
      'Pilih sumber dokumen yang ingin diunggah',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Kamera', 
          onPress: () => {
            launchCamera(options, (response) => {
              if (response.assets && response.assets[0]) {
                setDocument(response.assets[0]);
              }
            });
          }
        },
        { 
          text: 'Galeri', 
          onPress: () => {
            launchImageLibrary(options, (response) => {
              if (response.assets && response.assets[0]) {
                setDocument(response.assets[0]);
              }
            });
          }
        },
      ]
    );
  };

  const removeDocument = () => {
    setDocument(null);
  };

  const submitLeaveRequest = async () => {
    try {
      setLoading(true);

      // Get user data
      const userData = await AsyncStorage.getItem('@dataSelf');
      if (!userData) {
        Alert.alert('Error', 'Data user tidak ditemukan. Silakan login kembali.');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const userId = parsedUserData.user.id;

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      formData.append('category', selectedCategory);
      formData.append('start_date', formatDateForAPI(fromDate));
      formData.append('end_date', formatDateForAPI(toDate));
      formData.append('description', description.trim());

      // Add image if exists
      if (document && document.uri) {
        formData.append('image', {
          uri: document.uri,
          type: document.type || 'image/jpeg',
          name: document.fileName || `leave_document_${Date.now()}.jpg`,
        });
      }

      console.log('Submitting leave request:', {
        user_id: userId,
        category: selectedCategory,
        start_date: formatDateForAPI(fromDate),
        end_date: formatDateForAPI(toDate),
        description: description.trim(),
        hasDocument: !!document
      });

      const response = await fetch(`${API_URL}/api/leave-requests`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Calculate duration for display
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        Alert.alert(
          'Berhasil!',
          `Pengajuan ${selectedCategory.toLowerCase()} selama ${daysDiff} hari telah dikirim dan menunggu persetujuan.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal mengirim pengajuan izin');
      }
    } catch (error) {
      console.error('Submit leave request error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIzin = () => {
    // Validation
    if (!selectedCategory) {
      Alert.alert('Error', 'Silakan pilih kategori izin');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Silakan isi deskripsi izin');
      return;
    }
    
    if (description.trim().length < 10) {
      Alert.alert('Error', 'Deskripsi minimal 10 karakter');
      return;
    }

    // Validate document for sick leave
    if (selectedCategory === 'Sick Leave' && !document) {
      Alert.alert('Error', 'Surat sakit wajib diunggah untuk izin sakit');
      return;
    }

    // Calculate duration
    const timeDiff = toDate.getTime() - fromDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Show confirmation
    Alert.alert(
      'Konfirmasi Pengajuan',
      `Anda akan mengajukan ${selectedCategory.toLowerCase()} selama ${daysDiff} hari dari ${formatDate(fromDate)} sampai ${formatDate(toDate)}. Lanjutkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Ajukan', onPress: submitLeaveRequest }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengajuan Izin & Cuti</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Kategori</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Duration Section */}
        <View style={styles.section}>
          
          {/* From Date */}
          <Text style={styles.inputLabel}>Dari Tanggal</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowFromPicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
            <FontAwesome5 name="calendar-alt" size={20} color="#5EC898" />
          </TouchableOpacity>

          {/* To Date */}
          <Text style={styles.inputLabel}>Sampai Tanggal</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(toDate)}</Text>
            <FontAwesome5 name="calendar-alt" size={20} color="#5EC898" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Silahkan isi Deskripsi Izin Disini"
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={handleDescriptionChange}
            maxLength={2000}
          />
          <View style={styles.charCountContainer}>
            <Text style={styles.charCountText}>maximum 2000 character</Text>
            <Text style={styles.charCount}>{charCount}/2000</Text>
          </View>
        </View>

        {/* Document Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dokumen 
            <Text style={styles.optionalText}> (jika sakit wajib unggah surat sakit)</Text>
          </Text>
          
          {!document ? (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleUploadDocument}
            >
              <FontAwesome5 name="plus" size={20} color="#5EC898" />
              <Text style={styles.uploadText}>Unggah Dokumen</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.documentPreview}>
              {document.type && document.type.startsWith('image/') ? (
                <Image 
                  source={{ uri: document.uri }} 
                  style={styles.documentImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.documentPlaceholder}>
                  <FontAwesome5 name="file-alt" size={40} color="#5EC898" />
                </View>
              )}
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {document.fileName || 'Dokumen'}
                </Text>
                <Text style={styles.documentSize}>
                  {document.fileSize ? `${Math.round(document.fileSize / 1024)} KB` : ''}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={removeDocument}
              >
                <FontAwesome5 name="times" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitIzin}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Mengirim...' : 'Ajukan Izin'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showFromPicker && (
        <DatePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onFromDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showToPicker && (
        <DatePicker
          value={toDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onToDateChange}
          minimumDate={fromDate}
        />
      )}
    </View>
  );
};

export default PengajuanIzin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#5EC898',
    borderColor: '#5EC898',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    fontSize: 16,
    color: '#333',
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  charCountText: {
    fontSize: 12,
    color: '#5EC898',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
  },
  optionalText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: '#5EC898',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    color: '#5EC898',
    marginLeft: 10,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  documentPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0F9F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#F8F9FA',
  },
  submitButton: {
    backgroundColor: '#5EC898',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#5EC898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});