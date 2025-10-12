// components/withGuestCheck.js
import React from 'react'
import { Alert, View, Text } from 'react-native'
import { useUser } from '../context/UserContext' // Sesuaikan path
import { useNavigation, useFocusEffect } from '@react-navigation/native'

// HOC untuk menghandle guest check dengan tab focus detection
const withGuestCheck = (OriginalComponent, options = {}) => {
  const {
    featureName = 'fitur ini',
    targetRoute = null, // Jika ada, akan navigate ke route ini untuk non-guest
    blockAccess = true, // Jika true, guest tidak bisa akses sama sekali
    showAlertOnFocus = true // Jika true, alert muncul saat tab difocus
  } = options

  return function GuestCheckWrapper(props) {
    const { dataFindSelf } = useUser()
    const navigation = useNavigation()
    const [isGuest, setIsGuest] = React.useState(false)
    const [hasShownAlert, setHasShownAlert] = React.useState(false)

    const handleRegister = React.useCallback(() => {
      Alert.alert(
        'Akses Dibatasi',
        `Anda sedang menggunakan akun GUEST. Untuk mengakses ${featureName}, silakan melakukan pendaftaran akun Anda.`,
        [
          { 
            text: 'Batal', 
            style: 'cancel',
            onPress: () => {
              // Navigate back to Beranda jika user cancel
              navigation.navigate('Beranda')
            }
          },
          { 
            text: 'Daftar Sekarang', 
            onPress: () => {
              navigation.navigate('Register')
            }
          }
        ]
      )
    }, [navigation, featureName])

    // Check guest status
    const checkGuestStatus = React.useCallback(() => {
      if (dataFindSelf && Object.keys(dataFindSelf).length > 0) {
        const userData = Array.isArray(dataFindSelf) ? dataFindSelf[0] : dataFindSelf
        const isUserGuest = userData.membership_status === "GUEST"
        setIsGuest(isUserGuest)
        return isUserGuest
      }
      return false
    }, [dataFindSelf])

    // Handle access based on guest status
    const handleAccess = React.useCallback(() => {
      const userIsGuest = checkGuestStatus()
      
      if (userIsGuest) {
        if (showAlertOnFocus && !hasShownAlert) {
          setHasShownAlert(true)
          setTimeout(() => {
            handleRegister()
          }, 100) // Delay untuk smooth transition
        }
      } else if (targetRoute) {
        // Jika bukan guest dan ada targetRoute, navigate ke sana
        navigation.push(targetRoute, { data: dataFindSelf })
      }
    }, [checkGuestStatus, showAlertOnFocus, hasShownAlert, handleRegister, targetRoute, navigation, dataFindSelf])

    // Use focus effect untuk detect saat tab difocus
    useFocusEffect(
      React.useCallback(() => {
        setHasShownAlert(false) // Reset alert status saat focus
        handleAccess()
      }, [handleAccess])
    )

    // Reset alert status saat data user berubah
    React.useEffect(() => {
      setHasShownAlert(false)
      checkGuestStatus()
    }, [dataFindSelf, checkGuestStatus])

    // Render logic
    if (isGuest && blockAccess) {
      // Tampilkan placeholder atau loading untuk guest yang diblok
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          padding: 20
        }}>
          <Text style={{ 
            fontSize: 16, 
            color: '#6c757d',
            textAlign: 'center',
            fontFamily: 'Poppins-Medium'
          }}>
          Daftar Akun untuk mengakses fitur {featureName}
          </Text>
        </View>
      )
    }

    // Render original component jika bukan guest atau access diizinkan
    return <OriginalComponent {...props} />
  }
}

export default withGuestCheck

// Preset configurations untuk berbagai fitur
export const membershipGuestCheck = {
  featureName: 'Membership',
  targetRoute: null,
  blockAccess: false, // Bisa akses tapi akan di-redirect
  showAlertOnFocus: true
}

export const kuponGuestCheck = {
  featureName: 'Kupon',
  targetRoute: null, // Render langsung tanpa redirect
  blockAccess: true, // Block access untuk guest
  showAlertOnFocus: true
}

export const voucherGuestCheck = {
  featureName: 'Voucher',
  targetRoute: null, // Render langsung tanpa redirect
  blockAccess: true, // Block access untuk guest
  showAlertOnFocus: true
}