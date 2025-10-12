import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

// Import UserProvider
import { UserProvider, useUser } from '../context/UserContext'; // Sesuaikan path

// Import HOC untuk guest check
import withGuestCheck, { 
  membershipGuestCheck, 
  kuponGuestCheck, 
  voucherGuestCheck 
} from '../component/withGuestCheck'; // Sesuaikan path

// Import pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Login/Register';
import SplashScreen from '../pages/SplashScreen';
import Cameras from '../pages/Cameras';
import DataQR from '../pages/DataQR';
import Membership from '../pages/Membership';
import BookMenu from '../pages/BookMenu';
import ReservationPage from '../pages/ReservationPage';
import ReserveTable from '../pages/ReservationPage/ReserveTable';
import PaymentPage from '../pages/PaymentPage';
import WaitingList from '../pages/WaitingList';
import UserSetting from '../pages/UserSetting';
import MyReservation from '../pages/ReservationPage/MyReservation';
import LoginGuest from '../pages/Login/LoginGuest';
import KuponPage from '../pages/KuponPage';
import VoucherPage from '../pages/VoucherPage';
import EditUserProfile from '../pages/UserSetting/EditUserProfile';
import LoginAccount from '../pages/Login/LoginAccount';
import HomeWithTabs from '../pages/Home/HomeWithTabs';
import AbsenSuccessScreen from '../pages/AbsenSuccessScreen';
import PengajuanIzin from '../pages/PengajuanIzin';
import PengajuanCuti from '../pages/PengajuanCuti';
import PengajuanLembur from '../pages/PengajuanLembur';
import RiwayatWithTabs from '../pages/RiwayatKehadiranScreen';
import AktivitasWithTabs from '../pages/AktivitasScreen';
import ProfilWithTabs from '../pages/ProfilScreen';
import EditProfileScreen from '../pages/ProfilScreen/EditProfileScreen';
import PayslipScreen from '../pages/Payslip';
import InformationStructureScreen from '../pages/InformationStructureScreen';
import NotificationScreen from '../pages/NotificationScreen';
import FileViewerScreen from '../pages/InformationStructureScreen/FileViewerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create wrapped components dengan guest check
const MembershipWithGuestCheck = withGuestCheck(Membership, membershipGuestCheck)
const KuponWithGuestCheck = withGuestCheck(KuponPage, kuponGuestCheck)
const VoucherWithGuestCheck = withGuestCheck(VoucherPage, voucherGuestCheck)

// Tab Navigator dengan wrapped components
const MyTabsContent = () => {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Beranda') {
            iconName = 'home';
          } else if (route.name === 'Kupon') {
            iconName = 'ticket-alt';
          } else if (route.name === 'Voucher') {
            iconName = 'tag';
          } else if (route.name === 'Membership') {
            iconName = 'id-card';
          } else if (route.name === 'Setting') {
            iconName = 'user-alt';
          }
          
          return <FontAwesome5 name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7F6000',
        tabBarInactiveTintColor: '#6C757D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      })}
      initialRouteName="Beranda"
    >
      <Tab.Screen 
        name="Beranda" 
        component={Home}
        options={{
          tabBarLabel: 'Beranda',
        }}
      />
      <Tab.Screen 
        name="Kupon" 
        component={KuponWithGuestCheck}
        options={{
          tabBarLabel: 'Kupon',
        }}
      />
      <Tab.Screen 
        name="Voucher" 
        component={VoucherWithGuestCheck}
        options={{
          tabBarLabel: 'Voucher',
        }}
      />
      <Tab.Screen 
        name="Membership" 
        component={MembershipWithGuestCheck}
        options={{
          tabBarLabel: 'Membership',
        }}
      />
      <Tab.Screen 
        name="Setting"
        component={UserSetting} 
        options={{
          tabBarLabel: 'Setting',
        }}
      />
    </Tab.Navigator>
  );
};

// Main MyTabs component with UserProvider
const MyTabs = () => {
  return (
    <UserProvider>
      <MyTabsContent />
    </UserProvider>
  );
};

// Main Router Component dengan UserProvider di level tertinggi
const Router = () => {
  return (
    <UserProvider>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />
        <Stack.Screen
          name="Home"
          component={MyTabs}
        />
        <Stack.Screen
          name="Login"
          component={Login}
        />
        <Stack.Screen
          name="LoginGuest"
          component={LoginGuest}
        />
         <Stack.Screen
          name="HomeWithTabs"
          component={HomeWithTabs}
        />
               <Stack.Screen
          name="LoginAccount"
          component={LoginAccount}
        />
        <Stack.Screen
          name="Register"
          component={Register}
        />
        <Stack.Screen
          name="MembershipPage"
          component={Membership}
        />
        <Stack.Screen
          name="KuponPage"
          component={KuponPage}
        />
        <Stack.Screen
          name="VoucherPage"
          component={VoucherPage}
        />
        <Stack.Screen
          name="BookMenu"
          component={BookMenu}
        />
        <Stack.Screen
          name="ReservationPage"
          component={ReservationPage}
        />
        <Stack.Screen
          name="ReserveTable"
          component={ReserveTable}
        />
        <Stack.Screen
          name="PaymentPage"
          component={PaymentPage}
        />
           
        <Stack.Screen
          name="FileViewerScreen"
          component={FileViewerScreen}
        />
        <Stack.Screen
          name="MyReservation"
          component={MyReservation}
        />
        <Stack.Screen
          name="UserSetting"
          component={UserSetting}
        />
         <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
        />
         <Stack.Screen
          name="InformationStructureScreen"
          component={InformationStructureScreen}
        />
        <Stack.Screen
          name="Camera"
          component={Cameras}
        />
        <Stack.Screen
          name="EditProfileScreen"
          component={EditProfileScreen}
        />
          <Stack.Screen
          name="PayslipScreen"
          component={PayslipScreen}
        />
          <Stack.Screen
          name="AktivitasScreen"
          component={AktivitasWithTabs}
        />
          <Stack.Screen
          name="ProfilScreen"
          component={ProfilWithTabs}
        />
          <Stack.Screen
          name="PengajuanLembur"
          component={PengajuanLembur}
        />
             <Stack.Screen
          name="RiwayatKehadiranScreen"
          component={RiwayatWithTabs}
        />
          <Stack.Screen
          name="PengajuanCuti"
          component={PengajuanCuti}
        />
          <Stack.Screen
          name="AbsenSuccessScreen"
          component={AbsenSuccessScreen}
        />
        <Stack.Screen
          name="PengajuanIzin"
          component={PengajuanIzin}
        />
        <Stack.Screen
          name="EditUserProfile"
          component={EditUserProfile}
        />
        <Stack.Screen
          name="DataQR"
          component={DataQR}
        />
        <Stack.Screen
          name="WaitingList"
          component={WaitingList}
        />
      </Stack.Navigator>
    </UserProvider>
  );
};

export default Router;