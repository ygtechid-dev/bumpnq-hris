import { 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  FlatList,
  Alert,
  RefreshControl,
  Clipboard,
  Modal as ReactModal,
  Image
} from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Modal } from 'react-native-paper'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import axios from 'axios'
import { API_URL } from '../../context/APIUrl'
import { ref, get, update } from 'firebase/database'
import { database } from '../../config/Fire'

const API_BASE_URL = `${API_URL}/api/vouchers`
const API_BASE_URL_ONE = `${API_URL}/api`

const KuponPage = ({ navigation }) => {
  // ===== STATE MANAGEMENT =====
  const [activeTab, setActiveTab] = useState('KUPON_SAYA')
  const [allVouchers, setAllVouchers] = useState([])
  const [voucherShopItems, setVoucherShopItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dataFindSelf, setDataFindSelf] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [userPoints, setUserPoints] = useState(0)
  const [flashSaleCountdown, setFlashSaleCountdown] = useState({})
  const [showTermsInModal, setShowTermsInModal] = useState(false)
  
  // ADD: State untuk mengontrol terms visibility per voucher shop item
  const [shopTermsVisibility, setShopTermsVisibility] = useState({})
  
  const flashSaleInterval = useRef(null)
  const categories = ['Semua', 'Bakerzin', 'Ebiga Jjamppong', 'Delivery', 'Weekend Special']

  // ===== LIFECYCLE HOOKS =====
  useEffect(() => {
    getUserData()
    return () => {
      if (flashSaleInterval.current) {
        clearInterval(flashSaleInterval.current)
        flashSaleInterval.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (dataFindSelf.uid) {
      loadVouchers()
      if (activeTab === 'BELI_KUPON') {
        loadVoucherShop()
        loadFlashSaleCountdown()
      }
    }
  }, [dataFindSelf, activeTab])

  // ADD: Function untuk toggle terms visibility pada shop items
  const toggleShopTermsVisibility = (itemId) => {
    setShopTermsVisibility(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // ===== USER DATA FUNCTIONS =====
  const getUserData = async () => {
    try {
      const getData = await AsyncStorage.getItem('@dataSelf')
      if (getData) {
        const parsingData = JSON.parse(getData)
        const userData = parsingData[0] || {}
        await refreshUserDataFromFirebase(userData.handphone || userData.uid)
      }
    } catch (error) {
      console.error('Error getting user data:', error)
    }
  }

  const refreshUserDataFromFirebase = async (identifier) => {
    try {
      const userRef = ref(database, 'userlogin/')
      const snapshot = await get(userRef)
      
      if (snapshot.exists()) {
        const allUsers = snapshot.val()
        const usersArray = Object.values(allUsers)
        
        const currentUser = usersArray.find(user => 
          user.handphone === identifier || user.uid === identifier
        )

        if (currentUser) {
          setDataFindSelf(currentUser)
          setUserPoints(parseInt(currentUser.point_wallet) || 0)
          
          const updatedDataArray = [currentUser]
          await AsyncStorage.setItem('@dataSelf', JSON.stringify(updatedDataArray))
          
          console.log('User data refreshed from Firebase. Point wallet:', currentUser.point_wallet)
        }
      }
    } catch (error) {
      console.error('Error refreshing user data from Firebase:', error)
    }
  }

  // ===== DATA LOADING FUNCTIONS =====
 const loadVouchers = async () => {
  if (!dataFindSelf.uid) return
  
  setLoading(true)
  try {
    const combinedVouchers = []
    
    try {
      const purchasedResponse = await axios.get(`${API_BASE_URL_ONE}/shop/purchases/${dataFindSelf.uid}`)
      if (purchasedResponse.data.success) {
        const formattedPurchasedVouchers = purchasedResponse.data.data.map(voucher => ({
          ...voucher,
          voucher_type: 'purchased'
        }))
        combinedVouchers.push(...formattedPurchasedVouchers)
      }
    } catch (purchasedError) {
      console.log('Error loading purchased vouchers:', purchasedError.response?.data?.message || purchasedError.message)
    }

    // NEW: Sorting vouchers dengan status used di paling bawah
    combinedVouchers.sort((a, b) => {
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

    setAllVouchers(combinedVouchers)
  } catch (error) {
    console.error('Error loading vouchers:', error)
    Alert.alert('Error', 'Gagal memuat voucher')
  } finally {
    setLoading(false)
  }
}

  const loadVoucherShop = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL_ONE}/shop`, {
      params: { category: selectedCategory !== 'Semua' ? selectedCategory : undefined }
    })
    
    
    if (response.data.success) {
      const datarespons = response.data.data
      const datarespon = datarespons.filter((e) => e.target_uid == null)
      const now = new Date()
      
      const processedCountdown = {}
      
      datarespon.forEach(item => {
        if (item.is_flash_sale === true && item.flash_sale_end) {
          const flashSaleEnd = new Date(item.flash_sale_end)
          const timeDiff = Math.floor((flashSaleEnd - now) / 1000)
          processedCountdown[item.id] = Math.max(0, timeDiff)
          
          console.log(`Flash Sale Item ${item.id}:`, {
            title: item.title,
            flash_sale_end: item.flash_sale_end,
            timeDiff: timeDiff,
            countdown: processedCountdown[item.id]
          })
        }
      })
      
      setFlashSaleCountdown(processedCountdown)
      console.log('datarepson4', datarespon.target_uid);
      
      const filteringDataMember = datarespon.filter((voucher) => {
        const cocokMembership = !voucher.membership_type || voucher.membership_type === dataFindSelf.membership_status
        const stokTersedia = voucher.stock > 0
        return cocokMembership && stokTersedia
      })

      console.log('filddd', filteringDataMember);
      
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

      const sortedVouchers = filteringDataMember
        .sort((a, b) => {
          // First: Check purchase status - voucher yang bisa dibeli di atas
          const aCanPurchase = checkCanPurchase(a)
          const bCanPurchase = checkCanPurchase(b)
          
          if (aCanPurchase && !bCanPurchase) return -1  // a bisa dibeli, b tidak bisa -> a di atas
          if (!aCanPurchase && bCanPurchase) return 1   // a tidak bisa dibeli, b bisa -> b di atas
          
          // Second: If both have same purchase status, sort by flash sale
          const aTimeLeft = processedCountdown[a.id] || 0
          const bTimeLeft = processedCountdown[b.id] || 0
          const aIsActiveFlashSale = a.is_flash_sale === true && aTimeLeft > 0
          const bIsActiveFlashSale = b.is_flash_sale === true && bTimeLeft > 0
          
          if (aIsActiveFlashSale && !bIsActiveFlashSale) return -1
          if (!aIsActiveFlashSale && bIsActiveFlashSale) return 1
          
          // Third: Sort by price
          return a.point_price - b.point_price
        })

      setVoucherShopItems(sortedVouchers)
    }
  } catch (error) {
    console.error('Error loading voucher shop:', error)
    Alert.alert('Error', 'Gagal memuat voucher shop')
  }
}

  const loadFlashSaleCountdown = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL_ONE}/shop`, {
        params: { category: selectedCategory !== 'Semua' ? selectedCategory : undefined }
      })
      
      if (response.data.success) {
        const countdown = {}
        const now = new Date()
        
        response.data.data.forEach(item => {
          if (item.is_flash_sale === true && item.flash_sale_end) {
            const flashSaleEnd = new Date(item.flash_sale_end)
            const timeDiff = Math.floor((flashSaleEnd - now) / 1000)
            countdown[item.id] = Math.max(0, timeDiff)
          }
        })
        
        setFlashSaleCountdown(countdown)
        
        if (flashSaleInterval.current) {
          clearInterval(flashSaleInterval.current)
        }
        
        flashSaleInterval.current = setInterval(() => {
          setFlashSaleCountdown(prevCountdown => {
            const newCountdown = { ...prevCountdown }
            let hasExpiredItems = false
            
            Object.keys(newCountdown).forEach(id => {
              if (newCountdown[id] > 0) {
                newCountdown[id] -= 1
              } else if (newCountdown[id] === 0) {
                hasExpiredItems = true
                console.log(`Flash sale expired for item ID: ${id}`)
                newCountdown[id] = -1
              }
            })
            
            if (hasExpiredItems) {
              handleExpiredFlashSales()
            }
            
            return newCountdown
          })
        }, 1000)
      }
    } catch (error) {
      console.error('Error loading flash sale countdown:', error)
    }
  }

  const handleExpiredFlashSales = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL_ONE}/shop/flash-sale/disable-expired`)
      
      if (response.data.success) {
        console.log('Expired flash sales disabled:', response.data.disabled_items)
        setTimeout(() => {
          loadVoucherShop()
        }, 1000)
      }
    } catch (error) {
      console.error('Error disabling expired flash sales:', error)
      setTimeout(() => {
        loadVoucherShop()
      }, 1000)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshUserDataFromFirebase(dataFindSelf.handphone || dataFindSelf.uid)
    await loadVouchers()
    if (activeTab === 'BELI_KUPON') {
      await loadVoucherShop()
      await loadFlashSaleCountdown()
    }
    setRefreshing(false)
  }

  // NEW: Check if user can purchase voucher (buy_once validation)
  const canPurchaseVoucher = (voucherShopItem) => {
    if (!voucherShopItem.buy_once) return true
    
    // Check from allVouchers using title matching and user_id
    const hasPurchased = allVouchers.some(voucher => 
      voucher.title === voucherShopItem.title && 
      voucher.firebase_uid === dataFindSelf.uid &&
      (voucher.current_status === 'unused' || voucher.current_status === 'used' || voucher.status === 'unused' || voucher.status === 'used')
    )
    
    return !hasPurchased
  }

  // ===== VOUCHER ACTIONS =====
  const purchaseVoucher = async (voucherShopItem) => {
    // NEW: Check buy_once validation
    if (voucherShopItem.buy_once) {
      const hasPurchased = allVouchers.some(voucher => 
        voucher.title === voucherShopItem.title && 
        voucher.firebase_uid === dataFindSelf.uid &&
        (voucher.current_status === 'unused' || voucher.current_status === 'used' || voucher.status === 'unused' || voucher.status === 'used')
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

    // NEW: Check if flash sale is still active
    if (voucherShopItem.is_flash_sale) {
      const countdown = flashSaleCountdown[voucherShopItem.id] || 0
      if (countdown <= 0) {
        Alert.alert(
          'Flash Sale Berakhir', 
          'Maaf, flash sale untuk voucher ini sudah berakhir.',
          [{ text: 'OK' }]
        )
        return
      }
    }

    try {
      const userRef = ref(database, 'userlogin/')
      const snapshot = await get(userRef)
      
      if (!snapshot.exists()) {
        Alert.alert('Error', 'Data user tidak ditemukan')
        return
      }

      const allUsers = snapshot.val()
      const usersArray = Object.values(allUsers)
      
      const currentUser = usersArray.find(user => 
        user.handphone === dataFindSelf.handphone || user.uid === dataFindSelf.uid
      )

      if (!currentUser) {
        Alert.alert('Error', 'Data user tidak ditemukan')
        return
      }

      const currentPointWallet = parseInt(currentUser.point_wallet) || 0
      const requiredPoints = voucherShopItem.point_price

      if (currentPointWallet < requiredPoints) {
        Alert.alert(
          'Poin Tidak Cukup', 
          `Anda memerlukan ${requiredPoints} poin untuk membeli voucher ini.\nPoin wallet Anda saat ini: ${currentPointWallet}`
        )
        return
      }

      Alert.alert(
        'Konfirmasi Pembelian',
        `Apakah Anda yakin ingin membeli ${voucherShopItem.title} dengan ${requiredPoints} poin?\n\nPoin wallet saat ini: ${currentPointWallet}\nSisa poin setelah pembelian: ${currentPointWallet - requiredPoints}`,
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Beli', 
            onPress: async () => {
              setLoading(true)
              try {
                const response = await axios.post(`${API_BASE_URL_ONE}/shop/purchase`, {
                  firebase_uid: dataFindSelf.uid,
                  user_email: dataFindSelf.email,
                  voucher_shop_id: voucherShopItem.id,
                  current_points: currentPointWallet
                })
                
                if (response.data.success) {
                  const newPointWallet = currentPointWallet - requiredPoints
                  
                  const userKey = Object.keys(allUsers).find(key => 
                    allUsers[key].handphone === dataFindSelf.handphone ||
                    allUsers[key].uid === dataFindSelf.uid
                  )

                  if (userKey) {
                    const userUpdateRef = ref(database, `userlogin/${userKey}`)
                    await update(userUpdateRef, {
                      point_wallet: newPointWallet
                    })

                    const updatedUserData = {
                      ...currentUser,
                      point_wallet: newPointWallet
                    }
                    
                    const updatedDataArray = [updatedUserData]
                    await AsyncStorage.setItem('@dataSelf', JSON.stringify(updatedDataArray))
                    
                    setDataFindSelf(updatedDataArray[0])
                    setUserPoints(newPointWallet)

                    Alert.alert(
                      'Berhasil!', 
                      `Voucher berhasil dibeli!\n\nKode voucher: ${response.data.data.voucher_code}\nSisa poin wallet: ${newPointWallet}`,
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            loadVouchers()
                            loadVoucherShop()
                          }
                        }
                      ]
                    )
                  } else {
                    Alert.alert('Error', 'Gagal memperbarui data user')
                  }
                } else {
                  Alert.alert('Error', response.data.message || 'Gagal membeli voucher')
                }
              } catch (error) {
                console.error('Error purchasing voucher:', error.response?.data || error.message)
                Alert.alert('Error', 'Gagal membeli voucher. Silakan coba lagi.')
              } finally {
                setLoading(false)
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error checking user data:', error)
      Alert.alert('Error', 'Gagal mengecek data user')
    }
  }

  const useVoucher = async (voucher) => {
    setSelectedVoucher(voucher)
    setShowVoucherModal(true)
  }

  const copyVoucherCode = () => {
    if (selectedVoucher) {
      Clipboard.setString(selectedVoucher.voucher_code)
      Alert.alert('Berhasil', 'Kode voucher telah disalin!')
    }
  }

  const confirmUseVoucher = async () => {
    if (!selectedVoucher) return

    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin menggunakan voucher ${selectedVoucher.voucher_code}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Gunakan', 
          onPress: async () => {
            setShowVoucherModal(false)
            setLoading(true)
            try {
              let endpoint, requestData
              
              if (selectedVoucher.voucher_type === 'purchased') {
                endpoint = `${API_BASE_URL_ONE}/shop/purchases/use`
                requestData = {
                  voucher_code: selectedVoucher.voucher_code,
                  firebase_uid: dataFindSelf.uid,
                  order_id: `ORDER-${Date.now()}`
                }
              } else {
                endpoint = `${API_BASE_URL}/use-membership`
                requestData = {
                  voucher_code: selectedVoucher.voucher_code,
                  firebase_uid: dataFindSelf.uid,
                  order_id: `ORDER-${Date.now()}`
                }
              }

              const response = await axios.post(endpoint, requestData)
              
              if (response.data.success) {
                const discountAmount = response.data.data?.discount_amount || 
                                     response.data.discount_amount || 
                                     response.data.data?.nominal ||
                                     selectedVoucher.voucher_nominal ||
                                     selectedVoucher.nominal
                
                Alert.alert(
                  'Sukses!', 
                  `Voucher berhasil digunakan!\n\nDiskon: ${formatRupiah(discountAmount)}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        loadVouchers()
                      }
                    }
                  ]
                )
              } else {
                Alert.alert('Error', response.data.message || 'Gagal menggunakan voucher')
              }
            } catch (error) {
              const errorMessage = error.response?.data?.message || 'Gagal menggunakan voucher'
              Alert.alert('Error', errorMessage)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  // ===== UTILITY FUNCTIONS =====
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatRupiah = (amount) => {
    if (!amount) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return 'Berakhir'
    
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (days > 0) {
      return `${days} hari ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status, expiredDate) => {
    const now = new Date()
    const expired = new Date(expiredDate)
    
    if (status === 'used') return '#95a5a6'
    if (status === 'expired' || expired < now) return '#e74c3c'
    if (status === 'unused') return '#27ae60'
    return '#f39c12'
  }

  const getStatusText = (status, expiredDate) => {
    const now = new Date()
    const expired = new Date(expiredDate)
    
    if (status === 'used') return 'Sudah Digunakan'
    if (status === 'expired' || expired < now) return 'Kadaluarsa'
    if (status === 'unused') return 'Aktif'
    return 'Tidak Aktif'
  }

  // ===== COMPONENT RENDERS =====
  const CombinedVoucherCard = ({ item }) => {
    const [showTerms, setShowTerms] = useState(false)
    const statusColor = getStatusColor(item.current_status || item.status, item.expired_date)
    const statusText = getStatusText(item.current_status || item.status, item.expired_date)
    const isUsable = (item.current_status || item.status) === 'unused' && new Date(item.expired_date) > new Date()

    return (
      <View style={styles.voucherCard}>
        <View style={styles.voucherHeader}>
          <View style={styles.voucherInfo}>
            <Text style={styles.voucherTitle}>
              {item.voucher_type === 'membership' 
                ? `${item.membership_level} Voucher` 
                : (item.voucher_title || item.title)
              }
            </Text>
            <Text style={styles.voucherAmount}>
              {item.category !== "Ulang Tahun" && item.category !== "Welcome New User" ?
              formatRupiah(item.voucher_nominal || item.nominal)
            :
            `${item.nominal}% dari Total Belanja`
            }
            </Text>
            {item.voucher_type === 'purchased' && (
              <Text style={styles.voucherCategory}>{item.category}</Text>
            )}
          </View>
          <View style={styles.voucherTypeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.voucherDetails}>
          <Text style={styles.voucherExpiry}>
            Kode Kupon: {item.voucher_code}
          </Text>
          <Text style={styles.voucherExpiry}>
            Berlaku hingga: {formatDate(item.expired_date)}
          </Text>
          {item.purchase_date && (
            <Text style={styles.voucherPurchased}>
              Dibeli: {formatDate(item.purchase_date)}
            </Text>
          )}
          {item.used_date && (
            <Text style={styles.voucherUsed}>
              Digunakan: {formatDate(item.used_date)}
            </Text>
          )}
        </View>

        {item.terms_conditions && (
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.termsToggle}
              onPress={() => setShowTerms(!showTerms)}
            >
              <FontAwesome5 name="info-circle" size={14} color="#7F6000" />
              <Text style={styles.termsToggleText}>Syarat & Ketentuan</Text>
              <FontAwesome5 
                name={showTerms ? "chevron-up" : "chevron-down"} 
                size={12} 
                color="#7F6000" 
              />
            </TouchableOpacity>
            
            {showTerms && (
              <View style={styles.termsContent}>
                <Text style={styles.termsText}>{item.terms_conditions}</Text>
              </View>
            )}
          </View>
        )}

        {/* {isUsable && (
          <TouchableOpacity 
            style={styles.useButton}
            onPress={() => useVoucher(item)}
          >
            <Text style={styles.useButtonText}>Gunakan Voucher</Text>
          </TouchableOpacity>
        )} */}
      </View>
    )
  }

  const VoucherShopCard = ({ item }) => {
  // CHANGE: Gunakan state global untuk terms visibility, bukan local state
  const showTerms = shopTermsVisibility[item.id] || false
  
  const timeLeft = flashSaleCountdown[item.id] || 0
  const now = new Date()
  const flashSaleEnd = item.flash_sale_end ? new Date(item.flash_sale_end) : null
  
  const isFlashSaleActive = item.is_flash_sale === true && 
                           flashSaleEnd && 
                           flashSaleEnd > now && 
                           timeLeft > 0
  
  const isFlashSaleExpired = item.is_flash_sale === true && 
                            (!flashSaleEnd || flashSaleEnd <= now || timeLeft <= 0)
  
  const finalPrice = isFlashSaleExpired && item.original_point_price 
    ? item.original_point_price 
    : item.point_price
  
  const canAffordFinalPrice = (dataFindSelf.point_wallet || 0) >= finalPrice
  
  // NEW: Check buy_once validation
  const canPurchase = canPurchaseVoucher(item)
  
  return (
    <View style={[styles.shopCard, (!canPurchase || isFlashSaleExpired) && styles.shopCardDisabled]}>
      {isFlashSaleActive && (
        <View style={styles.flashSaleBanner}>
          <Text style={styles.flashSaleText}>🔥 FLASH SALE</Text>
          <Text style={styles.flashSaleTimer}>
            Berakhir dalam {formatTimeLeft(timeLeft)}
          </Text>
        </View>
      )}
      
      {isFlashSaleExpired && (
        <View style={styles.expiredFlashSaleBanner}>
          <Text style={styles.expiredFlashSaleText}>⏰ FLASH SALE BERAKHIR</Text>
          <Text style={styles.expiredFlashSaleSubtext}>Harga kembali normal</Text>
        </View>
      )}
      
      <View style={styles.shopCardContent}>
        {item.image_url && (
          <View style={styles.voucherImageContainer}>
            <Image 
              source={{ uri: item.image_url }}
              style={styles.voucherImage}
              resizeMode="cover"
            />
            {isFlashSaleActive && (
              <View style={styles.flashSaleBadge}>
                <Text style={styles.flashSaleBadgeText}>FLASH SALE</Text>
              </View>
            )}
            {isFlashSaleExpired && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredBadgeText}>BERAKHIR</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.shopCardHeader}>
          <View style={styles.shopCardInfo}>
            <Text style={styles.shopCardTitle}>{item.title}</Text>
            <Text style={styles.shopCardDescription}>{item.description}</Text>
            
            {isFlashSaleActive && (
              <View style={styles.flashSaleInfo}>
                <Text style={styles.flashSaleInfoText}>
                  ⚡ Promo terbatas! Berakhir pada {new Date(item.flash_sale_end).toLocaleString('id-ID')}
                </Text>
              </View>
            )}
            
            {isFlashSaleExpired && (
              <View style={styles.expiredFlashSaleInfo}>
                <Text style={styles.expiredFlashSaleInfoText}>
                  ⏰ Flash sale berakhir pada {flashSaleEnd ? flashSaleEnd.toLocaleString('id-ID') : 'Waktu tidak diketahui'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.shopCardPricing}>
            {(isFlashSaleActive || isFlashSaleExpired) && item.original_point_price && (
              <Text style={[
                styles.originalPrice,
                isFlashSaleExpired && styles.originalPriceExpired
              ]}>
                {isFlashSaleExpired ? 'Harga Normal: ' : ''}{item.original_point_price} Point
              </Text>
            )}
            
            <Text style={[
              styles.pointPrice, 
              (!canAffordFinalPrice || !canPurchase) && styles.pointPriceDisabled,
              isFlashSaleActive && styles.flashSalePrice,
              isFlashSaleExpired && styles.normalPrice
            ]}>
              {finalPrice} Point
            </Text>
            
            {isFlashSaleActive && item.original_point_price && (
              <View style={styles.discountBadge}>
               <Text style={styles.discountText}>
                 -{Math.round(((item.original_point_price - item.point_price) / item.original_point_price) * 100)}%
               </Text>
             </View>
           )}
           
           <View style={styles.categoryBadge}>
             <Text style={styles.categoryText}>{item.category}</Text>
           </View>
           
           {item.membership_type && (
             <View style={[styles.categoryBadge, { marginTop: 5 }]}>
               <Text style={styles.categoryText}>
                 Membership {item.membership_type}
               </Text>
             </View>
           )}
         </View>
       </View>

       {/* NEW: Buy once indicator */}
       {item.buy_once && (
         <View style={styles.buyOnceIndicator}>
           <FontAwesome5 name="exclamation-triangle" size={12} color="#856404" />
           <Text style={styles.buyOnceText}>Hanya bisa dibeli sekali per user</Text>
         </View>
       )}

       {item.terms_conditions && (
         <View style={styles.termsContainer}>
           <TouchableOpacity 
             style={styles.termsToggle}
             onPress={() => toggleShopTermsVisibility(item.id)}
           >
             <FontAwesome5 name="info-circle" size={14} color="#7F6000" />
             <Text style={styles.termsToggleText}>Syarat & Ketentuan</Text>
             <FontAwesome5 
               name={showTerms ? "chevron-up" : "chevron-down"} 
               size={12} 
               color="#7F6000" 
             />
           </TouchableOpacity>
           
           {showTerms && (
             <View style={styles.termsContent}>
               <Text style={styles.termsText}>{item.terms_conditions}</Text>
             </View>
           )}
         </View>
       )}
       
       <TouchableOpacity 
         style={[
           styles.buyButton,
           (!canAffordFinalPrice || !canPurchase || isFlashSaleExpired) && styles.buyButtonDisabled,
           isFlashSaleActive && styles.flashSaleBuyButton,
           isFlashSaleExpired && styles.normalBuyButton
         ]}
         onPress={() => purchaseVoucher({
           ...item,
           point_price: finalPrice
         })}
         disabled={!canAffordFinalPrice || !canPurchase || isFlashSaleExpired}
       >
         <Text style={[
           styles.buyButtonText,
           (!canAffordFinalPrice || !canPurchase || isFlashSaleExpired) && styles.buyButtonTextDisabled,
           isFlashSaleActive && styles.flashSaleBuyButtonText
         ]}>
           {!canPurchase ? 'Sudah Dibeli' :
            !canAffordFinalPrice ? 'Poin Tidak Cukup' :
            isFlashSaleActive ? `🔥 Beli Flash Sale (${formatTimeLeft(timeLeft)})` :
            isFlashSaleExpired ? 'Flash Sale Berakhir' :
            'Beli Sekarang'
           }
         </Text>
       </TouchableOpacity>
       
       {isFlashSaleActive && item.stock && (
         <View style={styles.stockInfo}>
           <Text style={styles.stockInfoText}>
             📦 Stok tersisa: {item.stock} voucher | Berakhir: {new Date(item.flash_sale_end).toLocaleString('id-ID')}
           </Text>
         </View>
       )}
       
       {isFlashSaleExpired && (
         <View style={styles.expiredNotice}>
           <Text style={styles.expiredNoticeText}>
             ℹ️ Flash sale telah berakhir pada {flashSaleEnd ? flashSaleEnd.toLocaleString('id-ID') : 'waktu tidak diketahui'}. Voucher masih tersedia dengan harga normal.
           </Text>
         </View>
       )}

       {/* NEW: Render komponen khusus di bagian paling bawah jika !canPurchase */}
       {!canPurchase && (
         <View style={styles.alreadyPurchasedBottomContainer}>
           <View style={styles.alreadyPurchasedBottomIndicator}>
             <FontAwesome5 name="check-circle" size={16} color="#28a745" />
             <Text style={styles.alreadyPurchasedBottomText}>
               Anda sudah pernah membeli voucher ini
             </Text>
           </View>
           <Text style={styles.alreadyPurchasedBottomDescription}>
             Voucher ini hanya dapat dibeli sekali per pengguna. Silakan cek voucher Anda di tab "KUPON SAYA".
           </Text>
         </View>
       )}
     </View>
   </View>
 )
}

 const EmptyState = ({ message }) => (
   <View style={styles.emptyState}>
     <FontAwesome5 name="receipt" size={48} color="#6c757d" style={styles.emptyIcon} />
     <Text style={styles.emptyStateText}>{message}</Text>
     <TouchableOpacity 
       style={styles.refreshButton}
       onPress={onRefresh}
     >
       <Text style={styles.refreshButtonText}>Refresh</Text>
     </TouchableOpacity>
   </View>
 )

 const renderContent = () => {
   if (activeTab === 'KUPON_SAYA') {
     return (
       <View style={styles.content}>
        
         {allVouchers.length > 0 ? (
           <FlatList
             data={allVouchers}
             keyExtractor={(item) => `${item.voucher_type}-${item.id}`}
             renderItem={({ item }) => <CombinedVoucherCard item={item} />}
             contentContainerStyle={styles.listContainer}
             showsVerticalScrollIndicator={false}
             refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
             }
           />
         ) : (
           <EmptyState message="Kamu masih belum memiliki kupon" />
         )}
       </View>
     )
   } else {
     const filteredShopItems = selectedCategory === 'Semua' 
       ? voucherShopItems 
       : voucherShopItems.filter(v => v.category === selectedCategory)

     return (
       <View style={styles.content}>
         <View style={styles.pointsContainer}>
           <FontAwesome5 name="coins" size={20} color="#7F6000" />
           <Text style={styles.pointsText}>
             Poin Anda: {(dataFindSelf.point_wallet || 0).toLocaleString()}
           </Text>
         </View>
         
         {filteredShopItems.length > 0 ? (
           <FlatList
             data={filteredShopItems}
             keyExtractor={(item) => item.id.toString()}
             renderItem={({ item }) => <VoucherShopCard item={item} />}
             contentContainerStyle={styles.listContainer}
             showsVerticalScrollIndicator={false}
             refreshControl={
               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
             }
           />
         ) : (
           <EmptyState message="Tidak ada voucher tersedia untuk kategori ini" />
         )}
       </View>
     )
   }
 }

 return (
   <View style={styles.container}>
     <View style={styles.header}>
       <TouchableOpacity 
         style={styles.backButton}
         onPress={() => navigation.goBack()}
       >
         <FontAwesome5 name="arrow-left" size={18} color="#495057" />
       </TouchableOpacity>
       <Text style={styles.headerTitle}>Kuponku</Text>
       <TouchableOpacity style={styles.clockButton}>
         <FontAwesome5 name="history" size={18} color="#495057" />
       </TouchableOpacity>
     </View>

     <View style={styles.tabContainer}>
       <TouchableOpacity
         style={[
           styles.tab,
           activeTab === 'KUPON_SAYA' && styles.activeTab
         ]}
         onPress={() => setActiveTab('KUPON_SAYA')}
       >
         <Text style={[
           styles.tabText,
           activeTab === 'KUPON_SAYA' && styles.activeTabText
         ]}>
           KUPON SAYA
         </Text>
       </TouchableOpacity>
       
       <TouchableOpacity
         style={[
           styles.tab,
           activeTab === 'BELI_KUPON' && styles.activeTab
         ]}
         onPress={() => setActiveTab('BELI_KUPON')}
       >
         <Text style={[
           styles.tabText,
           activeTab === 'BELI_KUPON' && styles.activeTabText
         ]}>
           BELI KUPON
         </Text>
       </TouchableOpacity>
     </View>

     {renderContent()}

     <Modal visible={loading} transparent>
       <View style={styles.loadingOverlay}>
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#7F6000" />
           <Text style={styles.loadingText}>Loading...</Text>
         </View>
       </View>
     </Modal>

     <ReactModal
       visible={showVoucherModal}
       transparent={true}
       animationType="fade"
       onRequestClose={() => setShowVoucherModal(false)}
     >
       <View style={styles.modalOverlay}>
         <View style={styles.modalContainer}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Kode Voucher</Text>
             <TouchableOpacity 
               style={styles.closeButton}
               onPress={() => setShowVoucherModal(false)}
             >
               <FontAwesome5 name="times" size={18} color="#6c757d" />
             </TouchableOpacity>
           </View>
           
           {selectedVoucher && (
             <View style={styles.modalContent}>
               <View style={styles.voucherInfoModal}>
                 <Text style={styles.voucherTitleModal}>
                   {selectedVoucher.voucher_type === 'membership' 
                     ? `${selectedVoucher.membership_level} Voucher`
                     : (selectedVoucher.voucher_title || selectedVoucher.title)
                   }
                 </Text>
                 <Text style={styles.voucherAmountModal}>
                   {formatRupiah(selectedVoucher.voucher_nominal || selectedVoucher.nominal)}
                 </Text>
               </View>
               
               <View style={styles.voucherCodeContainer}>
                 <Text style={styles.voucherCodeLabel}>Kode Voucher:</Text>
                 <View style={styles.voucherCodeBox}>
                   <Text style={styles.voucherCodeText}>{selectedVoucher.voucher_code}</Text>
                   <TouchableOpacity 
                     style={styles.copyButton}
                     onPress={copyVoucherCode}
                   >
                     <FontAwesome5 name="copy" size={16} color="#7F6000" />
                   </TouchableOpacity>
                 </View>
               </View>
               
               <View style={styles.voucherDetailsModal}>
                 <Text style={styles.voucherExpiryModal}>
                   Berlaku hingga: {formatDate(selectedVoucher.expired_date)}
                 </Text>
               </View>

               {selectedVoucher.terms_conditions && (
                 <View style={styles.termsModalContainer}>
                   <TouchableOpacity 
                     style={styles.termsModalToggle}
                     onPress={() => setShowTermsInModal(!showTermsInModal)}
                   >
                     <FontAwesome5 name="info-circle" size={16} color="#7F6000" />
                     <Text style={styles.termsModalToggleText}>Syarat & Ketentuan</Text>
                     <FontAwesome5 
                       name={showTermsInModal ? "chevron-up" : "chevron-down"} 
                       size={14} 
                       color="#7F6000" 
                     />
                   </TouchableOpacity>
                   
                   {showTermsInModal && (
                     <View style={styles.termsModalContent}>
                       <Text style={styles.termsModalText}>{selectedVoucher.terms_conditions}</Text>
                     </View>
                   )}
                 </View>
               )}
               
               <View style={styles.modalButtons}>
                 <TouchableOpacity 
                   style={styles.cancelButton}
                   onPress={() => setShowVoucherModal(false)}
                 >
                   <Text style={styles.cancelButtonText}>Tutup</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={styles.confirmButton}
                   onPress={confirmUseVoucher}
                 >
                   <Text style={styles.confirmButtonText}>Gunakan Sekarang</Text>
                 </TouchableOpacity>
               </View>
             </View>
           )}
         </View>
       </View>
     </ReactModal>
   </View>
 )
}

export default KuponPage

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
 clockButton: {
   width: 40,
   height: 40,
   justifyContent: 'center',
   alignItems: 'center',
   borderRadius: 20,
   backgroundColor: '#f8f9fa'
 },
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
 content: {
   flex: 1
 },
 pointsContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#fff3cd',
   padding: 12,
   marginHorizontal: 16,
   marginTop: 8,
   borderRadius: 8,
   borderLeftWidth: 4,
   borderLeftColor: '#7F6000'
 },
 pointsText: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginLeft: 8
 },
 listContainer: {
   padding: 16
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
   marginBottom: 4
 },
 voucherAmount: {
   fontSize: 20,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginBottom: 4
 },
 voucherCategory: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#7F6000',
   backgroundColor: '#fff3cd',
   paddingHorizontal: 8,
   paddingVertical: 2,
   borderRadius: 10,
   alignSelf: 'flex-start'
 },
 voucherTypeContainer: {
   alignItems: 'flex-end'
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
 voucherDetails: {
   marginBottom: 12
 },
 voucherExpiry: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 4
 },
 voucherPurchased: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 4
 },
 voucherUsed: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 4
 },
 // Terms & Conditions Styles
 termsContainer: {
   marginTop: 12,
   marginBottom: 8,
   borderWidth: 1,
   borderColor: '#e9ecef',
   borderRadius: 8,
   backgroundColor: '#f8f9fa'
 },
 termsToggle: {
   flexDirection: 'row',
   alignItems: 'center',
   padding: 12,
   backgroundColor: '#f8f9fa',
   borderRadius: 8
 },
 termsToggleText: {
   flex: 1,
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#7F6000',
   marginLeft: 8,
   marginRight: 8
 },
 termsContent: {
   padding: 12,
   paddingTop: 0,
   borderTopWidth: 1,
   borderTopColor: '#e9ecef',
   backgroundColor: 'white',
   borderBottomLeftRadius: 8,
   borderBottomRightRadius: 8
 },
 termsText: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#495057',
   lineHeight: 18,
   textAlign: 'justify'
 },
 alreadyPurchasedBottomContainer: {
  marginTop: 12,
  padding: 16,
  backgroundColor: '#f8f9fa',
  borderTopWidth: 1,
  borderTopColor: '#dee2e6',
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12
},
alreadyPurchasedBottomIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8
},
alreadyPurchasedBottomText: {
  fontSize: 14,
  fontFamily: 'Poppins-Bold',
  color: '#28a745',
  marginLeft: 8,
  flex: 1
},
alreadyPurchasedBottomDescription: {
  fontSize: 12,
  fontFamily: 'Poppins-Regular',
  color: '#6c757d',
  lineHeight: 18,
  textAlign: 'justify',
  marginTop: 4
},
 useButton: {
   backgroundColor: '#7F6000',
   paddingVertical: 12,
   borderRadius: 8,
   alignItems: 'center',
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.2,
   shadowRadius: 2,
   marginTop: 8
 },
 useButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
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
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center'
 },
 flashSaleText: {
   fontSize: 12,
   fontFamily: 'Poppins-Bold',
   color: 'white',
   letterSpacing: 1
 },
 flashSaleTimer: {
   fontSize: 12,
   fontFamily: 'Poppins-Medium',
   color: 'white'
 },
 expiredFlashSaleBanner: {
   backgroundColor: '#6c757d',
   paddingVertical: 8,
   paddingHorizontal: 12,
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center'
 },
 expiredFlashSaleText: {
   fontSize: 12,
   fontFamily: 'Poppins-Bold',
   color: 'white',
   letterSpacing: 1
 },
 expiredFlashSaleSubtext: {
   fontSize: 10,
   fontFamily: 'Poppins-Medium',
   color: 'white',
   opacity: 0.8
 },
 shopCardContent: {
   padding: 16
 },
 voucherImageContainer: {
   width: '100%',
   height: 120,
   marginBottom: 12,
   borderRadius: 8,
   overflow: 'hidden',
   backgroundColor: '#f8f9fa',
   position: 'relative'
 },
 voucherImage: {
   width: '100%',
   height: '100%'
 },
 flashSaleBadge: {
   position: 'absolute',
   top: 8,
   left: 8,
   backgroundColor: '#e74c3c',
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 4,
   elevation: 2
 },
 flashSaleBadgeText: {
   fontSize: 10,
   fontFamily: 'Poppins-Bold',
   color: 'white',
   letterSpacing: 0.5
 },
 expiredBadge: {
   position: 'absolute',
   top: 8,
   left: 8,
   backgroundColor: '#6c757d',
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 4,
   elevation: 2
 },
 expiredBadgeText: {
   fontSize: 10,
   fontFamily: 'Poppins-Bold',
   color: 'white',
   letterSpacing: 0.5
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
   marginBottom: 4
 },
 shopCardDescription: {
   fontSize: 12,
   fontFamily: 'Poppins-Regular',
   color: '#6c757d',
   marginBottom: 6,
   lineHeight: 16
 },
 flashSaleInfo: {
   backgroundColor: '#fff3cd',
   padding: 8,
   borderRadius: 6,
   marginTop: 6,
   borderLeftWidth: 3,
   borderLeftColor: '#ffc107'
 },
 flashSaleInfoText: {
   fontSize: 11,
   fontFamily: 'Poppins-Medium',
   color: '#856404',
   textAlign: 'center'
 },
 expiredFlashSaleInfo: {
   backgroundColor: '#f8f9fa',
   padding: 8,
   borderRadius: 6,
   marginTop: 6,
   borderLeftWidth: 3,
   borderLeftColor: '#6c757d'
 },
 expiredFlashSaleInfoText: {
   fontSize: 11,
   fontFamily: 'Poppins-Medium',
   color: '#6c757d',
   textAlign: 'center'
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
 originalPriceExpired: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: '#495057',
   textDecorationLine: 'none',
   marginBottom: 4
 },
 pointPrice: {
   fontSize: 16,
   fontFamily: 'Poppins-Bold',
   color: '#7F6000',
   marginBottom: 8
 },
 pointPriceDisabled: {
   color: '#6c757d'
 },
 flashSalePrice: {
   color: '#e74c3c',
   fontSize: 18
 },
 normalPrice: {
   color: '#495057',
   fontSize: 16
 },
 discountBadge: {
   backgroundColor: '#e74c3c',
   paddingHorizontal: 6,
   paddingVertical: 2,
   borderRadius: 8,
   marginBottom: 4,
   alignSelf: 'flex-end'
 },
 discountText: {
   fontSize: 10,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },
 categoryBadge: {
   backgroundColor: '#f8f9fa',
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 12,
   borderWidth: 1,
   borderColor: '#dee2e6'
 },
 categoryText: {
   fontSize: 10,
   fontFamily: 'Poppins-Medium',
   color: '#495057'
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

 buyButton: {
   backgroundColor: '#7F6000',
   paddingVertical: 12,
   borderRadius: 8,
   alignItems: 'center',
   elevation: 2
 },
 buyButtonDisabled: {
   backgroundColor: '#dee2e6'
 },
 flashSaleBuyButton: {
   backgroundColor: '#e74c3c',
   elevation: 4
 },
 normalBuyButton: {
   backgroundColor: '#495057',
   elevation: 2
 },
 buyButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Bold',
   color: 'white'
 },
 buyButtonTextDisabled: {
   color: '#6c757d'
 },
 flashSaleBuyButtonText: {
   letterSpacing: 0.5,
   textTransform: 'uppercase'
 },
 stockInfo: {
   marginTop: 8,
   padding: 8,
   backgroundColor: '#f8f9fa',
   borderRadius: 6,
   borderWidth: 1,
   borderColor: '#dee2e6'
 },
 stockInfoText: {
   fontSize: 11,
   fontFamily: 'Poppins-Medium',
   color: '#495057',
   textAlign: 'center'
 },
 expiredNotice: {
   marginTop: 8,
   padding: 10,
   backgroundColor: '#e9ecef',
   borderRadius: 6,
   borderWidth: 1,
   borderColor: '#dee2e6'
 },
 expiredNoticeText: {
   fontSize: 11,
   fontFamily: 'Poppins-Medium',
   color: '#6c757d',
   textAlign: 'center',
   lineHeight: 16
 },
 // Empty State & Loading
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
 refreshButton: {
   backgroundColor: '#7F6000',
   paddingHorizontal: 24,
   paddingVertical: 12,
   borderRadius: 8,
   elevation: 2
 },
 refreshButtonText: {
   fontSize: 14,
   fontFamily: 'Poppins-Medium',
   color: 'white'
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
   alignItems: 'center',
   elevation: 5
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
   textAlign: 'center'
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
   textAlign: 'center',
   marginBottom: 4
 },
 // Modal Terms
 termsModalContainer: {
   width: '100%',
   marginBottom: 20,
   borderWidth: 1,
   borderColor: '#e9ecef',
   borderRadius: 12,
   backgroundColor: '#f8f9fa'
 },
 termsModalToggle: {
   flexDirection: 'row',
   alignItems: 'center',
   padding: 15,
   backgroundColor: '#f8f9fa',
   borderRadius: 12
 },
 termsModalToggleText: {
   flex: 1,
   fontSize: 16,
   fontFamily: 'Poppins-Medium',
   color: '#7F6000',
   marginLeft: 10,
   marginRight: 10
 },
 termsModalContent: {
   padding: 15,
   paddingTop: 0,
   borderTopWidth: 1,
   borderTopColor: '#e9ecef',
   backgroundColor: 'white',
   borderBottomLeftRadius: 12,
   borderBottomRightRadius: 12,
   maxHeight: 150
 },
 termsModalText: {
   fontSize: 14,
   fontFamily: 'Poppins-Regular',
   color: '#495057',
   lineHeight: 20,
   textAlign: 'justify'
 },
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
 }
})