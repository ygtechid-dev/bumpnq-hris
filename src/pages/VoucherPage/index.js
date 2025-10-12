import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Image,
  Modal as ReactModal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Modal } from 'react-native-paper'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import axios from 'axios'
import { Buffer } from 'buffer'
import { API_URL } from '../../context/APIUrl'

// Asset imports
import LogoQRIS from '../../assets/qris.png'
import LogoBCA from '../../assets/logobca.png'
import LogoBNI from '../../assets/logobni.jpg'
import LogoGopay from '../../assets/logogopay.png'
import ICwait from '../../assets/iconwait.png'

// Constants
const API_BASE_URL = `${API_URL}/api`
const MIDTRANS_SERVER_KEY = 'Mid-server-QvzOpNOLQzsX6uo8yxWt22pl'
const MIDTRANS_URL = 'https://api.midtrans.com/v2/charge'
const PAYMENT_TIMEOUT = 600 // 10 minutes

const VoucherPage = ({ navigation }) => {
  // ==================== STATE MANAGEMENT ====================
  const [activeTab, setActiveTab] = useState('VOUCHER_SAYA')
  const [combinedVouchers, setCombinedVouchers] = useState([])
  const [voucherShop, setVoucherShop] = useState([])
  const [dataFindSelf, setDataFindSelf] = useState({})
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal states
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [visiblePayment, setVisiblePayment] = useState(false)
  
  // Selected items
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [selectedPurchaseVoucher, setSelectedPurchaseVoucher] = useState(null)
  
  // Payment related
  const [dataPembayaran, setDataPembayaran] = useState({})
  const [kodePembayaran, setKodePembayaran] = useState('')
  const [seconds, setSeconds] = useState(PAYMENT_TIMEOUT)

  // NEW: Flash sale countdown states
  const [flashSaleCountdowns, setFlashSaleCountdowns] = useState({})

  // NEW: User purchase history for buy_once validation
  const [userPurchaseHistory, setUserPurchaseHistory] = useState([])

  // ==================== LIFECYCLE HOOKS ====================
  useEffect(() => {
    getUserData()
  }, [])

  useEffect(() => {
    if (dataFindSelf.uid) {
      loadCombinedVouchers()
      if (activeTab === 'BELI_VOUCHER') {
        loadVoucherShop()
      }
    }
  }, [dataFindSelf, activeTab])

  useEffect(() => {
    let interval
    if (visiblePayment && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => prev - 1)
      }, 1000)
    } else if (visiblePayment && seconds <= 0) {
      handleTimeUp()
    }
    return () => clearInterval(interval)
  }, [seconds, visiblePayment])

  // NEW: Flash sale countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashSaleCountdowns(prev => {
        const updated = { ...prev }
        let hasChanges = false
        
        Object.keys(updated).forEach(voucherId => {
          if (updated[voucherId] > 0) {
            updated[voucherId] = updated[voucherId] - 1
            hasChanges = true
          }
        })
        
        return hasChanges ? updated : prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // ==================== DATA LOADING FUNCTIONS ====================
  const getUserData = async () => {
    try {
      const getData = await AsyncStorage.getItem('@dataSelf')
      if (getData) {
        const parsingData = JSON.parse(getData)
        setDataFindSelf(parsingData[0] || {})
      }
    } catch (error) {
      console.error('Error getting user data:', error)
    }
  }

  // NEW: Load user purchase history for buy_once validation
  const loadUserPurchaseHistory = async () => {
    if (!dataFindSelf.uid) return
    
    try {
      const response = await axios.get(`${API_BASE_URL}/voucher-purchase-history/${dataFindSelf.uid}`)
      if (response.data.status === 'success') {
        setUserPurchaseHistory(response.data.data)
      }
    } catch (error) {
      console.error('Error loading user purchase history:', error)
      // Don't show alert for this, as it's not critical
    }
  }

 const loadCombinedVouchers = async () => {
  if (!dataFindSelf.uid) return
  
  setLoading(true)
  try {
    const response = await axios.get(`${API_BASE_URL}/vouchers/combined/${dataFindSelf.uid}`)
    if (response.data.status === 'success') {
      const rawVouchers = response.data.data

      // NEW: Sorting vouchers dengan status used di paling bawah
      const sortedVouchers = rawVouchers.sort((a, b) => {
        // Get status for both vouchers
        const aStatus = a.current_status || a.status
        const bStatus = b.current_status || b.status
        const now = new Date()
        const aExpired = new Date(a.expired_date) < now
        const bExpired = new Date(b.expired_date) < now

        // Determine final status considering expiration
        const aFinalStatus = aStatus === 'used' ? 'used' : 
                            (aStatus === 'expired' || aExpired) ? 'expired' : 
                            aStatus === 'unused' ? 'unused' : 'inactive'
        
        const bFinalStatus = bStatus === 'used' ? 'used' : 
                            (bStatus === 'expired' || bExpired) ? 'expired' : 
                            bStatus === 'unused' ? 'unused' : 'inactive'

        // Priority order: unused -> expired -> used
        const statusPriority = {
          'unused': 1,    // Paling atas (bisa digunakan)
          'expired': 2,   // Tengah (tidak bisa digunakan tapi belum used)
          'used': 3       // Paling bawah (sudah digunakan)
        }

        const aPriority = statusPriority[aFinalStatus] || 4
        const bPriority = statusPriority[bFinalStatus] || 4

        // Sort by status priority first
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }

        // If same status, sort by date (newest first)
        const dateA = new Date(a.purchase_date || a.created_at || 0)
        const dateB = new Date(b.purchase_date || b.created_at || 0)
        return dateB - dateA
      })

      setCombinedVouchers(sortedVouchers)
    }
  } catch (error) {
    console.error('Error loading combined vouchers:', error.response)
    await loadFallbackVouchers()
  } finally {
    setLoading(false)
  }
}

const loadVoucherShop = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/voucher-shops`);
    
    if (response.data.status === 'success') {
      const allVouchers = response.data.data;

      // Filter berdasarkan membership
      const filtered = allVouchers.filter(voucher => {
        return (
          !voucher.membership_type || // voucher untuk semua
          voucher.membership_type === dataFindSelf.membership_status || voucher.membership_type == "SemuaMember" // voucher sesuai member
        );
      });

      // NEW: Function untuk mengecek apakah user bisa membeli voucher
      const checkCanPurchase = (voucherShopItem) => {
        if (!voucherShopItem.buy_once) return true
        
        // Check from allVouchers using title matching and user_id
        const hasPurchased = allVouchers.some(voucher => 
          voucher.title === voucherShopItem.title && 
          voucher.firebase_uid === dataFindSelf.uid &&
          (voucher.current_status === 'unused' || voucher.current_status === 'used' || voucher.status === 'unused' || voucher.status === 'used')
        )
        
        return !hasPurchased
      }

      // NEW: Sorting vouchers dengan !canPurchase di paling bawah
      const sortedVouchers = filtered.sort((a, b) => {
        // First: Check purchase status - voucher yang bisa dibeli di atas
        const aCanPurchase = checkCanPurchase(a)
        const bCanPurchase = checkCanPurchase(b)
        
        if (aCanPurchase && !bCanPurchase) return -1  // a bisa dibeli, b tidak bisa -> a di atas
        if (!aCanPurchase && bCanPurchase) return 1   // a tidak bisa dibeli, b bisa -> b di atas
        
        // Second: If both have same purchase status, sort by flash sale
        const now = new Date()
        const aFlashSaleEnd = a.flash_sale_end ? new Date(a.flash_sale_end) : null
        const bFlashSaleEnd = b.flash_sale_end ? new Date(b.flash_sale_end) : null
        
        const aIsActiveFlashSale = a.is_flash_sale === true && 
                                  aFlashSaleEnd && 
                                  aFlashSaleEnd > now
        const bIsActiveFlashSale = b.is_flash_sale === true && 
                                  bFlashSaleEnd && 
                                  bFlashSaleEnd > now
        
        if (aIsActiveFlashSale && !bIsActiveFlashSale) return -1
        if (!aIsActiveFlashSale && bIsActiveFlashSale) return 1
        
        // Third: Sort by price
        const aPrice = a.point_price || 0
        const bPrice = b.point_price || 0
        return aPrice - bPrice
      })

      setVoucherShop(sortedVouchers);
      
      // NEW: Initialize flash sale countdowns
      initializeFlashSaleCountdowns(sortedVouchers);
    }
  } catch (error) {
    console.error('Error loading voucher shop:', error);
    Alert.alert('Error', 'Gagal memuat voucher shop');
  }
};

  const loadFallbackVouchers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchased-vouchers/${dataFindSelf.uid}`)
      if (response.data.status === 'success') {
        const transformedData = response.data.data.map(voucher => ({
          ...voucher,
          type: 'voucher',
          source: 'purchased_vouchers'
        }))
        setCombinedVouchers(transformedData)
      }
    } catch (error) {
      console.error('Error loading fallback vouchers:', error)
      Alert.alert('Error', 'Gagal memuat voucher')
    }
  }

  

  // NEW: Initialize flash sale countdowns
  const initializeFlashSaleCountdowns = (vouchers) => {
    const countdowns = {}
    const now = new Date()
    
    vouchers.forEach(voucher => {
      if (voucher.is_flash_sale && voucher.flash_sale_end) {
        const endTime = new Date(voucher.flash_sale_end)
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000))
        countdowns[voucher.id] = timeLeft
      }
    })
    
    setFlashSaleCountdowns(countdowns)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadCombinedVouchers()
    if (activeTab === 'BELI_VOUCHER') {
      await loadVoucherShop()
    }
    setRefreshing(false)
  }

  // ==================== VOUCHER ACTIONS ====================
  const useVoucher = (voucher) => {
    if (voucher.type !== 'voucher') {
      Alert.alert('Info', 'Item ini adalah history pembelian, bukan voucher yang bisa digunakan')
      return
    }
    setSelectedVoucher(voucher)
    setShowVoucherModal(true)
  }

  const copyVoucherCode = () => {
    if (selectedVoucher?.voucher_code) {
      Clipboard.setString(selectedVoucher.voucher_code)
      Alert.alert('Berhasil', 'Kode voucher telah disalin!')
    }
  }

  const confirmUseVoucher = async () => {
    if (!selectedVoucher?.voucher_code) return

    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin menggunakan voucher ${selectedVoucher.voucher_code}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Gunakan', 
          onPress: handleVoucherUse
        }
      ]
    )
  }

  const handleVoucherUse = async () => {
    setShowVoucherModal(false)
    setLoading(true)
    
    try {
      const response = await axios.post(`${API_BASE_URL}/purchased-vouchers/use`, {
        voucher_code: selectedVoucher.voucher_code,
        user_id: dataFindSelf.uid,
        order_id: `ORDER-${Date.now()}`
      })
      
      if (response.data.status === 'success') {
        Alert.alert('Sukses', 'Voucher berhasil digunakan!')
        loadCombinedVouchers()
      } else {
        Alert.alert('Error', response.data.message)
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menggunakan voucher')
      console.error('Error using voucher:', error.response)
    } finally {
      setLoading(false)
    }
  }

  // ==================== PURCHASE FUNCTIONS ====================
 const purchaseVoucher = (voucherShopItem) => {
  // UPDATED: Check buy_once validation using combinedVouchers
  if (voucherShopItem.buy_once) {
    const hasPurchased = combinedVouchers.some(voucher => 
      voucher.title === voucherShopItem.title && 
      voucher.user_id === dataFindSelf.uid &&
      (voucher.status === 'completed' || voucher.status === 'pending' || voucher.type === 'voucher')
    )
    
    if (hasPurchased) {
      Alert.alert(
        'Tidak Dapat Membeli', 
        'Anda sudah pernah membeli voucher ini sebelumnya. Voucher ini hanya dapat dibeli sekali per user.',
        [{ text: 'OK' }]
      )
      return
    }
  }

  // Check if flash sale is still active
  if (voucherShopItem.is_flash_sale) {
    const countdown = flashSaleCountdowns[voucherShopItem.id]
    if (countdown <= 0) {
      Alert.alert(
        'Flash Sale Berakhir', 
        'Maaf, flash sale untuk voucher ini sudah berakhir.',
        [{ text: 'OK' }]
      )
      return
    }
  }

  setSelectedPurchaseVoucher(voucherShopItem)
  setShowPaymentMethodModal(true)
}

  const createMidtransTransaction = async (paymentType) => {
    if (!selectedPurchaseVoucher) return

    try {
      const userData = await AsyncStorage.getItem('@dataSelf')
      const parsingData = JSON.parse(userData)
      
      setLoading(true)
      setShowPaymentMethodModal(false)
      setVisiblePayment(true)
      
      const orderId = `VOUCHER-${Date.now()}-${dataFindSelf.uid}`
      setKodePembayaran(orderId)
      setSeconds(PAYMENT_TIMEOUT)
      
      // PERBAIKAN: Ubah kondisi flash sale dari is_flash_sale_active ke is_flash_sale
      const grossAmount = selectedPurchaseVoucher.is_flash_sale 
        ? selectedPurchaseVoucher.flash_sale_price 
        : selectedPurchaseVoucher.current_price
      
      const transactionData = buildTransactionData(paymentType, orderId, grossAmount, parsingData[0])
      const response = await submitMidtransTransaction(transactionData)
      
      setDataPembayaran(response.data)
      console.log('ddddaaaMIDTTTRR', response.data);
      
      await savePurchaseRecord(orderId, response.data, grossAmount)
      
    } catch (error) {
      setLoading(false)
      setVisiblePayment(false)
      console.error('Error creating transaction:', error)
      Alert.alert('Error', 'Gagal membuat pembayaran')
    } finally {
      setLoading(false)
    }
  }

  const buildTransactionData = (paymentType, orderId, grossAmount, userInfo) => {
    const currentTime = new Date()
    const orderTime = currentTime.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }) + ' +0700'
    
    const baseData = {
      transaction_details: {
        gross_amount: grossAmount,
        order_id: orderId
      },
      customer_details: {
        email: userInfo.email || `${userInfo.handphone}@email.com`,
        first_name: userInfo.namaLengkap,
        last_name: '',
        phone: userInfo.handphone
      },
      item_details: [{
        id: selectedPurchaseVoucher.id.toString(),
        price: grossAmount,
        quantity: 1,
        name: selectedPurchaseVoucher.title
      }]
    }

    if (paymentType === 'bca' || paymentType === 'bni') {
      return {
        payment_type: 'bank_transfer',
        ...baseData,
        bank_transfer: {
          bank: paymentType,
          va_number: '111111'
        },
        custom_expiry: {
          order_time: orderTime,
          expiry_duration: 10,
          unit: 'minutes'
        }
      }
    } else {
      return {
        payment_type: paymentType,
        ...baseData,
        ...(paymentType === 'qris' ? { qris: { acquirer: 'gopay' }} : {}),
        ...(paymentType === 'gopay' ? { gopay: { acquirer: 'gopay' }} : {})
      }
    }
  }

  const submitMidtransTransaction = async (transactionData) => {
    const base64Key = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')
    
    return await axios.post(MIDTRANS_URL, transactionData, {
      headers: {
        Authorization: `Basic ${base64Key}`,
        'Content-Type': 'application/json'
      }
    })
  }

  const savePurchaseRecord = async (orderId, midtransResponse, amount) => {
    const voucherPurchaseData = {
      user_id: dataFindSelf.uid,
      voucher_shop_id: selectedPurchaseVoucher.id,
      quantity: 1,
      midtrans_order_id: orderId,
      midtrans_transaction_id: midtransResponse.transaction_id,
      amount: amount,
      status: midtransResponse.transaction_status,
      payment_type: midtransResponse.payment_type
    }

    try {
      await axios.post(`${API_BASE_URL}/voucher-purchase-midtrans`, voucherPurchaseData)
    } catch (error) {
      console.error('Error saving purchase record:', error)
    }
  }

  // ==================== PAYMENT STATUS FUNCTIONS ====================
  const fetchTransactionStatus = async () => {
    try {
      const response = await axios.get(`https://api.midtrans.com/v2/${kodePembayaran}/status`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')}`
        }
      })

      await handleTransactionStatus(response.data)
    } catch (error) {
      console.error('Error checking payment status:', error)
      Alert.alert('Error', 'Gagal mengecek status pembayaran')
    }
  }

  const handleTransactionStatus = async (transactionData) => {
    const { transaction_status } = transactionData
    
    switch (transaction_status) {
      case 'pending':
        Alert.alert('Pembayaran Pending', 'Pembayaran belum diterima. Silahkan melakukan pembayaran ke nomor yang tertera')
        break
        
      case 'settlement':
      case 'capture':
        Alert.alert('Pembayaran Berhasil!', 'Voucher akan segera diproses ke akun Anda')
        await completeVoucherPurchase(transaction_status)
        break
        
      case 'cancel':
      case 'expire':
      case 'failure':
        Alert.alert('Pembayaran Gagal', 'Transaksi dibatalkan atau gagal')
        resetPaymentState()
        break
    }
  }

 const completeVoucherPurchase = async (transactionStatus) => {
  try {
    await axios.post(`${API_BASE_URL}/voucher-purchase/complete-midtrans`, {
      midtrans_order_id: kodePembayaran,
      transaction_status: transactionStatus
    })
    
    resetPaymentState()
    loadCombinedVouchers()
    loadVoucherShop()
    // REMOVED: loadUserPurchaseHistory() - tidak lagi diperlukan
  } catch (error) {
    console.error('Error completing purchase:', error)
  }
}

  const handleTimeUp = () => {
    Alert.alert('Waktu Habis!', 'Waktu pembayaran telah habis. Silahkan coba lagi.')
    resetPaymentState()
  }

  const resetPaymentState = () => {
    setVisiblePayment(false)
    setDataPembayaran({})
    setSeconds(PAYMENT_TIMEOUT)
  }

  // ==================== CANCEL PAYMENT FUNCTION ====================
  const cancelPayment = () => {
    Alert.alert(
      'Batalkan Pembayaran',
      'Apakah Anda yakin ingin membatalkan pembayaran ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        { 
          text: 'Ya, Batalkan', 
          style: 'destructive',
          onPress: resetPaymentState
        }
      ]
    )
  }

  // ==================== UTILITY FUNCTIONS ====================
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const secs = time % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  // NEW: Format countdown time for flash sale
  const formatCountdownTime = (seconds) => {
    if (seconds <= 0) return 'Berakhir'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getLogo = (paymentType) => {
    const logos = {
      bca: LogoBCA,
      bni: LogoBNI,
      gopay: LogoGopay,
      qris: LogoQRIS
    }
    return logos[paymentType] || null
  }

  const getStatusColor = (status, expiredDate, type) => {
    if (type === 'purchase') {
      const statusColors = {
        completed: '#28a745',
        pending: '#ffc107',
        failed: '#dc3545',
        cancelled: '#6c757d'
      }
      return statusColors[status] || '#17a2b8'
    }
    
    const now = new Date()
    const expired = new Date(expiredDate)
    
    if (status === 'used') return '#95a5a6'
    if (status === 'expired' || expired < now) return '#e74c3c'
    if (status === 'unused') return '#27ae60'
    return '#f39c12'
  }

  const getStatusText = (status, expiredDate, type) => {
    if (type === 'purchase') {
      const statusTexts = {
        completed: 'Selesai',
        pending: 'Menunggu',
        failed: 'Gagal',
        cancelled: 'Dibatalkan'
      }
      return statusTexts[status] || 'Proses'
    }
    
    const now = new Date()
    const expired = new Date(expiredDate)
    
    if (status === 'used') return 'Sudah Digunakan'
    if (status === 'expired' || expired < now) return 'Kadaluarsa'
    if (status === 'unused') return 'Aktif'
    return 'Tidak Aktif'
  }

  // NEW: Check if user can buy voucher (buy_once validation)
  const canPurchaseVoucher = (voucherShopItem) => {
  if (!voucherShopItem.buy_once) return true
  
  // Check from combinedVouchers instead of userPurchaseHistory
  const hasPurchased = combinedVouchers.some(voucher => 
    voucher.title === voucherShopItem.title && 
    voucher.user_id === dataFindSelf.uid &&
    (voucher.status === 'completed' || voucher.status === 'pending' || voucher.type === 'voucher')
  )
  
  return !hasPurchased
}

  // ==================== RENDER COMPONENTS ====================
  const CombinedVoucherCard = ({ item }) => {
    const statusColor = getStatusColor(item.status, item.expired_date, item.type)
    const statusText = getStatusText(item.status, item.expired_date, item.type)
    const isUsable = item.type === 'voucher' && item.status === 'unused' && new Date(item.expired_date) > new Date()

    return (
      <View style={styles.voucherCard}>
        <View style={styles.voucherHeader}>
          <View style={styles.voucherInfo}>
            <Text style={styles.voucherTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.voucherAmount}>{formatRupiah(item.nominal)}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.typeBadge, { 
              backgroundColor: item.type === 'voucher' ? '#9b59b6' : '#17a2b8' 
            }]}>
              <Text style={styles.typeBadgeText}>
                {item.type === 'voucher' ? 'VOUCHER' : 'PEMBELIAN'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.voucherDetails}>
          {item.type === 'voucher' ? (
            <VoucherDetails item={item} />
          ) : (
            <PurchaseDetails item={item} />
          )}
        </View>
        
        {/* {isUsable && (
          <TouchableOpacity style={styles.useButton} onPress={() => useVoucher(item)}>
            <Text style={styles.useButtonText}>Gunakan Voucher</Text>
          </TouchableOpacity>
        )} */}
      </View>
    )
  }

  const VoucherDetails = ({ item }) => (
    <>
      <Text style={styles.voucherCode}>{item.voucher_code}</Text>
      <Text style={styles.detailText}>Berlaku hingga: {formatDate(item.expired_date)}</Text>
      <Text style={styles.detailText}>Dibeli: {formatDate(item.purchase_date)}</Text>
      <Text style={styles.purchaseAmount}>Harga beli: {formatRupiah(item.purchase_amount)}</Text>
      {item.used_date && (
        <Text style={styles.detailText}>Digunakan: {formatDate(item.used_date)}</Text>
      )}
      {item.min_transaction > 0 && (
        <Text style={styles.minTransaction}>
          Min. transaksi: {formatRupiah(item.min_transaction)}
        </Text>
      )}
    </>
  )

  const PurchaseDetails = ({ item }) => (
    <>
      <Text style={styles.purchaseInfo} numberOfLines={1}>Order ID: {item.midtrans_order_id}</Text>
      <Text style={styles.detailText}>Tanggal: {formatDate(item.created_at)}</Text>
      <Text style={styles.purchaseAmount}>Total: {formatRupiah(item.amount)}</Text>
      <Text style={styles.paymentMethod}>Metode: {item.payment_type?.toUpperCase()}</Text>
      {item.completed_at && (
        <Text style={styles.detailText}>Selesai: {formatDate(item.completed_at)}</Text>
      )}
    </>
  )

  const VoucherShopCard = ({ item }) => {
    // PERBAIKAN: Ubah kondisi flash sale dari is_flash_sale_active ke is_flash_sale
    const isFlashSale = item.is_flash_sale === true
    const countdown = flashSaleCountdowns[item.id] || 0
    const isFlashSaleActive = isFlashSale && countdown > 0
    const canPurchase = canPurchaseVoucher(item)
    const isFlashSaleEnded = isFlashSale && countdown <= 0
    
    return (
      <View style={[styles.shopCard, isFlashSaleEnded && styles.shopCardDisabled]}>
        {isFlashSale && (
          <View style={[styles.flashSaleBanner, isFlashSaleEnded && styles.flashSaleBannerEnded]}>
            <Text style={styles.flashSaleText}>
              {isFlashSaleActive ? `⚡ FLASH SALE ⚡` : '⏰ FLASH SALE BERAKHIR'}
            </Text>
            {isFlashSaleActive && (
              <Text style={styles.flashSaleCountdown}>
                Berakhir dalam: {formatCountdownTime(countdown)}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.shopCardContent}>
          <View style={styles.shopCardHeader}>
            <View style={styles.shopCardInfo}>
              <Text style={styles.shopCardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.shopCardDescription} numberOfLines={3}>{item.description}</Text>
              <Text style={styles.shopCardAmount}>{formatRupiah(item.nominal)}</Text>
            </View>
            
            <View style={styles.shopCardPricing}>
              {isFlashSaleActive && item.price !== item.current_price && (
                <Text style={styles.originalPrice}>{formatRupiah(item.price)}</Text>
              )}
              <Text style={[styles.priceText, isFlashSaleEnded && styles.priceTextDisabled]}>
                {formatRupiah(isFlashSaleActive ? item.flash_sale_price : item.current_price)}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText} numberOfLines={1}>{item.category}</Text>
              </View>
            </View>
          </View>
          
          {item.terms_conditions && (
            <Text style={styles.termsText} numberOfLines={3}>
              S&K: {item.terms_conditions}
            </Text>
          )}

          {/* NEW: Buy once indicator */}
          {item.buy_once && (
            <View style={styles.buyOnceIndicator}>
              <FontAwesome5 name="exclamation-triangle" size={12} color="#856404" />
              <Text style={styles.buyOnceText}>Hanya bisa dibeli sekali per user</Text>
            </View>
          )}

          {/* NEW: Already purchased indicator */}
          {item.buy_once && !canPurchase && (
            <View style={styles.alreadyPurchasedIndicator}>
              <FontAwesome5 name="check-circle" size={12} color="#155724" />
              <Text style={styles.alreadyPurchasedText}>Anda sudah membeli voucher ini</Text>
            </View>
          )}
          
     <TouchableOpacity 
          style={[
            styles.buyButton, 
            (!canPurchase || isFlashSaleEnded) && styles.buyButtonDisabled
          ]} 
          onPress={() => purchaseVoucher(item)}
          disabled={!canPurchase || isFlashSaleEnded}
        >
          <Text style={[
            styles.buyButtonText, 
            (!canPurchase || isFlashSaleEnded) && styles.buyButtonTextDisabled
          ]}>
            {!canPurchase ? 'Sudah Dibeli' : isFlashSaleEnded ? 'Flash Sale Berakhir' : 'Beli Sekarang'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
   )
 }

 const EmptyState = ({ message }) => (
   <View style={styles.emptyState}>
     <FontAwesome5 name="receipt" size={48} color="#6c757d" style={styles.emptyIcon} />
     <Text style={styles.emptyStateText}>{message}</Text>
     <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
       <Text style={styles.refreshButtonText}>Refresh</Text>
     </TouchableOpacity>
   </View>
 )

 const PaymentMethodButton = ({ logo, text, paymentType }) => (
   <TouchableOpacity 
     style={styles.paymentMethodButton}
     onPress={() => createMidtransTransaction(paymentType)}
   >
     <Image source={logo} style={styles.paymentMethodLogo} />
     <Text style={styles.paymentMethodText}>{text}</Text>
   </TouchableOpacity>
 )

 // ==================== MAIN RENDER ====================
 const renderContent = () => {
   if (activeTab === 'VOUCHER_SAYA') {
     return (
       <View style={styles.content}>
         {combinedVouchers.length > 0 ? (
           <FlatList
             data={combinedVouchers}
             keyExtractor={(item) => `${item.source}-${item.id}`}
             renderItem={({ item }) => <CombinedVoucherCard item={item} />}
             contentContainerStyle={styles.listContainer}
             showsVerticalScrollIndicator={false}
             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
           />
         ) : (
           <EmptyState message="Kamu belum memiliki voucher apapun" />
         )}
       </View>
     )
   }
   
   return (
     <View style={styles.content}>
       {voucherShop.length > 0 ? (
         <FlatList
           data={voucherShop}
           keyExtractor={(item) => item.id.toString()}
           renderItem={({ item }) => <VoucherShopCard item={item} />}
           contentContainerStyle={styles.listContainer}
           showsVerticalScrollIndicator={false}
           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
         />
       ) : (
         <EmptyState message="Tidak ada voucher tersedia" />
       )}
     </View>
   )
 }

 return (
   <View style={styles.container}>
     {/* Header */}
     <View style={styles.header}>
       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <FontAwesome5 name="arrow-left" size={18} color="#495057" />
       </TouchableOpacity>
       <Text style={styles.headerTitle}>Voucherku</Text>
       <TouchableOpacity style={styles.historyButton}>
         <FontAwesome5 name="history" size={18} color="#495057" />
       </TouchableOpacity>
     </View>

     {/* Tab Bar */}
     <View style={styles.tabContainer}>
       <TouchableOpacity
         style={[styles.tab, activeTab === 'VOUCHER_SAYA' && styles.activeTab]}
         onPress={() => setActiveTab('VOUCHER_SAYA')}
       >
         <Text style={[styles.tabText, activeTab === 'VOUCHER_SAYA' && styles.activeTabText]}>
           VOUCHER SAYA
         </Text>
       </TouchableOpacity>
       
       <TouchableOpacity
         style={[styles.tab, activeTab === 'BELI_VOUCHER' && styles.activeTab]}
         onPress={() => setActiveTab('BELI_VOUCHER')}
       >
         <Text style={[styles.tabText, activeTab === 'BELI_VOUCHER' && styles.activeTabText]}>
           BELI VOUCHER
         </Text>
       </TouchableOpacity>
     </View>

     {/* Content */}
     {renderContent()}

     {/* Loading Modal */}
     <Modal visible={loading} transparent>
       <View style={styles.loadingOverlay}>
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#7F6000" />
           <Text style={styles.loadingText}>Loading...</Text>
         </View>
       </View>
     </Modal>

     {/* Voucher Code Modal */}
     <ReactModal
       visible={showVoucherModal}
       transparent
       animationType="fade"
       onRequestClose={() => setShowVoucherModal(false)}
     >
       <View style={styles.modalOverlay}>
         <View style={styles.modalContainer}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Kode Voucher</Text>
             <TouchableOpacity style={styles.closeButton} onPress={() => setShowVoucherModal(false)}>
               <FontAwesome5 name="times" size={18} color="#6c757d" />
             </TouchableOpacity>
           </View>
           
           {selectedVoucher && (
             <View style={styles.modalContent}>
               <View style={styles.voucherInfoModal}>
                 <Text style={styles.voucherTitleModal} numberOfLines={2}>
                   {selectedVoucher.title}
                 </Text>
                 <Text style={styles.voucherAmountModal}>
                   {formatRupiah(selectedVoucher.nominal)}
                 </Text>
               </View>
               
               <View style={styles.voucherCodeContainer}>
                 <Text style={styles.voucherCodeLabel}>Kode Voucher:</Text>
                 <View style={styles.voucherCodeBox}>
                   <Text style={styles.voucherCodeText}>{selectedVoucher.voucher_code}</Text>
                   <TouchableOpacity style={styles.copyButton} onPress={copyVoucherCode}>
                     <FontAwesome5 name="copy" size={16} color="#7F6000" />
                   </TouchableOpacity>
                 </View>
               </View>
               
               <View style={styles.voucherDetailsModal}>
                 <Text style={styles.voucherExpiryModal}>
                   Berlaku hingga: {formatDate(selectedVoucher.expired_date)}
                 </Text>
               </View>
               
               <View style={styles.modalButtons}>
                 <TouchableOpacity style={styles.cancelButton} onPress={() => setShowVoucherModal(false)}>
                   <Text style={styles.cancelButtonText}>Tutup</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.confirmButton} onPress={confirmUseVoucher}>
                   <Text style={styles.confirmButtonText}>Gunakan Sekarang</Text>
                 </TouchableOpacity>
               </View>
             </View>
           )}
         </View>
       </View>
     </ReactModal>

     {/* Payment Method Modal */}
     <ReactModal
       visible={showPaymentMethodModal}
       transparent
       animationType="fade"
       onRequestClose={() => setShowPaymentMethodModal(false)}
     >
       <View style={styles.modalOverlay}>
         <View style={styles.modalContainer}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>
             <TouchableOpacity style={styles.closeButton} onPress={() => setShowPaymentMethodModal(false)}>
               <FontAwesome5 name="times" size={18} color="#6c757d" />
             </TouchableOpacity>
           </View>
           
           {selectedPurchaseVoucher && (
             <View style={styles.modalContent}>
               <View style={styles.purchaseInfoModal}>
                 <Text style={styles.purchaseItemTitle} numberOfLines={2}>
                   {selectedPurchaseVoucher.title}
                 </Text>
                 <Text style={styles.purchaseItemNominal}>
                   Nilai: {formatRupiah(selectedPurchaseVoucher.nominal)}
                 </Text>
                 <Text style={styles.purchaseItemPrice}>
                   Harga: {formatRupiah(selectedPurchaseVoucher.is_flash_sale ? selectedPurchaseVoucher.flash_sale_price : selectedPurchaseVoucher.current_price)}
                 </Text>
               </View>
               
               <View style={styles.paymentMethodContainer}>
                 <Text style={styles.paymentMethodTitle}>Pilih Metode Pembayaran:</Text>
                 
                 <PaymentMethodButton 
                   logo={LogoQRIS} 
                   text="QRIS" 
                   paymentType="qris" 
                 />
                 <PaymentMethodButton 
                   logo={LogoBCA} 
                   text="BCA Virtual Account" 
                   paymentType="bca" 
                 />
                 <PaymentMethodButton 
                   logo={LogoBNI} 
                   text="BNI Virtual Account" 
                   paymentType="bni" 
                 />
                 <PaymentMethodButton 
                   logo={LogoGopay} 
                   text="GoPay" 
                   paymentType="gopay" 
                 />
               </View>
             </View>
           )}
         </View>
       </View>
     </ReactModal>

     {/* Payment Process Modal */}
     <Modal visible={visiblePayment}>
       {dataPembayaran.payment_type ? (
         dataPembayaran.payment_type === "bank_transfer" ? (
           <View style={styles.paymentModalContainer}>
             <View style={styles.paymentModalHeader}>
               <TouchableOpacity style={styles.cancelPaymentButton} onPress={cancelPayment}>
                 <FontAwesome5 name="times" size={18} color="#dc3545" />
               </TouchableOpacity>
             </View>
             
             <Image 
               source={dataPembayaran.va_numbers ? getLogo(dataPembayaran.va_numbers[0].bank) : null} 
               style={styles.paymentLogo} 
             />
             <Text style={styles.paymentTitle}>Virtual Account</Text>
             
             <Text style={styles.paymentTimer}>
               {`Selesaikan Pembayaran Dalam \n ${formatTime(seconds)}`}
             </Text>
             
             <Text style={styles.paymentStatusLabel}>Status</Text>
             <Text style={styles.paymentStatus}>
               {dataPembayaran.transaction_status || ""}
             </Text>
             
             <Text style={styles.paymentInstruction}>
               Silahkan melakukan pembayaran ke nomor berikut
             </Text>
             
             <Text style={styles.paymentNumber}>
               {dataPembayaran.va_numbers ? dataPembayaran.va_numbers[0].va_number : null}
             </Text>
             
             <Image source={ICwait} style={styles.waitingIcon} />
             
             <View style={styles.paymentButtonContainer}>
               <TouchableOpacity style={styles.cancelTransactionButton} onPress={cancelPayment}>
                 <Text style={styles.cancelTransactionButtonText}>Batal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.checkPaymentButton} onPress={fetchTransactionStatus}>
                 <Text style={styles.checkPaymentButtonText}>Sudah Transfer</Text>
               </TouchableOpacity>
             </View>
           </View>
         ) : (
           <View style={styles.paymentModalContainer}>
             <View style={styles.paymentModalHeader}>
               <TouchableOpacity style={styles.cancelPaymentButton} onPress={cancelPayment}>
                 <FontAwesome5 name="times" size={18} color="#dc3545" />
               </TouchableOpacity>
             </View>
             
             <Image 
               source={dataPembayaran.payment_type ? getLogo(dataPembayaran.payment_type) : null} 
               style={styles.paymentLogo} 
             />
             
             <Text style={styles.paymentTimer}>
               {`Selesaikan Pembayaran Dalam \n ${formatTime(seconds)}`}
             </Text>
             
             <Text style={styles.paymentInstruction}>
               Silahkan scan QR berikut ini
             </Text>
             
             {dataPembayaran.actions && (
               <Image 
                 source={{uri: dataPembayaran.actions[0].url}} 
                 style={styles.qrCodeImage} 
               />
             )}
             
             <View style={styles.paymentButtonContainer}>
               <TouchableOpacity style={styles.cancelTransactionButton} onPress={cancelPayment}>
                 <Text style={styles.cancelTransactionButtonText}>Batal</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.checkPaymentButton} onPress={fetchTransactionStatus}>
                 <Text style={styles.checkPaymentButtonText}>Sudah Transfer</Text>
               </TouchableOpacity>
             </View>
           </View>
         )
       ) : null}
     </Modal>
   </View>
 )
}

export default VoucherPage;

// ==================== STYLES ====================
const styles = StyleSheet.create({
 // Layout Styles
 container: {
   flex: 1,
   backgroundColor: '#f8f9fa'
 },
 content: {
   flex: 1
 },
 listContainer: {
   padding: 16
 },

 // Header Styles
 header: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   paddingHorizontal: 16,
   paddingVertical: 12,
   backgroundColor: 'white',
   borderBottomWidth: 1,
   borderBottomColor: '#e9ecef',
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.1,
   shadowRadius: 2
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
 historyButton: {
   width: 40,
   height: 40,
   justifyContent: 'center',
   alignItems: 'center',
   borderRadius: 20,
   backgroundColor: '#f8f9fa'
 },

 // Tab Styles
 tabContainer: {
   flexDirection: 'row',
   backgroundColor: 'white',
   borderBottomWidth: 1,
   borderBottomColor: '#e9ecef',
   elevation: 1
 },
 tab: {
   flex: 1,
   paddingVertical: 16,
   alignItems: 'center',
   borderBottomWidth: 3,
   borderBottomColor: 'transparent'
 },
 activeTab: {
   borderBottomColor: '#7F6000'
 },
 tabText: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#6c757d'
 },
 activeTabText: {
   color: '#7F6000',
   fontFamily: 'Poppins-Bold'
 },

 // Voucher Card Styles
 voucherCard: {
   backgroundColor: 'white',
   borderRadius: 12,
   padding: 16,
   marginBottom: 12,
   elevation: 3,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.1,
   shadowRadius: 4,
   borderWidth: 1,
   borderColor: '#e9ecef'
 },
 voucherHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'flex-start',
   marginBottom: 12
 },
 voucherInfo: {
   flex: 1,
   marginRight: 8
 },
 voucherTitle: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   marginBottom: 4,
   lineHeight: 20
 },
 voucherAmount: {
   fontSize: 20,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginBottom: 8
 },

 // Status & Type Badge Styles
 statusContainer: {
   alignItems: 'flex-end'
 },
 typeBadge: {
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 12,
   marginBottom: 4
 },
 typeBadgeText: {
   fontSize: 10,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },
 statusBadge: {
   paddingHorizontal: 10,
   paddingVertical: 6,
   borderRadius: 15,
   minWidth: 70,
   alignItems: 'center'
 },
 statusText: {
   fontSize: 10,
   fontFamily: 'Poppins-Bold',
   color: 'white',
   textTransform: 'uppercase'
 },

 // Voucher Details Styles
 voucherDetails: {
   marginBottom: 12
 },
 voucherCode: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   marginBottom: 8,
   backgroundColor: '#f8f9fa',
   padding: 10,
   borderRadius: 8,
   textAlign: 'center',
   letterSpacing: 2,
   borderWidth: 1,
   borderColor: '#dee2e6',
   borderStyle: 'dashed'
 },
 detailText: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 4
 },
 purchaseAmount: {
   fontSize: 12,
   fontFamily: 'Poppins-Medium',
   color: '#28a745',
   marginBottom: 4
 },
 purchaseInfo: {
   fontSize: 12,
   fontFamily: 'Poppins-Medium',
   color: '#495057',
   marginBottom: 4,
   backgroundColor: '#e9ecef',
   padding: 8,
   borderRadius: 6
 },
 paymentMethod: {
   fontSize: 12,
   fontFamily: 'Poppins-Medium',
   color: '#17a2b8',
   marginBottom: 4
 },
 minTransaction: {
   fontSize: 11,
   fontFamily: 'Poppins-Regular',
   color: '#dc3545',
   fontStyle: 'italic',
   backgroundColor: '#f8d7da',
   padding: 4,
   borderRadius: 4,
   marginTop: 4
 },

 // Button Styles
 useButton: {
   backgroundColor: '#7F6000',
   paddingVertical: 12,
   borderRadius: 8,
   alignItems: 'center',
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2
 },
 useButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },
 buyButton: {
   backgroundColor: '#7F6000',
   paddingVertical: 12,
   borderRadius: 8,
   alignItems: 'center',
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2
 },
 buyButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },
 buyButtonDisabled: {
   backgroundColor: '#6c757d',
   elevation: 0,
   shadowOpacity: 0
 },
 buyButtonTextDisabled: {
   color: '#adb5bd'
 },
 refreshButton: {
   backgroundColor: '#7F6000',
   paddingHorizontal: 24,
   paddingVertical: 12,
   borderRadius: 8,
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2
 },
 refreshButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: 'white'
 },

 // Shop Card Styles
 shopCard: {
   backgroundColor: 'white',
   borderRadius: 12,
   marginBottom: 12,
   elevation: 4,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.15,
   shadowRadius: 6,
   overflow: 'hidden',
   borderWidth: 1,
   borderColor: '#e9ecef'
 },
 shopCardDisabled: {
   opacity: 0.6
 },
 flashSaleBanner: {
   backgroundColor: '#e74c3c',
   paddingVertical: 8,
   paddingHorizontal: 12,
   alignItems: 'center'
 },
 flashSaleBannerEnded: {
   backgroundColor: '#6c757d'
 },
 flashSaleText: {
   fontSize: 12,
   fontFamily: 'Poppins-Bold',
   color: 'white',
   letterSpacing: 1
 },
 flashSaleCountdown: {
   fontSize: 10,
   fontFamily: 'Poppins-Medium',
   color: 'white',
   marginTop: 2
 },
 shopCardContent: {
   padding: 16
 },
 shopCardHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginBottom: 12
 },
 shopCardInfo: {
   flex: 1,
   marginRight: 12
 },
 shopCardTitle: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   marginBottom: 4,
   lineHeight: 20
 },
 shopCardDescription: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 6,
   lineHeight: 16
 },
 shopCardAmount: {
   fontSize: 18,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginBottom: 4
 },
 shopCardPricing: {
   alignItems: 'flex-end'
 },
 originalPrice: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   textDecorationLine: 'line-through',
   marginBottom: 2
 },
 priceText: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginBottom: 8
 },
 priceTextDisabled: {
   color: '#6c757d'
 },
 categoryBadge: {
   backgroundColor: '#f8f9fa',
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 12,
   borderWidth: 1,
   borderColor: '#dee2e6',
   maxWidth: 100
 },
 categoryText: {
   fontSize: 10,
   fontFamily: 'Poppins-Medium',
   color: '#495057',
   textAlign: 'center'
 },
 termsText: {
   fontSize: 11,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 12,
   fontStyle: 'italic',
   lineHeight: 14,
   backgroundColor: '#f8f9fa',
   padding: 8,
   borderRadius: 6
 },

 // NEW: Buy once and already purchased indicators
 buyOnceIndicator: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#fff3cd',
   padding: 8,
   borderRadius: 6,
   marginBottom: 8,
   borderLeftWidth: 3,
   borderLeftColor: '#ffc107'
 },
 buyOnceText: {
   fontSize: 11,
   fontFamily: 'Poppins-Medium',
   color: '#856404',
   marginLeft: 6,
   flex: 1
 },
 alreadyPurchasedIndicator: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#d4edda',
   padding: 8,
   borderRadius: 6,
   marginBottom: 8,
   borderLeftWidth: 3,
   borderLeftColor: '#28a745'
 },
 alreadyPurchasedText: {
   fontSize: 11,
   fontFamily: 'Poppins-Medium',
   color: '#155724',
   marginLeft: 6,
   flex: 1
 },

 // Empty State Styles
 emptyState: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
   paddingHorizontal: 32,
   paddingVertical: 50
 },
 emptyIcon: {
   marginBottom: 16,
   opacity: 0.5
 },
 emptyStateText: {
   fontSize: 16,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   textAlign: 'center',
   marginBottom: 20,
   lineHeight: 24
 },

 // Loading Styles
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
   alignItems: 'center',
   elevation: 5,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.25,
   shadowRadius: 4
 },
 loadingText: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#212529',
   marginTop: 8
 },

 // Modal Styles
 modalOverlay: {
   flex: 1,
   backgroundColor: 'rgba(0,0,0,0.7)',
   justifyContent: 'center',
   alignItems: 'center',
   padding: 20
 },
 modalContainer: {
   backgroundColor: 'white',
   borderRadius: 20,
   padding: 20,
   width: '100%',
   maxWidth: 380,
   maxHeight: '80%',
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 10 },
   shadowOpacity: 0.25,
   shadowRadius: 10,
   elevation: 15
 },
 modalHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 20,
   paddingBottom: 15,
   borderBottomWidth: 1,
   borderBottomColor: '#f0f0f0'
 },
 modalTitle: {
   fontSize: 20,
   fontFamily: 'Poppins-Bold',
   color: '#212529'
 },
 closeButton: {
   width: 32,
   height: 32,
   justifyContent: 'center',
   alignItems: 'center',
   borderRadius: 16,
   backgroundColor: '#f8f9fa'
 },
 modalContent: {
   alignItems: 'center'
 },

 // Voucher Modal Styles
 voucherInfoModal: {
   alignItems: 'center',
   marginBottom: 25,
   backgroundColor: '#f8f9fa',
   padding: 20,
   borderRadius: 12,
   width: '100%',
   borderWidth: 1,
   borderColor: '#e9ecef'
 },
 voucherTitleModal: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   marginBottom: 8,
   textAlign: 'center',
   lineHeight: 20
 },
 voucherAmountModal: {
   fontSize: 28,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000'
 },
 voucherCodeContainer: {
   width: '100%',
   marginBottom: 20
 },
 voucherCodeLabel: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#6c757d',
   marginBottom: 10,
   textAlign: 'center'
 },
 voucherCodeBox: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#fff',
   borderRadius: 12,
   padding: 15,
   borderWidth: 2,
   borderColor: '#7F6000',
   borderStyle: 'dashed',
   minHeight: 55
 },
 voucherCodeText: {
   flex: 1,
   fontSize: 18,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   textAlign: 'center',
   letterSpacing: 2
 },
 copyButton: {
   padding: 10,
   marginLeft: 10,
   backgroundColor: '#f8f9fa',
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#dee2e6'
 },
 voucherDetailsModal: {
   marginBottom: 25,
   padding: 15,
   backgroundColor: '#fff3cd',
   borderRadius: 8,
   width: '100%',
   borderLeftWidth: 4,
   borderLeftColor: '#ffc107'
 },
 voucherExpiryModal: {
   fontSize: 14,
   fontFamily: 'Poppins-Regular',
   color: '#856404',
   textAlign: 'center'
 },

 // Purchase Modal Styles
 purchaseInfoModal: {
   alignItems: 'center',
   marginBottom: 25,
   backgroundColor: '#f8f9fa',
   padding: 20,
   borderRadius: 12,
   width: '100%',
   borderWidth: 1,
   borderColor: '#e9ecef'
 },
 purchaseItemTitle: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   marginBottom: 8,
   textAlign: 'center',
   lineHeight: 20
 },
 purchaseItemNominal: {
   fontSize: 20,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginBottom: 4
 },
 purchaseItemPrice: {
   fontSize: 16,
   fontFamily: 'Poppins-Medium',
   color: '#495057'
 },

 // Payment Method Styles
 paymentMethodContainer: {
   width: '100%',
   marginBottom: 20
 },
 paymentMethodTitle: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#212529',
   marginBottom: 15,
   textAlign: 'center'
 },
 paymentMethodButton: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#f8f9fa',
   padding: 15,
   borderRadius: 10,
   marginBottom: 10,
   borderWidth: 2,
   borderColor: '#7F6000'
 },
 paymentMethodLogo: {
   width: 40,
   height: 30,
   marginRight: 15,
   resizeMode: 'contain'
 },
 paymentMethodText: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#212529',
   flex: 1
 },

 // Modal Button Styles
 modalButtons: {
   flexDirection: 'row',
   width: '100%',
   justifyContent: 'space-between'
 },
 cancelButton: {
   flex: 1,
   paddingVertical: 15,
   borderRadius: 10,
   backgroundColor: '#f8f9fa',
   borderWidth: 1,
   borderColor: '#dee2e6',
   alignItems: 'center',
   marginRight: 8
 },
 cancelButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#6c757d'
 },
 confirmButton: {
   flex: 1,
   paddingVertical: 15,
   borderRadius: 10,
   backgroundColor: '#7F6000',
   alignItems: 'center',
   marginLeft: 8,
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2
 },
 confirmButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },

 // Payment Modal Styles
 paymentModalContainer: {
   backgroundColor: 'white',
   width: 320,
   alignSelf: 'center',
   borderRadius: 15,
   padding: 20,
   alignItems: 'center',
   elevation: 10,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 5 },
   shadowOpacity: 0.3,
   shadowRadius: 10
 },
 paymentModalHeader: {
   width: '100%',
   flexDirection: 'row',
   justifyContent: 'flex-end',
   marginBottom: 10
 },
 cancelPaymentButton: {
   width: 36,
   height: 36,
   justifyContent: 'center',
   alignItems: 'center',
   borderRadius: 18,
   backgroundColor: '#f8f9fa',
   borderWidth: 1,
   borderColor: '#dc3545'
 },
 paymentLogo: {
   alignSelf: 'center',
   width: 120,
   height: 40,
   marginTop: 16,
   resizeMode: 'contain'
 },
 paymentTitle: {
   marginTop: 10,
   color: 'black',
   textAlign: 'center',
   fontSize: 12,
   fontFamily: 'Poppins-Bold'
 },
 paymentTimer: {
   marginTop: 5,
   textAlign: 'center',
   fontSize: 12,
   color: 'red',
   fontFamily: 'Poppins-Bold'
 },
 paymentStatusLabel: {
   marginTop: 20,
   textAlign: 'center',
   fontSize: 12,
   fontFamily: 'Poppins-Medium'
 },
 paymentStatus: {
   marginTop: 5,
   textAlign: 'center',
   fontSize: 16,
   color: 'red',
   fontFamily: 'Poppins-Bold'
 },
 paymentInstruction: {
   marginTop: 20,
   textAlign: 'center',
   fontSize: 12,
   width: '90%',
   fontFamily: 'Poppins-Regular'
 },
 paymentNumber: {
   marginTop: 5,
   textAlign: 'center',
   fontSize: 16,
   color: 'red',
   fontFamily: 'Poppins-Bold'
 },
 waitingIcon: {
   alignSelf: 'center',
   width: 120,
   height: 90,
   marginTop: 5,
   resizeMode: 'contain'
 },
 qrCodeImage: {
   alignSelf: 'center',
   width: 200,
   height: 200,
   marginTop: 5,
   resizeMode: 'contain'
 },
 paymentButtonContainer: {
   flexDirection: 'row',
   width: '100%',
   justifyContent: 'space-between',
   marginTop: 24,
   gap: 10
 },
 cancelTransactionButton: {
   flex: 1,
   backgroundColor: '#dc3545',
   paddingVertical: 12,
   borderRadius: 8,
   alignItems: 'center',
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2
 },
 cancelTransactionButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },
 checkPaymentButton: {
   flex: 1,
   backgroundColor: '#7F6000',
   paddingVertical: 12,
   borderRadius: 8,
   alignItems: 'center',
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2
 },
 checkPaymentButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 }
})