/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import background
import BgHeader from '../../assets/bgheaderbump.png';
import { API_URL } from '../../context/APIUrl';

const PayslipScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData?.user?.id) {
      loadPayslips();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@dataSelf');
      if (data) {
        const parsedData = JSON.parse(data);
        console.log('parsingdata', parsedData);
        
        setUserData(parsedData || {});
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

 const loadPayslips = async () => {
  try {
    setLoading(true);

    const response = await fetch(
      `${API_URL}/api/payslips?employee_id=${userData.user.employee_id}`
    );

    if (response.ok) {
      const result = await response.json();
      setPayslips(result.payslips || []);
    } else {
      console.log('Failed to load payslips, status:', response.status);
      setPayslips([]);
    }
  } catch (error) {
    console.log('Error loading payslips:', error);
    setPayslips([]);
  } finally {
    setLoading(false);
  }
};


  const downloadPDF = async (payslipId) => {
    try {
      setDownloadingId(payslipId);
      
      const url = `${API_URL}/api/payslips/${payslipId}/pdf`;
      
      // Untuk React Native, kita bisa open URL di browser
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Tidak dapat membuka PDF');
      }
    } catch (error) {
      console.log('Error downloading PDF:', error);
      Alert.alert('Error', 'Gagal mendownload PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'draft':
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Dibayar';
      case 'pending':
        return 'Menunggu';
      case 'draft':
        return 'Draft';
      default:
        return status || 'Aktif';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
        <ActivityIndicator size="large" color="#5EC898" />
        <Text style={styles.loadingText}>Memuat data payslip...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <ImageBackground source={BgHeader} style={styles.headerBackground}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payslip Gaji</Text>
          <View style={styles.placeholder} />
        </View>
      </ImageBackground>

      {/* Content */}
    
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FontAwesome5 name="file-invoice-dollar" size={24} color="#5EC898" />
            <Text style={styles.infoTitle}>Slip Gaji Saya</Text>
          </View>
          <Text style={styles.infoSubtitle}>
            Berikut adalah daftar slip gaji Anda. Klik tombol download untuk mengunduh PDF.
          </Text>
        </View>

        {/* Payslip List */}
        {payslips.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="file-alt" size={60} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Belum Ada Payslip</Text>
            <Text style={styles.emptySubtitle}>
              Payslip Anda akan muncul di sini setelah diproses oleh HRD
            </Text>
          </View>
        ) : (
          payslips.map((payslip, index) => (
            <View key={payslip.id} style={styles.payslipCard}>
              <View style={styles.payslipHeader}>
                <View style={styles.payslipInfo}>
                  <Text style={styles.payslipPeriod}>
                    Periode: {formatDate(payslip.period_start)} - {formatDate(payslip.period_end)}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payslip.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(payslip.status)}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.downloadButton, downloadingId === payslip.id && styles.downloadingButton]}
                  onPress={() => downloadPDF(payslip.id)}
                  disabled={downloadingId === payslip.id}
                >
                  {downloadingId === payslip.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <FontAwesome5 name="download" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.payslipDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gaji Pokok:</Text>
                  <Text style={styles.detailValue}>Rp {formatCurrency(payslip.basic_salary)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Pendapatan:</Text>
                  <Text style={[styles.detailValue, styles.positiveAmount]}>
                    Rp {formatCurrency(payslip.total_earnings)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Potongan:</Text>
                  <Text style={[styles.detailValue, styles.negativeAmount]}>
                    Rp {formatCurrency(payslip.total_deductions)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pajak:</Text>
                  <Text style={[styles.detailValue, styles.negativeAmount]}>
                    Rp {formatCurrency(payslip.tax)}
                  </Text>
                </View>
                
                <View style={styles.separator} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.netSalaryLabel}>Gaji Bersih:</Text>
                  <Text style={styles.netSalaryValue}>
                    Rp {formatCurrency(payslip.net_salary)}
                  </Text>
                </View>
              </View>

              <View style={styles.payslipFooter}>
                <Text style={styles.footerText}>
                  Dibuat: {formatDate(payslip.created_at)}
                </Text>
                {payslip.notes && (
                  <Text style={styles.notesText}>
                    Catatan: {payslip.notes}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* Help Section */}
        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <FontAwesome5 name="question-circle" size={20} color="#FF9800" />
            <Text style={styles.helpTitle}>Butuh Bantuan?</Text>
          </View>
          <Text style={styles.helpText}>
            Jika ada pertanyaan tentang payslip atau mengalami masalah dalam download, 
            hubungi HRD melalui WhatsApp.
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => Linking.openURL('https://wa.me/6285336666193')}
          >
            <FontAwesome5 name="whatsapp" size={16} color="white" />
            <Text style={styles.helpButtonText}>Hubungi HRD</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

    </View>
    
  );
};

export default PayslipScreen;

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
  headerBackground: {
    height: 100,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 0,
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
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 30
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  payslipCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  payslipInfo: {
    flex: 1,
  },
  payslipPeriod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#5EC898',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  downloadingButton: {
    backgroundColor: '#A5D6A7',
  },
  payslipDetails: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#FF6B6B',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  netSalaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  netSalaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5EC898',
  },
  payslipFooter: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  helpCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  helpButton: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 20,
  },
});