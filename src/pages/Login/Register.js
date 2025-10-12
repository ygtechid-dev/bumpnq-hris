import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { ref, set, get, update } from 'firebase/database';
import Logo from '../../assets/logoloffee.png'
import axios from 'axios';
import FontAwesomeIcon5 from 'react-native-vector-icons/FontAwesome5'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { API_URL } from '../../context/APIUrl';
// Import DatePicker
import DatePicker from 'react-native-date-picker';
import { database } from '../../config/Fire';

const API_BASE_URL = `${API_URL}/api`; // Ganti dengan URL API Anda

const Register = ({navigation}) => {
  const [inputan, setInput] = useState({
    name: "",
    handphone: "",
    email: "loffeedefault@gmail.com",
    address: "Jakarta",
    otp: "",
    password: "",
    verifpassword: "",
    companycode: "",
    birthDate: new Date(), // Tambah tanggal lahir
    gender: "", // Tambah gender
  });
  
  const [loading, setLoading] = useState(false);
  
  const [otpSent, setOtpSent] = useState(false);
  const [kodeOtp, setKodeOtp] = useState("")
  const [otpVerif, setOtpVerif] = useState(false)
  const [dataSetting, setDataSetting] = useState([])
  const [companyCodeValid, setCompanyCodeValid] = useState(false)
  const [companyCodeLoading, setCompanyCodeLoading] = useState(false)
  const [companyCodeChecked, setCompanyCodeChecked] = useState(false)
  const [companyName, setCompanyName] = useState("")
  // State baru untuk validasi nomor HP
  const [phoneChecking, setPhoneChecking] = useState(false)
  const [phoneExists, setPhoneExists] = useState(false)
  // State untuk DatePicker
  const [isProcessingGuest, setIsProcessingGuest] = useState(false);
const [guestDeletedSuccessfully, setGuestDeletedSuccessfully] = useState(false);

  const [datePickerOpen, setDatePickerOpen] = useState(false)

  console.log('otp', kodeOtp);
  console.log('inputan', inputan);

  // Fungsi untuk format tanggal
 const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  // Fungsi untuk menghitung umur
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

 
const createWelcomeVoucher = async (uid, userData) => {
  console.log(`🎉 Starting welcome voucher creation for user: ${userData.namaLengkap || uid}`);
  console.log(`👤 User membership type: ${userData.membership_status}`);
  
  try {
    // 1. Determine template path based on membership type
    let templatePath = '';
    let membershipType = userData.membership_status || 'Silver';
    
    if (membershipType === 'TemanLoffee') {
      templatePath = 'TemanLoffee';
    } else {
      templatePath = 'Silver'; // Default untuk Silver
    }
    
    console.log(`📋 Using template path:${templatePath}`);
    

    // 2. Get welcome voucher template from Firebase based on membership type
  const templateRef = ref(database, `welcome_voucher_template/${templatePath}`);
  console.log('🔍 Path final yang diambil:', `welcome_voucher_template/${templatePath}`);
    const templateSnapshot = await get(templateRef);
    
    if (!templateSnapshot.exists()) {
      console.log(`❌ Welcome voucher template not found for ${membershipType} at path: ${templatePath}`);
      
      // Fallback to default template if specific template not found
      const fallbackTemplateRef = ref(database, 'welcome_voucher_template');
      const fallbackSnapshot = await get(fallbackTemplateRef);
      
      if (!fallbackSnapshot.exists()) {
        console.log('❌ No fallback template found either');
        return { success: false, message: 'Template tidak ditemukan' };
      }
      
      console.log('⚠️ Using fallback template');
      const fallbackTemplate = fallbackSnapshot.val();
      
      if (!fallbackTemplate.is_active) {
        console.log('❌ Fallback template is not active');
        return { success: false, message: 'Template tidak aktif' };
      }
    }
    
    const template = templateSnapshot.exists() ? templateSnapshot.val() : fallbackSnapshot.val();
    
    if (!template.is_active) {
      console.log(`❌ Welcome voucher template for ${membershipType} is not active`);
      return { success: false, message: 'Template tidak aktif' };
    }
    
    // 3. Check if user already has welcome voucher
    const existingVoucherRef = ref(database, `user_welcome_vouchers/${uid}`);
    const existingVoucherSnapshot = await get(existingVoucherRef);
    
    if (existingVoucherSnapshot.exists()) {
      console.log('⚠️ User already has welcome voucher');
      return { success: false, message: 'User sudah memiliki welcome voucher' };
    }
    
    console.log(`📋 Template found for ${membershipType}:`, template.title);
    
    // 4. Prepare voucher payload for admin/create API with membership-specific values
    const voucherPayload = {
      title: template.title,
      description: template.description || `Selamat datang member ${membershipType}! Voucher khusus untuk Anda`,
      type: template.voucher_type, // 'discount', 'cashback', 'free_item'
      nominal: template.nominal,
      point_price: template.point_price || 0,
      min_transaction: template.min_transaction || 0,
      start_date: new Date().toISOString().split('T')[0], // Today
      end_date: (() => {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (template.validity_days || 30));
        return endDate.toISOString().split('T')[0];
      })(),
      stock: 1, // Individual voucviher
      category: template.category || `Welcome New User - ${membershipType}`,
      image: template.image_url || null,
      is_active: true,
      target_uid: uid,
      membership_type: membershipType // Add membership type to payload
    };
    
    console.log(`🚀 Creating ${membershipType} voucher via admin API...`);
    console.log('Voucher payload:', voucherPayload);
    
    // 5. Create voucher via admin/create API
    const createResponse = await axios.post('https://ygtechdev.my.id/api/shop/admin/create', voucherPayload);
    
    if (!createResponse.data.success) {
      throw new Error(`API create failed: ${createResponse.data.message}`);
    }
    
    const voucherId = createResponse.data.data.id;
    console.log(`✅ ${membershipType} voucher created successfully with ID: ${voucherId}`);
    console.log('Create response:', createResponse.data);
    
    // 6. Record welcome voucher in Firebase with membership info
    const welcomeVoucherData = {
      voucher_id: voucherId,
      voucher_name: template.title,
      voucher_type: template.voucher_type,
      nominal: template.nominal,
      point_price: template.point_price || 0,
      created_at: new Date().toISOString(),
      expired_date: (() => {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (template.validity_days || 30));
        return expDate.toISOString();
      })(),
      user_name: userData.namaLengkap || 'Unknown',
      user_email: userData.email || '-',
      user_phone: userData.handphone || '-',
      template_used: template.title,
      template_path: templatePath, // Record which template was used
      membership_status: membershipType,
      membership_type: membershipType, // Store membership type for easier filtering
      company_name: userData.company_name || null,
      company_code_used: userData.company_code_used || null,
      source: 'welcome_new_user',
      user_age: userData.age || null,
      user_gender: userData.gender || null
    };
    
    // Save to Firebase
    const updates = {};
    updates[`user_welcome_vouchers/${uid}`] = welcomeVoucherData;
    
    const dbRef = ref(database);
    await update(dbRef, updates);
    
    console.log(`💾 ${membershipType} welcome voucher data saved to Firebase`);
    
    // 7. Auto-purchase the voucher for the user
    try {
      console.log(`🛒 Auto-purchasing ${membershipType} voucher for user...`);
      
      const purchaseResponse = await axios.post(`https://ygtechdev.my.id/api/shop/purchase`, {
        firebase_uid: uid,
        user_email: userData.email,
        voucher_shop_id: voucherId,
        current_points: userData.point_wallet || 0,
        membership_type: membershipType // Include membership type in purchase
      });
      
      console.log(`✅ ${membershipType} voucher auto-purchased successfully`);
      console.log('Purchase response:', purchaseResponse.data);
      
      // Update the welcome voucher record with purchase info
      await update(ref(database, `user_welcome_vouchers/${uid}`), {
        is_purchased: true,
        purchased_at: new Date().toISOString(),
        purchase_response: purchaseResponse.data.success ? 'success' : 'failed'
      });
      
      return {
        success: true,
        message: `Welcome voucher untuk ${membershipType} berhasil dibuat dan dibeli`,
        data: {
          voucher_id: voucherId,
          voucher_name: template.title,
          nominal: template.nominal,
          point_price: template.point_price || 0,
          purchase_status: 'completed',
          membership_type: membershipType,
          template_used: templatePath
        }
      };
      
    } catch (purchaseError) {
      console.error(`❌ Failed to auto-purchase ${membershipType} voucher:`, purchaseError.message);
      
      // Update record with purchase failure
      await update(ref(database, `user_welcome_vouchers/${uid}`), {
        is_purchased: false,
        purchase_error: purchaseError.message,
        purchase_attempted_at: new Date().toISOString()
      });
      
      // Still return success since voucher was created
      return {
        success: true,
        message: `Welcome voucher untuk ${membershipType} berhasil dibuat tapi gagal auto-purchase`,
        data: {
          voucher_id: voucherId,
          voucher_name: template.title,
          nominal: template.nominal,
          point_price: template.point_price || 0,
          purchase_status: 'failed',
          purchase_error: purchaseError.message,
          membership_type: membershipType,
          template_used: templatePath
        }
      };
    }
    
  } catch (error) {
    console.error(`❌ Failed to create ${userData.membership_status || 'Silver'} welcome voucher:`, error.response);
    
    // Log the error for debugging with membership info
    try {
      const errorLogRef = ref(database, `welcome_voucher_errors/${uid}`);
      await set(errorLogRef, {
        error_message: error.message,
        error_timestamp: new Date().toISOString(),
        membership_type: userData.membership_status || 'Silver',
        template_path_attempted: userData.membership_status === 'TemanLoffee' ? 'welcome_voucher_template_teman_loffee' : 'welcome_voucher_template_silver',
        user_data: {
          name: userData.namaLengkap || 'Unknown',
          email: userData.email || '-',
          membership_status: userData.membership_status || 'Silver',
          company_name: userData.company_name || null
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError.message);
    }
    
    return {
      success: false,
      message: `Failed to create ${userData.membership_status || 'Silver'} welcome voucher: ${error.message}`,
      error: error.message,
      membership_type: userData.membership_status || 'Silver'
    };
  }
};

  // Fungsi untuk mengecek apakah nomor HP sudah terdaftar
 // Fungsi untuk mengecek apakah nomor HP sudah terdaftar
// Fungsi untuk menghapus user GUEST dari Firebase
const deleteGuestUser = async (uid) => {
  try {
    console.log(`🗑️ Starting deletion process for GUEST user: ${uid}`);
    
    // Import remove function dari Firebase v9
    const { remove } = await import('firebase/database');
    
    // Hapus data user dari userlogin
    const userRef = ref(database, `userlogin/${uid}`);
    await remove(userRef);
    
    console.log(`✅ GUEST user ${uid} successfully deleted from userlogin`);
    
    // Optional: Hapus data terkait lainnya jika ada
    // Contoh: hapus dari tabel lain yang mungkin terkait dengan user ini
    
    // Cek dan hapus dari user_profiles jika ada
    try {
      const profileRef = ref(database, `user_profiles/${uid}`);
      const profileSnapshot = await get(profileRef);
      if (profileSnapshot.exists()) {
        await remove(profileRef);
        console.log(`✅ GUEST user profile ${uid} deleted from user_profiles`);
      }
    } catch (profileError) {
      console.log(`⚠️ No profile found for ${uid} or error deleting profile:`, profileError.message);
    }
    
    // Cek dan hapus dari user_sessions jika ada
    try {
      const sessionRef = ref(database, `user_sessions/${uid}`);
      const sessionSnapshot = await get(sessionRef);
      if (sessionSnapshot.exists()) {
        await remove(sessionRef);
        console.log(`✅ GUEST user session ${uid} deleted from user_sessions`);
      }
    } catch (sessionError) {
      console.log(`⚠️ No session found for ${uid} or error deleting session:`, sessionError.message);
    }
    
    return { success: true, message: 'GUEST user data berhasil dihapus' };
    
  } catch (error) {
    console.error(`❌ Error deleting GUEST user ${uid}:`, error);
    return { 
      success: false, 
      message: `Gagal menghapus data GUEST user: ${error.message}`,
      error: error.message 
    };
  }
};

const checkPhoneExists = async (phoneNumber) => {
  if (!phoneNumber || phoneNumber.length < 10) {
    return false;
  }

  setPhoneChecking(true);
  
  try {
    console.log(`🔍 Checking if phone number exists: ${phoneNumber}`);
    
    // Ambil semua data user dan filter di client
    const usersRef = ref(database, 'userlogin');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      
      // Cari nomor HP yang sama dan dapatkan UID-nya
      let existingUser = null;
      let existingUserUid = null;
      
      Object.keys(users).forEach(uid => {
        if (users[uid].handphone === phoneNumber) {
          existingUser = users[uid];
          existingUserUid = uid;
        }
      });
      
      console.log('📱 Existing user found:', existingUser);
      console.log('🆔 Existing user UID:', existingUserUid);
      
      if (existingUser) {
        // Cek apakah user adalah GUEST
        if (existingUser.membership_status === "GUEST") {
          console.log(`👤 User is GUEST, showing upgrade option`);
          
          // Set flag bahwa sedang proses GUEST
          setIsProcessingGuest(true);
          
          // Tampilkan alert khusus untuk GUEST
          setPhoneExists(false); // Set false dulu agar tidak block input
          
          Alert.alert(
            'Nomor HP Sudah Terdaftar', 
            `Nomor HP Anda sudah terdaftar sebagai ${existingUser.membership_status} Member. Dengan klik "Lanjutkan" maka Anda akan terdaftar sebagai Member Loffee.`,
            [
              {
                text: 'Batal',
                style: 'cancel',
                onPress: () => {
                  console.log('❌ User cancelled GUEST upgrade');
                  setPhoneExists(true);
                  setIsProcessingGuest(false);
                  setGuestDeletedSuccessfully(false);
                }
              },
              {
                text: 'Lanjutkan',
                onPress: async () => {
                  try {
                    console.log(`🔄 Starting GUEST user deletion process...`);
                    
                    // Gunakan fungsi delete yang sudah dibuat
                    const deleteResult = await deleteGuestUser(existingUserUid);
                    
                    if (deleteResult.success) {
                      console.log(`✅ ${deleteResult.message}`);
                      
                      // Set status bahwa nomor HP bisa digunakan dan GUEST berhasil dihapus
                      setPhoneExists(false);
                      setGuestDeletedSuccessfully(true);
                      setIsProcessingGuest(false);
                      
                      Alert.alert(
                        'Berhasil', 
                        'Data tamu berhasil dihapus. Silakan lanjutkan proses registrasi sebagai member.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              console.log('✅ Ready for new registration');
                              // Reset form jika diperlukan
                              setOtpSent(false);
                              setOtpVerif(false);
                              setKodeOtp("");
                              setInput(prev => ({ ...prev, otp: "" }));
                              
                              // Auto-trigger kirim OTP setelah delay
                              setTimeout(() => {
                                if (phoneNumber && phoneNumber.length >= 10) {
                                  handleSendOtp();
                                }
                              }, 500);
                            }
                          }
                        ]
                      );
                      
                    } else {
                      throw new Error(deleteResult.message);
                    }
                    
                  } catch (deleteError) {
                    console.error('❌ Error deleting GUEST user:', deleteError);
                    setIsProcessingGuest(false);
                    setGuestDeletedSuccessfully(false);
                    Alert.alert(
                      'Error', 
                      `Terjadi kesalahan saat menghapus data tamu: ${deleteError.message}. Silakan coba lagi.`
                    );
                    setPhoneExists(true);
                  }
                }
              }
            ],
            { cancelable: false } // Prevent dismissal by tapping outside
          );
          
          return "GUEST_FOUND"; // Return status khusus untuk GUEST
          
        } else {
          console.log(`👤 User has membership status: ${existingUser.membership_status}`);
          
          // User sudah terdaftar dengan status selain GUEST
          setPhoneExists(true);
          Alert.alert(
            'Nomor HP Sudah Terdaftar', 
            `Nomor handphone ini sudah terdaftar sebagai ${existingUser.membership_status}. Silakan gunakan nomor lain atau login jika ini adalah akun Anda.`,
            [
              {
                text: 'Login',
                onPress: () => navigation.navigate('Login')
              },
              {
                text: 'Ganti Nomor',
                style: 'cancel'
              }
            ]
          );
          return true;
        }
      } else {
        console.log('✅ Phone number is available for registration');
        // Nomor HP belum ada, bisa lanjut
        setPhoneExists(false);
        return false;
      }
    } else {
      console.log('ℹ️ No users found in database');
      // Tidak ada user sama sekali
      setPhoneExists(false);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking phone number:', error);
    Alert.alert('Error', 'Terjadi kesalahan saat mengecek nomor handphone');
    return false;
  } finally {
    setPhoneChecking(false);
  }
};

const handleRegister = async () => {
  setLoading(true);
  
  // Validasi form
  if (!inputan.name || !inputan.handphone || !inputan.password || !inputan.verifpassword || !inputan.gender) {
    Alert.alert('Error', 'Mohon lengkapi semua field yang diperlukan');
    setLoading(false);
    return;
  }

  if (inputan.password !== inputan.verifpassword) {
    Alert.alert('Error', 'Password dan konfirmasi password tidak sama');
    setLoading(false);
    return;
  }

  if (!otpVerif) {
    Alert.alert('Error', 'Mohon verifikasi OTP terlebih dahulu');
    setLoading(false);
    return;
  }

  // Validasi umur minimal 13 tahun
  const age = calculateAge(inputan.birthDate);
  if (age < 10) {
    Alert.alert('Error', 'Anda harus berusia minimal 10 tahun untuk mendaftar');
    setLoading(false);
    return;
  }

  // Validasi company code jika diisi
  if (inputan.companycode && !companyCodeValid) {
    Alert.alert('Error', 'Mohon validasi company code terlebih dahulu');
    setLoading(false);
    return;
  }

  // Cek lagi nomor HP sebelum registrasi (double check)
  const phoneAlreadyExists = await checkPhoneExists(inputan.handphone);
  if (phoneAlreadyExists) {
    setLoading(false);
    return;
  }

  try {
    const codeOtpRandom = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
    const uid = "LOFFEE-" + codeOtpRandom;
    
    // Tentukan membership status berdasarkan company code
    let membershipStatus = "Silver"; // Default
    
    // Jika ada company code dan valid, gunakan company code
    if (inputan.companycode && companyCodeValid) {
      try {
        // Use company code melalui API
        const useCompanyCodeResponse = await axios.post(`${API_URL}/api/company-codes/use`, {
          company_code: inputan.companycode,
          firebase_uid: uid
        });

        if (useCompanyCodeResponse.data.success) {
          membershipStatus = "TemanLoffee";
          console.log('Company code berhasil digunakan:', useCompanyCodeResponse.data);
        }
      } catch (companyError) {
        console.log('Error using company code:', companyError.response?.data);
        // Jika gagal gunakan company code, tetap lanjut dengan Silver
        Alert.alert('Peringatan', 'Company code tidak dapat digunakan, akun akan dibuat dengan status Silver');
      }
    }

    const data = {
      namaLengkap: inputan.name,
      handphone: inputan.handphone,
      email: inputan.email,
      address: inputan.address,
      password: inputan.password,
      uid: uid,
      membership_status: membershipStatus,
      point_member: membershipStatus === "TemanLoffee" ? 1000 : 0, // Bonus poin untuk TemanLoffee
      point_wallet: membershipStatus === "TemanLoffee" ? 1000 : 0,
      foto_profile: null,
      company_code_used: inputan.companycode || null,
      company_name: companyName || null,
      birth_date: formatDate(inputan.birthDate), // Tambah tanggal lahir
      age: calculateAge(inputan.birthDate), // Tambah umur
      gender: inputan.gender, // Tambah gender
      created_at: new Date().toISOString(), // Tambah timestamp
      registration_type: "manual"
    };

    console.log('Data registrasi:', data);

    // Firebase v9 - set data user
    const userRef = ref(database, `userlogin/${uid}`);
    await set(userRef, data);

    // Issue welcome voucher berdasarkan membership level
    try {
      const voucherResponse = await axios.post(`${API_BASE_URL}/vouchers/issue`, {
        firebase_uid: uid,
        user_email: inputan.email,
        membership_level: membershipStatus
      });
      
      if (voucherResponse.data.success) {
        console.log('Welcome voucher issued:', voucherResponse.data);
      }
    } catch (voucherError) {
      console.log('Error issuing welcome voucher:', voucherError);
    }

    // ============= WELCOME VOUCHER CREATION =============
    try {
      console.log('🎁 Creating welcome voucher for new user...');
      
      const welcomeVoucherResult = await createWelcomeVoucher(uid, data);
      
      if (welcomeVoucherResult.success) {
        console.log('✅ Welcome voucher process completed:', welcomeVoucherResult.message);
        
        // Add voucher info to success message if created successfully
        const voucherInfo = welcomeVoucherResult.data;
        if (voucherInfo) {
          if (voucherInfo.purchase_status === 'completed') {
            console.log(`🎁 Voucher "${voucherInfo.voucher_name}" (${voucherInfo.nominal}) auto-purchased successfully`);
          } else if (voucherInfo.purchase_status === 'failed') {
            console.log(`⚠️ Voucher "${voucherInfo.voucher_name}" created but purchase failed`);
          }
        }
      } else {
        console.log('⚠️ Welcome voucher creation failed:', welcomeVoucherResult.message);
        // Don't block registration success, just log the failure
      }
      
    } catch (voucherError) {
      console.error('❌ Welcome voucher creation error:', voucherError);
      // Don't block registration success
    }
    // ============= END WELCOME VOUCHER CREATION =============

    const successMessage = membershipStatus === "TemanLoffee" 
      ? `Selamat! Anda berhasil mendaftar sebagai ${companyName} Family dengan bonus 1000 poin dan voucher welcome!`
      : "Berhasil Daftar! Anda mendapat voucher welcome sebagai bonus pendaftaran!";
      
    Alert.alert('Sukses', successMessage, [
      {
        text: 'OK',
        onPress: () => {
          navigation.replace('Login');
        }
      }
    ]);

  } catch (error) {
    console.error('Error during registration:', error);
    Alert.alert('Error', 'Terjadi kesalahan saat mendaftar: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const validateCompanyCode = async () => {
    if (!inputan.companycode || inputan.companycode.length < 3) {
      Alert.alert('Error', 'Mohon masukkan company code yang valid');
      return;
    }

    setCompanyCodeLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/company-codes/validate`, {
        company_code: inputan.companycode
      });

      if (response.data.success) {
        setCompanyCodeValid(true);
        setCompanyCodeChecked(true);
        setCompanyName(response.data.data.nama_company);
        Alert.alert('Valid!', `Company code valid untuk ${response.data.data.nama_company}`);
      }
    } catch (error) {
      setCompanyCodeValid(false);
      setCompanyCodeChecked(true);
      setCompanyName("");
      
      if (error.response && error.response.data) {
        Alert.alert('Invalid', error.response.data.message);
      } else {
        Alert.alert('Error', 'Terjadi kesalahan saat memvalidasi company code');
      }
      console.log('Company code validation error:', error);
    } finally {
      setCompanyCodeLoading(false);
    }
  };

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
        // Lebih simple pakai Object.values()
        const datled = Object.values(value);
        
        // Set data setting
        setDataSetting(datled);
        
        // Simpan nomor WA jika diperlukan
        if (datled[0]?.no_wa) {
          const jsonValue = JSON.stringify(datled[0].no_wa);
          // await AsyncStorage.setItem('kontak', jsonValue); // Uncomment jika perlu
        }
      }
    } else {
      console.log('No setting data available');
      setDataSetting([]);
    }
  } catch (error) {
    console.error('Error getting setting data:', error);
    setDataSetting([]);
  } finally {
    setLoading(false);
  }
};

const handleSendOtp = async () => {
  // Validasi nomor HP terlebih dahulu
  if (!inputan.handphone || inputan.handphone.length < 10) {
    Alert.alert('Error', 'Mohon masukkan nomor handphone yang valid');
    return;
  }

  // Jika sedang proses GUEST, jangan lanjutkan
  if (isProcessingGuest) {
    console.log('⚠️ Still processing GUEST user, please wait...');
    return;
  }

  // Jika GUEST sudah dihapus, langsung kirim OTP tanpa cek lagi
  if (guestDeletedSuccessfully) {
    console.log('✅ GUEST deleted, proceeding with OTP...');
    // Reset flag setelah digunakan
    setGuestDeletedSuccessfully(false);
  } else {
    // Cek apakah nomor HP sudah terdaftar
    const phoneCheckResult = await checkPhoneExists(inputan.handphone);
    console.log('phoneCheckResult', phoneCheckResult);
    
    if (phoneCheckResult === true) {
      // User sudah terdaftar dengan status selain GUEST
      return;
    } else if (phoneCheckResult === "GUEST_FOUND") {
      // GUEST ditemukan, tunggu user pilih opsi
      return;
    }
    // Jika phoneCheckResult === false, lanjutkan kirim OTP
  }

  // Logic untuk mengirim OTP ke nomor handphone
  const otp = Math.floor(100000 + Math.random() * 900000);
  setKodeOtp(otp);
  
  try {
    const response = await axios.post('https://api.fonnte.com/send', 
      {
        "target": inputan.handphone,
        "message": "*Selamat Bergabung di LOFFEE MOBILE*. \n \nBerikut Kode OTP untuk Registrasi Anda " + otp + " . Jangan sebarkan kode ini kepada siapapun \n \nTerima Kasih\n*ALWAYS LOFFEE YOU*"
      },
      {
        headers: {
          'Authorization': 'VdyewJroqj2HKB78hkCN'
        }
      }
    );
    
    console.log('✅ OTP sent successfully:', response.data);
    setOtpSent(true);
    Alert.alert('Sukses', 'OTP dikirim ke nomor handphone');
    
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    Alert.alert('Error', 'Terjadi kesalahan, OTP gagal dikirim');
  }
};

  const handleVerifyOtp = () => {
    // Logic untuk memverifikasi OTP
    if (inputan.otp == kodeOtp) {
      Alert.alert('Sukses', 'OTP berhasil diverifikasi');
      setOtpVerif(true)
    } else {
      Alert.alert('Error', 'OTP salah');
      setOtpVerif(false)
    }
  };

  // Reset company code validation when code changes
  useEffect(() => {
    if (companyCodeChecked) {
      setCompanyCodeValid(false);
      setCompanyCodeChecked(false);
      setCompanyName("");
    }
  }, [inputan.companycode]);

  // Reset phone validation when handphone changes
  useEffect(() => {
    setPhoneExists(false);
    setOtpVerif(false);
    setOtpSent(false);
    setKodeOtp("");
    // Reset OTP field juga
    setInput(prev => ({ ...prev, otp: "" }));
  }, [inputan.handphone]);

  useEffect(() => {
   getDataSetting()
  }, [])
  
  return (
    <View style={{flex: 1, backgroundColor: '#F7F7F0'}}>
      <View style={{marginHorizontal: 16, marginTop: 24}}>
        <Image source={Logo} style={{width: 150, height: 75}} />
        <Text style={styles.txtHead}>{'Thank you for \nJoin us :)'}</Text>
      </View>

      <ScrollView>
        <View style={{justifyContent: 'center', marginTop: 16, marginHorizontal: 24}}>
          {/* Name Input */}
          <TextInput
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Name"
            value={inputan.name}
            onChangeText={(e) => setInput({ ...inputan, name: e })}  
          />

          {/* Gender Selection */}
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>Jenis Kelamin</Text>
            <View style={styles.genderButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.genderButton,
                  inputan.gender === 'Laki-laki' && styles.genderButtonActive
                ]}
                onPress={() => setInput({ ...inputan, gender: 'Laki-laki' })}
              >
                <FontAwesomeIcon5 
                  name="mars" 
                  size={18} 
                  color={inputan.gender === 'Laki-laki' ? 'white' : '#7F6000'} 
                />
                <Text style={[
                  styles.genderButtonText,
                  inputan.gender === 'Laki-laki' && styles.genderButtonTextActive
                ]}>
                  Laki-laki
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.genderButton,
                  inputan.gender === 'Perempuan' && styles.genderButtonActive
                ]}
                onPress={() => setInput({ ...inputan, gender: 'Perempuan' })}
              >
                <FontAwesomeIcon5 
                  name="venus" 
                  size={18} 
                  color={inputan.gender === 'Perempuan' ? 'white' : '#7F6000'} 
                />
                <Text style={[
                  styles.genderButtonText,
                  inputan.gender === 'Perempuan' && styles.genderButtonTextActive
                ]}>
                  Perempuan
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date of Birth Input */}
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setDatePickerOpen(true)}
          >
            <View style={styles.datePickerContent}>
              <FontAwesomeIcon5 name="calendar-alt" size={20} color="#7F6000" />
              <Text style={styles.datePickerText}>
                 {formatDate(inputan.birthDate)}
              </Text>
              <Text style={styles.ageText}>
                ({calculateAge(inputan.birthDate)} tahun)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Date Picker Modal */}
          <DatePicker
            modal
            open={datePickerOpen}
            date={inputan.birthDate}
            mode="date"
            title="Pilih Tanggal Lahir"
            confirmText="Konfirmasi"
            cancelText="Batal"
            maximumDate={new Date()} // Tidak bisa pilih tanggal masa depan
            minimumDate={new Date(1940, 0, 1)} // Minimal tahun 1940
            onConfirm={(date) => {
              setDatePickerOpen(false);
              setInput({ ...inputan, birthDate: date });
            }}
            onCancel={() => {
              setDatePickerOpen(false);
            }}
          />

          {/* Age validation warning */}
          {calculateAge(inputan.birthDate) < 13 && (
            <View style={styles.ageWarning}>
              <FontAwesomeIcon5 name="exclamation-triangle" size={16} color="#e74c3c" />
              <Text style={styles.ageWarningText}>
                Anda harus berusia minimal 10 tahun untuk mendaftar
              </Text>
            </View>
          )}

          {/* Handphone Input with "Kirim OTP" button */}
          <View style={styles.inputWithButton}>
            <TextInput
              style={[
                styles.txtInputWithButton,
                phoneExists && styles.txtInputError
              ]}
              placeholderTextColor="grey" 
              placeholder="Handphone"
              value={inputan.handphone}
              onChangeText={(e) => setInput({ ...inputan, handphone: e })}  
              keyboardType="phone-pad"
            />
            {inputan.handphone !== "" ?
              phoneChecking ? (
                <ActivityIndicator size="small" color="#7F6000" style={{marginLeft: 10}} />
              ) : phoneExists ? (
                <FontAwesomeIcon5 name="times-circle" size={25} color="red" style={{marginLeft: 10}} />
              ) : otpVerif == false ? (
                <TouchableOpacity style={styles.btnKirimOtp} onPress={handleSendOtp}>
                  <Text style={styles.btnText}>Kirim OTP</Text>
                </TouchableOpacity>
              ) : (
                <FontAwesomeIcon5 name="check" size={25} color="green" style={{marginLeft: 10}} />
              )
              :
              null
            }
          </View>

          {/* Show error message if phone exists */}
          {phoneExists && (
            <View style={styles.phoneExistsError}>
              <FontAwesomeIcon5 name="exclamation-triangle" size={16} color="#e74c3c" />
              <Text style={styles.phoneExistsErrorText}>
                Nomor handphone ini sudah terdaftar. Silakan gunakan nomor lain atau login.
              </Text>
            </View>
          )}

          {/* OTP Input with "Verifikasi" button */}
          <View style={styles.inputWithButton}>
            <TextInput
              style={styles.txtInputWithButton}
              placeholderTextColor="grey" 
              placeholder="OTP"
              value={inputan.otp}
              onChangeText={(e) => setInput({ ...inputan, otp: e })}  
              keyboardType="numeric"
              editable={!phoneExists} // Disable jika nomor HP sudah ada
            />
            {inputan.otp && !phoneExists ?
              otpVerif == false ?
                <TouchableOpacity style={styles.btnVerifyOtp} onPress={handleVerifyOtp}>
                  <Text style={styles.btnText}>Verifikasi</Text>
                </TouchableOpacity>
              :
                <FontAwesomeIcon5 name="check" size={25} color="green" style={{marginLeft: 10}} />
              :
              null
            }
          </View>

          {/* Password Input */}
          <TextInput
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Password"
            value={inputan.password}
            onChangeText={(e) => setInput({ ...inputan, password: e })}  
            secureTextEntry
          />

          {/* Re-enter Password Input */}
          <TextInput
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Re-enter Password"
            value={inputan.verifpassword}
            onChangeText={(e) => setInput({ ...inputan, verifpassword: e })}  
            secureTextEntry
          />

          {inputan.verifpassword !== "" && inputan.verifpassword !== inputan.password ?
            <Text style={styles.verifText}>Input sesuai dengan Password</Text>
            :
            null
          }

          {/* Company Code Input with Validation Button */}
          <View style={styles.inputWithButton}>
            <TextInput
              style={styles.txtInputWithButton}
              placeholderTextColor="grey" 
              placeholder="Company Code (Opsional)"
              value={inputan.companycode}
              onChangeText={(e) => setInput({ ...inputan, companycode: e.toUpperCase() })}
            />
            {inputan.companycode !== "" ?
              companyCodeLoading ? (
                <ActivityIndicator size="small" color="#7F6000" style={{marginLeft: 10}} />
              ) : companyCodeValid ? (
                <FontAwesomeIcon5 name="check" size={25} color="green" style={{marginLeft: 10}} />
              ) : (
                <TouchableOpacity style={styles.btnValidateCode} onPress={validateCompanyCode}>
                  <Text style={styles.btnText}>Validasi</Text>
                </TouchableOpacity>
              )
              :
              null
            }
          </View>

          {/* Company Code Status */}
          {companyCodeValid && companyName && (
            <View style={styles.companyCodeSuccess}>
              <FontAwesomeIcon5 name="building" size={16} color="#27ae60" />
              <Text style={styles.companyCodeSuccessText}>
                Valid untuk {companyName} - Status: TemanLoffee + Bonus 1000 Poin!
              </Text>
            </View>
          )}

          {/* Show error if company code was checked but invalid */}
          {companyCodeChecked && !companyCodeValid && inputan.companycode && (
            <View style={styles.companyCodeError}>
              <FontAwesomeIcon5 name="times-circle" size={16} color="#e74c3c" />
              <Text style={styles.companyCodeErrorText}>
                Company code tidak valid. Silakan coba lagi atau lanjutkan tanpa company code.
              </Text>
            </View>
          )}

          {loading ? 
            <ActivityIndicator size="large" color="black" /> :
            <TouchableOpacity 
              style={[
                styles.btnSignUp,
                (!otpVerif || 
                 inputan.password !== inputan.verifpassword || 
                 phoneExists || 
                 calculateAge(inputan.birthDate) < 13 ||
                 !inputan.gender) && styles.btnSignUpDisabled
              ]} 
              onPress={handleRegister}
              disabled={!otpVerif || 
                       inputan.password !== inputan.verifpassword || 
                       phoneExists || 
                       calculateAge(inputan.birthDate) < 13 ||
                       !inputan.gender}
            >
              <Text style={styles.btnText}>Sign Up</Text>
            </TouchableOpacity>
          }

          <View style={{flexDirection: 'row', alignSelf: 'center'}}>
            <Text style={styles.descHead}>{'Trouble for signup?'}</Text>
            <Text 
              onPress={() => dataSetting[0] && Linking.openURL('https://wa.me/' + dataSetting[0].no_wa)}
              style={styles.contactUsText}>
              Contact Us
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  txtHead: {color: '#7F6000', marginLeft: 16, fontFamily: 'Poppins-Bold', fontSize: 14, marginTop: 16,},
  txtInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    color: 'black',
    marginTop: 5,
    padding: 10
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  txtInputWithButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    color: 'black',
    flex: 1,
    padding: 10
  },
  txtInputError: {
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  // Gender Styles
  genderContainer: {
    marginBottom: 8,
    marginTop: 5,
  },
  genderLabel: {
    color: '#7F6000',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  genderButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: '#7F6000',
    borderColor: '#7F6000',
  },
  genderButtonText: {
    color: '#7F6000',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
  genderButtonTextActive: {
    color: 'white',
  },
  // Date Picker Styles
  datePickerButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 5,
    padding: 10,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    color: 'black',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  ageText: {
    color: '#7F6000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ageWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  ageWarningText: {
    color: '#721c24',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
    flex: 1,
  },
  btnKirimOtp: {
    backgroundColor: '#7F6000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  btnVerifyOtp: {
    backgroundColor: '#7F6000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  btnValidateCode: {
    backgroundColor: '#7F6000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  btnSignUp: {
    backgroundColor: '#7F6000',
    width: '100%',
    height: 40,
    marginBottom: 14,
    borderRadius: 8,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSignUpDisabled: {
    backgroundColor: '#cccccc',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  verifText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 8,
  },
  descHead: {color: '#7F6000', fontSize: 14, fontFamily: 'Poppins-Medium', marginBottom: 30, marginTop: 10, textAlign: 'center'},
  contactUsText: {
    fontSize: 14,
    marginTop: 10,
    marginLeft: 5,
    color: '#7F6000',
  },
  companyCodeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  companyCodeSuccessText: {
    color: '#155724',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
    flex: 1,
  },
  companyCodeError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  companyCodeErrorText: {
    color: '#721c24',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
    flex: 1,
  },
  phoneExistsError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  phoneExistsErrorText: {
    color: '#721c24',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
    flex: 1,
  },
});