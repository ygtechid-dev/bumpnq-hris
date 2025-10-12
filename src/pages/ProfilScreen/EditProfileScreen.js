import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { API_URL } from '../../context/APIUrl';

const EditProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    phone: '',
    department: '',
    position: '',
    hire_date: '',
    profile_image: '',
    nik: '',
    bank_account: '',
    no_rekening: ''
  });
  console.log('====================================');
  console.log('formdata', formData);
  console.log('====================================');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [originalData, setOriginalData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [hasPasswordChanges, setHasPasswordChanges] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Check if form data has changes
    const changed = Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );
    setHasChanges(changed);
  }, [formData, originalData]);

  useEffect(() => {
    // Check if password fields have content
    const passwordChanged = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;
    setHasPasswordChanges(passwordChanged);
  }, [passwordData]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@dataSelf');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
        
        const userInfo = {
          full_name: parsedData.user?.full_name || '',
          email: parsedData.user?.email || '',
          employee_id: parsedData.user?.employee_id || '',
          phone: parsedData.user?.phone || '',
          department: parsedData.user?.department || '',
          position: parsedData.user?.position || '',
          hire_date: parsedData.user?.hire_date || '',
          profile_image: parsedData.user?.profile_image || '',
          nik: parsedData.user?.nik || '',
          bank_account: parsedData.user?.bank_account || '',
          no_rekening: parsedData.user?.no_rekening || ''
        };
        
        setFormData(userInfo);
        setOriginalData(userInfo);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
      Alert.alert('Error', 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Izin Kamera',
            message: 'Aplikasi membutuhkan izin kamera untuk mengambil foto',
            buttonNeutral: 'Tanya Nanti',
            buttonNegative: 'Batal',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const selectImageSource = () => {
    Alert.alert(
      'Pilih Gambar',
      'Pilih cara untuk memilih foto profil Anda',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kamera', onPress: openCamera },
        { text: 'Galeri', onPress: openGallery },
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Izin Diperlukan', 'Izin kamera diperlukan untuk mengambil foto');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          profile_image: imageUri
        }));
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          profile_image: imageUri
        }));
      }
    });
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error Validasi', 'Nama lengkap wajib diisi');
      return false;
    }
    
    if (!formData.email.trim()) {
      Alert.alert('Error Validasi', 'Email wajib diisi');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error Validasi', 'Masukkan alamat email yang valid');
      return false;
    }
    
    if (!formData.employee_id.trim()) {
      Alert.alert('Error Validasi', 'ID Karyawan wajib diisi');
      return false;
    }
    
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword.trim()) {
      Alert.alert('Error Validasi', 'Password saat ini wajib diisi');
      return false;
    }
    
    if (!passwordData.newPassword.trim()) {
      Alert.alert('Error Validasi', 'Password baru wajib diisi');
      return false;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error Validasi', 'Password baru minimal 6 karakter');
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error Validasi', 'Password baru dan konfirmasi password tidak sama');
      return false;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Error Validasi', 'Password baru harus berbeda dari password saat ini');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (activeTab === 'profile') {
      if (!validateForm()) return;
      
      if (!hasChanges) {
        Alert.alert('Info', 'Tidak ada perubahan untuk disimpan');
        return;
      }
    } else {
      if (!validatePassword()) return;
    }

    try {
      setSaving(true);
      
      let updateData = {};
      
      if (activeTab === 'profile') {
        // Prepare update data (only changed fields)
        Object.keys(formData).forEach(key => {
          if (formData[key] !== originalData[key]) {
            updateData[key] = formData[key];
          }
        });
      } else {
        // Password update
        updateData = {
          password: passwordData.newPassword
        };
      }

      const response = await fetch(`${API_URL}/api/users/${userData.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        if (activeTab === 'profile') {
          // Update local storage with new data
          const updatedUserData = {
            ...userData,
            user: {
              ...userData.user,
              ...result.user
            }
          };
          
          await AsyncStorage.setItem('@dataSelf', JSON.stringify(updatedUserData));
          setUserData(updatedUserData);
          setOriginalData({ ...formData });
          
          Alert.alert('Sukses', 'Profil berhasil diperbarui');
        } else {
          // Clear password fields after successful update
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          
          Alert.alert('Sukses', 'Password berhasil diperbarui');
        }
      } else {
        throw new Error(result.error || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const resetAction = () => {
      if (activeTab === 'profile') {
        setFormData({ ...originalData });
      } else {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    };

    Alert.alert(
      'Batal Perubahan',
      `Yakin ingin membatalkan semua perubahan ${activeTab === 'profile' ? 'profil' : 'password'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetAction
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const currentHasChanges = activeTab === 'profile' ? hasChanges : hasPasswordChanges;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
        <ActivityIndicator size="large" color="#5EC898" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <TouchableOpacity 
          style={[styles.saveButton, (!currentHasChanges || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!currentHasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome5 name="check" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <FontAwesome5 name="user" size={16} color={activeTab === 'profile' ? '#5EC898' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profil
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'password' && styles.activeTab]}
          onPress={() => setActiveTab('password')}
        >
          <FontAwesome5 name="lock" size={16} color={activeTab === 'password' ? '#5EC898' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
            Password
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' ? (
          <>
            {/* Profile Image Section */}
            <View style={styles.profileImageSection}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={selectImageSource}
              >
                {formData.profile_image ? (
                  <Image
                    source={{ uri: formData.profile_image }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <FontAwesome5 name="user" size={40} color="#999" />
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <FontAwesome5 name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileImageText}>Ketuk untuk mengubah foto profil</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              {/* Full Name */}
                <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NIK</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.nik}
                  onChangeText={(text) => handleInputChange('nik', text)}
                  placeholder="Nomor Induk Kependudukan"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Lengkap *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.full_name}
                  onChangeText={(text) => handleInputChange('full_name', text)}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  placeholder="Masukkan email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Employee ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ID Karyawan *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.employee_id}
                  onChangeText={(text) => handleInputChange('employee_id', text)}
                  placeholder="Masukkan ID karyawan"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nomor Telepon</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  placeholder="Masukkan nomor telepon"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Department */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Departemen</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.department}
                  onChangeText={(text) => handleInputChange('department', text)}
                  placeholder="Masukkan departemen"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Position */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Posisi</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.position}
                  onChangeText={(text) => handleInputChange('position', text)}
                  placeholder="Masukkan posisi"
                  placeholderTextColor="#999"
                />
              </View>
                <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Bank</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.bank_account}
                  onChangeText={(text) => handleInputChange('bank_account', text)}
                  placeholder="Nama Bank"
                  placeholderTextColor="#999"
                />
              </View>

                   <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nomor Rekening</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.no_rekening}
                  onChangeText={(text) => handleInputChange('no_rekening', text)}
                  placeholder="Nomor Rekening"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Hire Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tanggal Masuk</Text>
                <TextInput
                  style={styles.textInput}
                  value={formatDate(formData.hire_date)}
                  onChangeText={(text) => handleInputChange('hire_date', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
                <Text style={styles.inputHint}>Format: YYYY-MM-DD</Text>
              </View>
            </View>
          </>
        ) : (
          /* Password Change Section */
          <View style={styles.formSection}>
            <View style={styles.passwordHeader}>
              <FontAwesome5 name="shield-alt" size={20} color="#5EC898" />
              <Text style={styles.passwordHeaderText}>Ubah Password</Text>
            </View>
            <Text style={styles.passwordDescription}>
              Masukkan password saat ini dan pilih password baru yang aman.
            </Text>

            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password Saat Ini *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                  placeholder="Masukkan password saat ini"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('current')}
                >
                  <FontAwesome5 
                    name={showPasswords.current ? 'eye-slash' : 'eye'} 
                    size={16} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password Baru *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => handlePasswordChange('newPassword', text)}
                  placeholder="Masukkan password baru"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('new')}
                >
                  <FontAwesome5 
                    name={showPasswords.new ? 'eye-slash' : 'eye'} 
                    size={16} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>Minimal 6 karakter</Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi Password Baru *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                  placeholder="Konfirmasi password baru"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('confirm')}
                >
                  <FontAwesome5 
                    name={showPasswords.confirm ? 'eye-slash' : 'eye'} 
                    size={16} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Strength Indicator */}
            {passwordData.newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text style={styles.passwordStrengthLabel}>Kekuatan Password:</Text>
                <View style={styles.strengthBars}>
                  <View style={[
                    styles.strengthBar, 
                    passwordData.newPassword.length >= 6 && styles.strengthBarActive
                  ]} />
                  <View style={[
                    styles.strengthBar, 
                    passwordData.newPassword.length >= 8 && styles.strengthBarActive
                  ]} />
                  <View style={[
                    styles.strengthBar, 
                    passwordData.newPassword.length >= 10 && /[A-Z]/.test(passwordData.newPassword) && styles.strengthBarActive
                  ]} />
                  <View style={[
                    styles.strengthBar, 
                    passwordData.newPassword.length >= 10 && /[A-Z]/.test(passwordData.newPassword) && /[0-9]/.test(passwordData.newPassword) && styles.strengthBarActive
                  ]} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.resetButton, !currentHasChanges && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={!currentHasChanges}
          >
            <FontAwesome5 name="undo" size={16} color="#FF6B6B" />
            <Text style={styles.resetButtonText}>Reset Perubahan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButtonLarge, (!currentHasChanges || saving) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!currentHasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <FontAwesome5 name="save" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Menyimpan...' : `Simpan ${activeTab === 'profile' ? 'Profil' : 'Password'}`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

export default EditProfileScreen;

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#5EC898',
    paddingTop: 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#5EC898',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#5EC898',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5EC898',
    borderRadius: 15,
    padding: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileImageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  passwordHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  passwordDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  passwordStrength: {
    marginTop: 10,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  strengthBarActive: {
    backgroundColor: '#5EC898',
  },
  actionButtons: {
    gap: 15,
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5EC898',
    borderRadius: 12,
    paddingVertical: 15,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomSpacing: {
    height: 20,
  },
});