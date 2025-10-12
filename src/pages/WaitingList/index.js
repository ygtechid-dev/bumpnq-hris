import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Logo from '../../assets/logoloffee.png'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { ref, update, get } from 'firebase/database';
import { database } from '../../config/Fire';
import { conversiDateTimeIDN } from '../../context/DateTimeServices';

const WaitingList = ({ navigation, route }) => {
  const [dataFindSelf, setDataFindSelf] = useState({});
  const [dataKontak, setDataKontak] = useState('');
  const [currentLastNomor, setCurrentLastNomor] = useState(route.params.lastNomor || '');
  const [currentWaitingText, setCurrentWaitingText] = useState('Here your Waiting List');

  const { data, nomorWait, lastNomor, tanggalWL} = route.params;

  const getDats = async () => {
    const getData = await AsyncStorage.getItem('@dataSelf');
    const parsingData = JSON.parse(getData);
    setDataFindSelf(parsingData);
  };

  const refreshData = async () => {
    
  try {
    // Firebase v9 - get waiting list data
    const waitingListRef = ref(database, 'waitingList');
    const snapshot = await get(waitingListRef);
    
    if (snapshot.exists()) {
      const rawData = snapshot.val();
      
      console.log('rawdd', rawData);
      
      // Filter data dengan statusCalled = "Call" dan nama_outlet sesuai
      const filteredData = Object.values(rawData).filter(
        (item) => item.statusCalled === true && item.info.nama_outlet === data.nama_outlet
      );

      console.log('Filtered waiting list:', filteredData);
      
      if (filteredData.length > 0) {
        // Ambil lastNomor tertinggi dari hasil filter
        const newLastNomor = filteredData
          .map((item) => item.nomorWaiting)
          .sort((a, b) => {
            // Sort berdasarkan nomor (B01, B02, etc.)
            const numA = parseInt(a.replace('B', ''));
            const numB = parseInt(b.replace('B', ''));
            return numB - numA;
          })[0];

        setCurrentLastNomor(newLastNomor);
        
        // Update teks jika nomorWait sama dengan nomor terakhir
        setCurrentWaitingText(
          nomorWait === newLastNomor ? "You're called" : 'Here your Waiting List'
        );
      } else {
        setCurrentLastNomor(null);
        setCurrentWaitingText('Here your Waiting List');
      }
    } else {
      console.log('No waiting list data available');
      setCurrentLastNomor(null);
      setCurrentWaitingText('Here your Waiting List');
    }
  } catch (error) {
    console.error('Error refreshing waiting list:', error);
    // Keep current state on error
  }
};


  useEffect(() => {
    getDats();
    const getContact = async () => {
      const get = await AsyncStorage.getItem('kontak');
      const parsingKontak = JSON.parse(get);
      setDataKontak(parsingKontak);
    };
    getContact();
  }, []);

  useEffect(() => {
    // Perbarui teks saat komponen pertama kali dimuat
    setCurrentWaitingText(nomorWait === lastNomor ? "You're called" : 'Here your Waiting List');
  }, [nomorWait, lastNomor]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F0' }}>
      <ScrollView>
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <Image source={Logo} style={{ width: 150, height: 75 }} />
          <View style={{ justifyContent: 'space-between', marginLeft: 10, marginTop: -5 }}>
            {dataFindSelf.length > 0 && (
              <Text style={styles.txtHead}>{'Hello, ' + dataFindSelf[0].namaLengkap}</Text>
            )}
            <Text style={[styles.txtHead, { marginTop: 0 }]}>{currentWaitingText}</Text>
          </View>

          <View
            style={{
              width: '100%',
              height: 100,
              marginTop: 10,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: '#7F6000',
            }}
          >
            <Text style={[styles.txtHead, { textAlign: 'center' }]}>{data.nama_outlet}</Text>
            <Text style={[styles.txtHead, { textAlign: 'center', marginTop: -5 }]}>
              {conversiDateTimeIDN(tanggalWL)}
            </Text>
          </View>

          <View
            style={{
              width: 130,
              height: 130,
              backgroundColor: '#7F6000',
              borderRadius: 10,
              marginTop: 20,
              alignSelf: 'center',
            }}
          >
            <Text
              style={[
                styles.txtHead,
                {
                  textAlign: 'center',
                  color: 'white',
                  fontSize: 40,
                },
              ]}
            >
              {nomorWait}
            </Text>
          </View>
          <Text style={[styles.txtHead, { marginTop: 16, textAlign: 'center' }]}>
            {'Current Waiting List'}
          </Text>

          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: 'white',
              borderRadius: 10,
              marginTop: 20,
              alignSelf: 'center',
              borderWidth: 1,
              borderColor: '#7F6000',
            }}
          >
            <Text
              style={[
                styles.txtHead,
                {
                  textAlign: 'center',
                  color: '#7F6000',
                  fontSize: 30,
                },
              ]}
            >
              {currentLastNomor}
            </Text>
          </View>

          <Text style={[styles.txtDesc, { textAlign: 'center', marginHorizontal: 20 }]}>
            Please standby when your waiting number approaching the queue number, failed to
            respond within 3 times called, seat will be given to next waiting list number
          </Text>

          <TouchableOpacity
            style={{
              alignSelf: 'center',
              marginTop: 20,
              backgroundColor: '#7F6000',
              padding: 10,
              borderRadius: 10,
            }}
            onPress={refreshData}
          >
            <Text style={[styles.txtInsideBtn]}>Refresh</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignSelf: 'center', marginTop: 20 }}>
            <Text style={styles.descHead}>{'Have Trouble in application?'}</Text>
            <Text
              onPress={() => Linking.openURL('https://wa.me/' + dataKontak)}
              style={[
                styles.txtHead,
                {
                  fontSize: 14,
                  marginTop: 10,
                  marginLeft: 5,
                  color: '#7F6000',
                },
              ]}
            >
              Contact Us
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default WaitingList;

const styles = StyleSheet.create({
  txtHead: { color: '#7F6000', fontFamily: 'Poppins-Bold', fontSize: 16, marginTop: 30 },
  txtInsideBtn: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    textAlign: 'center',
  },
  descHead: {
    color: '#7F6000',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginBottom: 30,
    marginTop: 10,
    textAlign: 'center',
  },
  txtDesc: { color: '#7F6000', fontFamily: 'Poppins-Light', fontSize: 12, marginTop: 10 },
});
