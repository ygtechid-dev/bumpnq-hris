// context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ref, get } from 'firebase/database'
import { database } from '../config/Fire' // Sesuaikan path

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [dataFindSelf, setDataFindSelf] = useState({})
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(false)

  // Function untuk refresh user data dari Firebase
  const refreshUserDataFromFirebase = async (identifier) => {
    if (!identifier) {
      // Jika tidak ada identifier, coba ambil dari AsyncStorage
      try {
        const getData = await AsyncStorage.getItem('@dataSelf')
        if (getData) {
          const parsingData = JSON.parse(getData)
          const userData = parsingData[0] || {}
          identifier = userData.handphone || userData.uid
        }
      } catch (error) {
        console.error('Error getting identifier from storage:', error)
        return
      }
    }

    setLoading(true)
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
          return currentUser
        } else {
          console.log('User not found in Firebase')
        }
      } else {
        console.log('No users data in Firebase')
      }
    } catch (error) {
      console.error('Error refreshing user data from Firebase:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function untuk load user data dari AsyncStorage saat app start
  const loadUserDataFromStorage = async () => {
    try {
      const getData = await AsyncStorage.getItem('@dataSelf')
      if (getData) {
        const parsingData = JSON.parse(getData)
        const userData = parsingData[0] || {}
        setDataFindSelf(userData)
        setUserPoints(parseInt(userData.point_wallet) || 0)
        
        // Auto refresh dari Firebase jika ada data
        if (userData.handphone || userData.uid) {
          await refreshUserDataFromFirebase(userData.handphone || userData.uid)
        }
      }
    } catch (error) {
      console.error('Error loading user data from storage:', error)
    }
  }

  // Function untuk update user points (untuk optimistic update)
  const updateUserPoints = (newPoints) => {
    setUserPoints(newPoints)
    // Update juga di dataFindSelf
    setDataFindSelf(prev => ({
      ...prev,
      point_wallet: newPoints
    }))
  }

  // Function untuk clear user data (logout)
  const clearUserData = async () => {
    try {
      await AsyncStorage.removeItem('@dataSelf')
      setDataFindSelf({})
      setUserPoints(0)
    } catch (error) {
      console.error('Error clearing user data:', error)
    }
  }

  // Load data saat pertama kali mount
  useEffect(() => {
    loadUserDataFromStorage()
  }, [])

  const value = {
    // State
    dataFindSelf,
    userPoints,
    loading,
    
    // Functions
    refreshUserDataFromFirebase,
    loadUserDataFromStorage,
    updateUserPoints,
    clearUserData,
    
    // Setters (jika diperlukan akses langsung)
    setDataFindSelf,
    setUserPoints
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}