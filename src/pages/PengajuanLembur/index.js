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

const PengajuanLembur = ({ navigation }) => {
  const [selectedReason, setSelectedReason] = useState('Project Deadline');
  const [overtimeDate, setOvertimeDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  // Predefined reasons for overtime
  const overtimeReasons = [
    'Project Deadline',
    'Client Request', 
    'System Maintenance',
    'Emergency Work',
    'Meeting/Training',
    'Other'
  ];

  const formatDate = (date) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeForAPI = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  };

  const calculateOvertimeHours = () => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // If end time is before start time, assume it crosses midnight
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || overtimeDate;
    setShowDatePicker(false);
    setOvertimeDate(currentDate);
  };

  const onStartTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || startTime;
    setShowStartTimePicker(false);
    setStartTime(currentTime);
  };

  const onEndTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || endTime;
    setShowEndTimePicker(false);
    
    // Validate that end time is after start time (same day comparison)
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Allow crossing midnight or minimum 1 hour difference
    if (endMinutes > startMinutes && endMinutes - startMinutes < 60) {
      Alert.alert('Peringatan', 'Minimal durasi lembur adalah 1 jam');
    }
    
    setEndTime(currentTime);
  };

  const handleDescriptionChange = (text) => {
    if (text.length <= 1000) {
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
      'Pilih sumber dokumen pendukung',
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

  const submitOvertimeRequest = async () => {
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
      formData.append('overtime_date', formatDateForAPI(overtimeDate));
      formData.append('start_time', formatTimeForAPI(startTime));
      formData.append('end_time', formatTimeForAPI(endTime));
      formData.append('reason', selectedReason);
      formData.append('description', description.trim());

      // Add image if exists
      if (document && document.uri) {
        formData.append('image', {
          uri: document.uri,
          type: document.type || 'image/jpeg',
          name: document.fileName || `overtime_document_${Date.now()}.jpg`,
        });
      }

      console.log('Submitting overtime request:', {
        user_id: userId,
        overtime_date: formatDateForAPI(overtimeDate),
        start_time: formatTimeForAPI(startTime),
        end_time: formatTimeForAPI(endTime),
        reason: selectedReason,
        description: description.trim(),
        hasDocument: !!document
      });

      const response = await fetch(`${API_URL}/api/overtime-requests`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok) {
        const hours = calculateOvertimeHours();

        Alert.alert(
          'Berhasil!',
          `Pengajuan lembur untuk ${selectedReason.toLowerCase()} selama ${hours} jam telah dikirim dan menunggu persetujuan.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal mengirim pengajuan lembur');
      }
    } catch (error) {
      console.error('Submit overtime request error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLembur = () => {
    // Validation
    if (!selectedReason) {
      Alert.alert('Error', 'Silakan pilih alasan lembur');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Silakan isi deskripsi pekerjaan');
      return;
    }
    
    if (description.trim().length < 10) {
      Alert.alert('Error', 'Deskripsi minimal 10 karakter');
      return;
    }

    // Validate overtime date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(overtimeDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      Alert.alert('Error', 'Tanggal lembur tidak boleh di masa lalu');
      return;
    }

    // Calculate duration
    const hours = calculateOvertimeHours();
    
    if (hours < 1) {
      Alert.alert('Error', 'Durasi lembur minimal 1 jam');
      return;
    }

    if (hours > 12) {
      Alert.alert('Error', 'Durasi lembur maksimal 12 jam');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Konfirmasi Pengajuan',
      `Anda akan mengajukan lembur untuk ${selectedReason.toLowerCase()} selama ${hours} jam pada ${formatDate(overtimeDate)} dari ${formatTime(startTime)} - ${formatTime(endTime)}. Lanjutkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Ajukan', onPress: submitOvertimeRequest }
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
        <Text style={styles.headerTitle}>Pengajuan Lembur</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alasan Lembur</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {overtimeReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryButton,
                  selectedReason === reason && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedReason === reason && styles.categoryTextActive
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Tanggal Lembur</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(overtimeDate)}</Text>
            <FontAwesome5 name="calendar-alt" size={20} color="#5EC898" />
          </TouchableOpacity>
        </View>

        {/* Time Section */}
        <View style={styles.section}>
          <View style={styles.timeRow}>
            {/* Start Time */}
            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Jam Mulai</Text>
              <TouchableOpacity 
                style={styles.timeInput}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                <FontAwesome5 name="clock" size={16} color="#5EC898" />
              </TouchableOpacity>
            </View>

            {/* End Time */}
            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Jam Selesai</Text>
              <TouchableOpacity 
                style={styles.timeInput}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeText}>{formatTime(endTime)}</Text>
                <FontAwesome5 name="clock" size={16} color="#5EC898" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Duration Display */}
          <View style={styles.durationContainer}>
            <FontAwesome5 name="hourglass-half" size={16} color="#666" />
            <Text style={styles.durationText}>
              Estimasi Durasi: {calculateOvertimeHours()} jam
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi Pekerjaan</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Jelaskan detail pekerjaan yang akan dilakukan saat lembur"
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={handleDescriptionChange}
            maxLength={1000}
          />
          <View style={styles.charCountContainer}>
            <Text style={styles.charCountText}>maksimal 1000 karakter</Text>
            <Text style={styles.charCount}>{charCount}/1000</Text>
          </View>
        </View>

        {/* Document Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dokumen Pendukung 
            <Text style={styles.optionalText}> (opsional)</Text>
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
          onPress={handleSubmitLembur}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Mengirim...' : 'Ajukan Lembur'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date and Time Pickers */}
      {showDatePicker && (
        <DatePicker
          value={overtimeDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showStartTimePicker && (
        <DatePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
          is24Hour={true}
        />
      )}
      
      {showEndTimePicker && (
        <DatePicker
          value={endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  );
};

export default PengajuanLembur;

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
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeInput: {
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
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFF5E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B3',
  },
  durationText: {
    fontSize: 14,
    color: '#B8860B',
    marginLeft: 8,
    fontWeight: '500',
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
    backgroundColor: '#FFF5E6',
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