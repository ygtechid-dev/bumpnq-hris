import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { OneSignal } from 'react-native-onesignal';
import Router from './Router';

const API_BASE = "https://api.bumpnqweb.my.id/api"; // ganti sesuai domain API kamu

const App = () => {
  
  useEffect(() => {
    // OneSignal Initialization
    OneSignal.initialize("bf0f46ee-55e3-4c5b-8ec8-129f531a064f");
    OneSignal.Notifications.requestPermission(true);

    // === Fungsi simpan notif ke API ===
    const saveNotification = async (title, body, additionalData) => {
      try {
        const res = await fetch(`${API_BASE}/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            additional_data: additionalData || {}
          }),
        });

        const json = await res.json();
        console.log("✅ Notifikasi tersimpan ke API:", json);
      } catch (error) {
        console.error("❌ Gagal simpan notifikasi:", error);
      }
    };

    // Listener: ketika notif diklik
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal: notification clicked:', event);
      const { title, body, additionalData } = event.notification;
      saveNotification(title, body, additionalData);
    });

    // Listener: ketika notif muncul di foreground
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('OneSignal: notification will show in foreground:', event);
      const notif = event.getNotification();
      const { title, body, additionalData } = notif;
      
      saveNotification(title, body, additionalData);
      notif.display(); // tetap tampilkan banner notifikasi
    });

    OneSignal.User.getOnesignalId().then((userId) => {
      console.log('OneSignal User ID:', userId);
    });

    return () => {
      OneSignal.Notifications.removeEventListener('click');
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay');
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarWrapper}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={Platform.OS === 'android' ? 'transparent' : 'transparent'}
          translucent={Platform.OS === 'android'}
        />
      </View>
      
      <NavigationContainer>
        <Router />
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarWrapper: {
    marginTop: 35,
  },
});

export default App;
