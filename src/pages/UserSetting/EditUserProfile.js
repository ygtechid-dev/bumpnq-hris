import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert,
  Linking,
  Modal 
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { ref, update, get } from 'firebase/database';
import { database } from '../../config/Fire';
import Logo from '../../assets/logoloffee.png'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditUserProfile = ({ navigation, route }) => {
  const { dataSelf } = route.params;
  console.log('User Data:', dataSelf);
  
  const [dataKontak, setDataKontak] = useState("");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [inputan, setInput] = useState({
    name: dataSelf[0].namaLengkap || '',
    handphone: dataSelf[0].handphone || '',
    email: dataSelf[0].email || '',
    address: dataSelf[0].address || '',
    gender: dataSelf[0].gender || '',
    birth_date: dataSelf[0].birth_date || '',
    password: "",
    verifpassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Initialize date picker with existing birth_date or default to 25 years ago
  useEffect(() => {
    if (dataSelf[0].birth_date) {
      const existingDate = new Date(dataSelf[0].birth_date);
      if (!isNaN(existingDate.getTime())) {
        setSelectedDate(existingDate);
      }
    } else {
      // Default to 25 years ago
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() - 25);
      setSelectedDate(defaultDate);
    }
  }, []);
  
  console.log('Inputan:', inputan);

  // Gender options
  const genderOptions = [
    { key: 'male', label: 'Laki-laki', icon: 'mars' },
    { key: 'female', label: 'Perempuan', icon: 'venus' }
  ];

  // Format date for display (DD MMMM YYYY)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day} ${getMonthName(month)} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Format date for database (YYYY-MM-DD)
  const formatDateForDB = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthName = (month) => {
    const months = [
      '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month];
  };

  const formatGenderDisplay = (gender) => {
    const option = genderOptions.find(opt => opt.key === gender.toLowerCase());
    return option ? option.label : gender;
  };

  // Handle date picker confirmation
  const handleDateConfirm = (date) => {
    setSelectedDate(date);
    const formattedDate = formatDateForDB(date);
    setInput({ ...inputan, birth_date: formattedDate });
    setShowDatePicker(false);
  };

 const handleEditData = async () => {
  setLoading(true);
  
  // Validasi form
  if (!inputan.name || !inputan.handphone || !inputan.email || !inputan.address) {
    Alert.alert('Error', 'Mohon lengkapi semua field yang diperlukan');
    setLoading(false);
    return;
  }

  // Validasi password jika diisi
  if (showPasswordFields && inputan.password) {
    if (inputan.password !== inputan.verifpassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }
    if (inputan.password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      setLoading(false);
      return;
    }
  }

  try {
    // Prepare the data to update
    const updateData = {
      namaLengkap: inputan.name.trim(),
      handphone: inputan.handphone.trim(),
      email: inputan.email.trim(),
      address: inputan.address.trim(),
      gender: inputan.gender,
      birth_date: inputan.birth_date,
      updated_at: new Date().toISOString() // Add timestamp
    };

    // Add password only if it's being changed
    if (showPasswordFields && inputan.password) {
      updateData.password = inputan.password;
    }

    console.log('Data to Update:', updateData);

    // Firebase v9 - update user data
    const userRef = ref(database, `userlogin/${dataSelf[0].uid}`);
    await update(userRef, updateData);

    // Update local storage
    const updatedUserData = {
      ...dataSelf[0],
      ...updateData
    };
    await AsyncStorage.setItem('@dataSelf', JSON.stringify([updatedUserData]));
    
    Alert.alert(
      'Berhasil', 
      'Profil berhasil diperbarui!',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    Alert.alert('Error', 'Terjadi kesalahan: ' + error.message);
  } finally {
    setLoading(false);
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

  useEffect(() => {
    getContact();
  }, []);

  const isFormValid = () => {
    const basicFieldsValid = inputan.name && inputan.handphone && inputan.email && inputan.address;
    
    if (showPasswordFields && inputan.password) {
      return basicFieldsValid && inputan.password === inputan.verifpassword && inputan.password.length >= 6;
    }
    
    return basicFieldsValid;
  };

  const renderGenderPicker = () => (
    <Modal
      visible={showGenderPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowGenderPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Jenis Kelamin</Text>
            <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
              <FontAwesome5 name="times" size={20} color="#495057" />
            </TouchableOpacity>
          </View>
          
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionItem,
                inputan.gender === option.key && styles.optionItemSelected
              ]}
              onPress={() => {
                setInput({ ...inputan, gender: option.key });
                setShowGenderPicker(false);
              }}
            >
              <FontAwesome5 name={option.icon} size={16} color="#7F6000" />
              <Text style={styles.optionText}>{option.label}</Text>
              {inputan.gender === option.key && (
                <FontAwesome5 name="check" size={16} color="#7F6000" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderDatePicker = () => (
    <DatePicker
      modal
      open={showDatePicker}
      date={selectedDate}
      mode="date"
      title="Pilih Tanggal Lahir"
      confirmText="Konfirmasi"
      cancelText="Batal"
      onConfirm={handleDateConfirm}
      onCancel={() => setShowDatePicker(false)}
      maximumDate={new Date()} // Can't select future dates
      minimumDate={new Date(1900, 0, 1)} // Minimum year 1900
    />
  );

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
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image source={Logo} style={styles.logo} />
          <Text style={styles.logoText}>Edit Your Profile</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="user" size={16} color="#7F6000" /> Informasi Dasar
            </Text>
            
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap *</Text>
              <TextInput
                style={styles.textInput}
                placeholderTextColor="grey"
                placeholder="Masukkan nama lengkap"
                value={inputan.name}
                onChangeText={(e) => setInput({ ...inputan, name: e })}  
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                placeholderTextColor="grey"
                placeholder="Masukkan email"
                value={inputan.email}
                onChangeText={(e) => setInput({ ...inputan, email: e })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Handphone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>No. Handphone *</Text>
              <TextInput
                style={styles.textInput}
                placeholderTextColor="grey"
                placeholder="Masukkan nomor handphone"
                value={inputan.handphone}
                onChangeText={(e) => setInput({ ...inputan, handphone: e })}
                keyboardType="phone-pad"
              />
            </View>

            {/* Gender Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jenis Kelamin</Text>
              <TouchableOpacity
                style={[styles.textInput, styles.selectInput]}
                onPress={() => setShowGenderPicker(true)}
              >
                <View style={styles.selectContent}>
                  <Text style={[
                    styles.selectText,
                    !inputan.gender && styles.selectPlaceholder
                  ]}>
                    {inputan.gender ? formatGenderDisplay(inputan.gender) : 'Pilih jenis kelamin'}
                  </Text>
                  <FontAwesome5 name="chevron-down" size={14} color="#7F6000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Birth Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal Lahir</Text>
              <TouchableOpacity
                style={[styles.textInput, styles.selectInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.selectContent}>
                  <Text style={[
                    styles.selectText,
                    !inputan.birth_date && styles.selectPlaceholder
                  ]}>
                    {inputan.birth_date ? formatDisplayDate(inputan.birth_date) : 'Pilih tanggal lahir'}
                  </Text>
                  <FontAwesome5 name="chevron-down" size={14} color="#7F6000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholderTextColor="grey"
                placeholder="Masukkan alamat lengkap"
                value={inputan.address}
                onChangeText={(e) => setInput({ ...inputan, address: e })}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Password Section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.passwordToggle}
              onPress={() => setShowPasswordFields(!showPasswordFields)}
            >
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="lock" size={16} color="#7F6000" /> Ubah Password
              </Text>
              <FontAwesome5 
                name={showPasswordFields ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="#7F6000" 
              />
            </TouchableOpacity>

            {showPasswordFields && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password Baru</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="grey"
                    placeholder="Masukkan password baru (minimal 6 karakter)"
                    value={inputan.password}
                    onChangeText={(e) => setInput({ ...inputan, password: e })}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Konfirmasi Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholderTextColor="grey"
                    placeholder="Ulangi password baru"
                    value={inputan.verifpassword}
                    onChangeText={(e) => setInput({ ...inputan, verifpassword: e })}
                    secureTextEntry
                  />
                </View>

                {inputan.password && inputan.verifpassword && inputan.password !== inputan.verifpassword && (
                  <View style={styles.errorContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={12} color="#e74c3c" />
                    <Text style={styles.errorText}>Password tidak sama</Text>
                  </View>
                )}

                {inputan.password && inputan.password.length < 6 && (
                  <View style={styles.errorContainer}>
                    <FontAwesome5 name="exclamation-triangle" size={12} color="#e74c3c" />
                    <Text style={styles.errorText}>Password minimal 6 karakter</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            {loading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.loadingButtonText}>Menyimpan...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  !isFormValid() && styles.saveButtonDisabled
                ]}
                onPress={handleEditData}
                disabled={!isFormValid()}
              >
                <FontAwesome5 name="save" size={16} color="white" />
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Support Section */}
          <View style={styles.supportSection}>
            <Text style={styles.supportText}>Butuh bantuan?</Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => dataKontak && Linking.openURL('https://wa.me/' + dataKontak)}
            >
              <FontAwesome5 name="whatsapp" size={14} color="#25D366" />
              <Text style={styles.contactButtonText}>Hubungi Kami</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Render Modals */}
      {renderGenderPicker()}
      {renderDatePicker()}
    </View>
  );
};

export default EditUserProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
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
  placeholder: {
    width: 40
  },
  logoSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 24,
    marginBottom: 16
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 8
  },
  logoText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#7F6000'
  },
  formContainer: {
    paddingHorizontal: 16
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#7F6000',
    marginBottom: 16
  },
  passwordToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#495057',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#212529',
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  selectInput: {
    paddingVertical: 0
  },
  selectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  selectText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#212529'
  },
  selectPlaceholder: {
    color: 'grey'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#e74c3c',
    marginLeft: 6
  },
  buttonContainer: {
    marginBottom: 16
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F6000',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  saveButtonDisabled: {
    backgroundColor: '#adb5bd'
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginLeft: 8
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F6000',
    paddingVertical: 16,
    borderRadius: 12
  },
  loadingButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginLeft: 8
  },
  supportSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32
  },
  supportText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6c757d',
    marginBottom: 12
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  contactButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: 'white',
    marginLeft: 6
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '50%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa'
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#212529'
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa'
  },
  optionItemSelected: {
    backgroundColor: '#f8f9fa'
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#212529',
    marginLeft: 12
  }
});