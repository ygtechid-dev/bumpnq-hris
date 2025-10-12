// src/utils/OneSignalHelper.js
import { OneSignal } from 'react-native-onesignal';

export const OneSignalHelper = {
  // Get user ID
  getUserId: () => {
    return OneSignal.User.getOnesignalId();
  },

  // Set external user ID (untuk link dengan user database kamu)
  setExternalUserId: (userId) => {
    OneSignal.login(userId);
  },

  // Logout user
  logoutUser: () => {
    OneSignal.logout();
  },

  // Add tags (untuk segmentasi)
  setTags: (tags) => {
    OneSignal.User.addTags(tags);
    // Contoh: OneSignal.User.addTags({user_type: 'premium', city: 'Jakarta'});
  },

  // Remove tags
  removeTags: (tagKeys) => {
    OneSignal.User.removeTags(tagKeys);
    // Contoh: OneSignal.User.removeTags(['user_type', 'city']);
  },

  // Send tag ketika user login
  setUserData: (userData) => {
    const tags = {
      user_id: userData.id,
      user_name: userData.name,
      user_email: userData.email,
      user_phone: userData.handphone,
      login_time: new Date().toISOString(),
    };
    
    OneSignal.User.addTags(tags);
    OneSignal.login(userData.id.toString());
  },

  // Clear user data ketika logout
  clearUserData: () => {
    OneSignal.logout();
  },

  // Get notification permission status
  getNotificationPermission: async () => {
    const permission = await OneSignal.Notifications.getPermissionAsync();
    return permission;
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    const permission = await OneSignal.Notifications.requestPermission(true);
    return permission;
  }
};