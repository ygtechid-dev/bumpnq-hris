import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../context/APIUrl';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadNotifications();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@dataSelf');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`);
      
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.notifications || []);
      } else {
        console.log('Failed to load notifications');
        Alert.alert('Error', 'Gagal memuat notifikasi');
      }
    } catch (error) {
      console.log('Error loading notifications:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      } else {
        console.log('Failed to mark notification as read');
      }
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const handleModalAction = () => {
    if (selectedNotification?.additional_data) {
      try {
        const additionalData = typeof selectedNotification.additional_data === 'string' 
          ? JSON.parse(selectedNotification.additional_data) 
          : selectedNotification.additional_data;

        if (additionalData.screen) {
          setModalVisible(false);
          navigation.navigate(additionalData.screen, additionalData.params || {});
        }
      } catch (error) {
        console.log('Error parsing additional data:', error);
      }
    }
    setModalVisible(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getNotificationIcon = (notification) => {
    const additionalData = notification.additional_data;
    if (additionalData) {
      try {
        const data = typeof additionalData === 'string' ? JSON.parse(additionalData) : additionalData;
        if (data.type === 'attendance') return 'clock';
        if (data.type === 'announcement') return 'bullhorn';
        if (data.type === 'task') return 'tasks';
        if (data.type === 'reminder') return 'bell';
      } catch (error) {
        console.log('Error parsing notification data:', error);
      }
    }
    return 'info-circle';
  };

  const getNotificationIconColor = (notification) => {
    const additionalData = notification.additional_data;
    if (additionalData) {
      try {
        const data = typeof additionalData === 'string' ? JSON.parse(additionalData) : additionalData;
        if (data.type === 'attendance') return '#FF9800';
        if (data.type === 'announcement') return '#2196F3';
        if (data.type === 'task') return '#4CAF50';
        if (data.type === 'reminder') return '#9C27B0';
      } catch (error) {
        console.log('Error parsing notification data:', error);
      }
    }
    return '#5EC898';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#5EC898" />
        <Text style={styles.loadingText}>Memuat notifikasi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={() => {
            Alert.alert(
              'Tandai Semua Sebagai Dibaca',
              'Apakah Anda yakin ingin menandai semua notifikasi sebagai dibaca?',
              [
                { text: 'Batal', style: 'cancel' },
                { 
                  text: 'Ya', 
                  onPress: async () => {
                    // Implementation for marking all as read
                  }
                }
              ]
            );
          }}
        >
          <FontAwesome5 name="check-double" size={18} color="#5EC898" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5EC898']}
            tintColor="#5EC898"
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="bell-slash" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Tidak Ada Notifikasi</Text>
            <Text style={styles.emptySubtitle}>
              Notifikasi akan muncul di sini ketika ada pembaruan
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.is_read && styles.unreadNotification,
                  index === notifications.length - 1 && styles.lastNotification
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationContent}>
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationIconColor(notification) + '20' }
                  ]}>
                    <FontAwesome5 
                      name={getNotificationIcon(notification)} 
                      size={20} 
                      color={getNotificationIconColor(notification)} 
                    />
                  </View>
                  
                  <View style={styles.notificationText}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.is_read && styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.is_read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                    
                    <Text style={styles.notificationDate}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Notification Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={[
                styles.modalIcon,
                { backgroundColor: getNotificationIconColor(selectedNotification) + '20' }
              ]}>
                <FontAwesome5 
                  name={getNotificationIcon(selectedNotification)} 
                  size={28} 
                  color={getNotificationIconColor(selectedNotification)} 
                />
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <FontAwesome5 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>
                {selectedNotification?.title}
              </Text>

              <Text style={styles.modalDate}>
                {selectedNotification && formatDate(selectedNotification.created_at)}
              </Text>

              <View style={styles.modalDivider} />

              <Text style={styles.modalBody}>
                {selectedNotification?.body}
              </Text>

              {selectedNotification?.additional_data && (
                <View style={styles.additionalInfo}>
                  <Text style={styles.additionalInfoLabel}>Informasi Tambahan:</Text>
                  <Text style={styles.additionalInfoText}>
                    {typeof selectedNotification.additional_data === 'string' 
                      ? selectedNotification.additional_data 
                      : JSON.stringify(selectedNotification.additional_data, null, 2)}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleModalAction}
              >
                <Text style={styles.modalButtonText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    paddingBottom: 100,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#5EC898',
    backgroundColor: '#f8fff9',
  },
  lastNotification: {
    marginBottom: 0,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginTop: 6,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  additionalInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  additionalInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  additionalInfoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
  },
  modalButton: {
    backgroundColor: '#5EC898',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});