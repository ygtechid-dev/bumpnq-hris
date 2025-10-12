import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Logo from '../../assets/logoloffee.png'
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { API_URL } from '../../context/APIUrl';

const MyReservation = ({ navigation, route }) => {
  const [dataFindSelf, setDataFindSelf] = useState({});
  const [transactionData, setTransactionData] = useState([]); // State to hold transaction data
  const [dataKontak, setDataKontak] = useState("");

  // Function to fetch user data from AsyncStorage
  const getDats = async () => {
    const getData = await AsyncStorage.getItem('@dataSelf');
    const parsingData = JSON.parse(getData);
    console.log('DTS', parsingData);
    setDataFindSelf(parsingData);
    return parsingData;
  };

  // Function to fetch transaction data from API
  const getTransactionData = async (userEmail) => {
    try {
      const response = await axios.get(`${API_URL}/api/reservations`);
      
      console.log('Full API Response:', response.data.data);
      
      // Filter reservations based on user email
      const filteredTransactions = response.data.data.filter(
        (transaction) => transaction.customer_email === userEmail
      );
      console.log('filterr', filteredTransactions);
      

      setTransactionData(filteredTransactions);
      console.log('Filtered Transaction Data:', filteredTransactions);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      alert('Failed to fetch reservations. Please check your connection.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch user data
      const userData = await getDats();
      
      // Fetch contact info
      const getContact = async () => {
        const get = await AsyncStorage.getItem('kontak')
        const parsingKontak = JSON.parse(get)
        console.log('parsingkonts', parsingKontak);
        setDataKontak(parsingKontak)
      }
      getContact();

      // Fetch transactions if user email exists
      if (userData && userData[0] && userData[0].email) {
        getTransactionData(userData[0].email);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F0' }}>
      <ScrollView>
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <Image source={Logo} style={{ width: 150, height: 75 }} />
          <View style={{ justifyContent: 'space-between', marginLeft: 10, marginTop: -5 }}>
            {dataFindSelf.length > 0 && (
              <Text style={styles.txtHead}>{'Hello, ' + dataFindSelf[0].namaLengkap}</Text>
            )}
            <Text style={[styles.txtHead, { marginTop: 0 }]}>{'Here your Reservation List'}</Text>
          </View>

          <View style={{ marginTop: 20, marginHorizontal: 16 }}>
            {transactionData.length > 0 ? (
              transactionData.map((transaction, index) => (
                <View
                  key={index}
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    backgroundColor: 'white',
                    borderColor: '#7F6000',
                    borderWidth: 1,
                    marginBottom: 10,
                    padding: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}
                >
                  <View>
                    <Text style={styles.txtBoxBold}>#{transaction.reservation_id}</Text>
                    <Text style={styles.txtDesc}>
                      {transaction.reservation_date + "   |   " + 
                       transaction.start_hour + ":00 - " + 
                       transaction.end_hour + ":00"}
                    </Text>
                    <Text style={styles.txtBoxBold}>
                      {'Seat ' + transaction.seat_id}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={{
                      width: 80, 
                      height: 80, 
                      borderRadius: 20, 
                      backgroundColor: 
                        transaction.status === 'pending' ? 'orange' :
                        transaction.status === 'completed' ? 'green' :
                        transaction.status === 'cancelled' ? 'red' : 'white',
                    }}
                  >
                    <Text style={styles.txtBoxStts}>{transaction.status}</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.txtDesc}>No reservations found.</Text>
            )}
          </View>

          <View style={{flexDirection: 'row', marginHorizontal: 20, marginTop: 20}}>
            <Text style={styles.descHead}>{'Want a reschedule?'}</Text>
            <Text 
              onPress={() => Linking.openURL('https://wa.me/' + dataKontak)}
              style={[styles.txtHead, {
                fontSize: 14,
                marginTop: 10,
                marginLeft: 5,
                color: '#7F6000',
              }]}
            >
              Contact Us
            </Text>
          </View>

          <View style={{marginTop: 5, marginHorizontal: 20}}>
            <Text style={[styles.descHead, {
              marginTop: -20,
              fontSize: 12,
            }]}>
              {'Terms & Condition for reschedule:'}
            </Text>
            <Text style={[styles.descHead, {
              marginTop: -20,
              fontSize: 12
            }]}>
              {'- Maksimal waktu reschedule H-2'}
            </Text>

            <Text style={[styles.descHead, {
              marginTop: -20,
              fontSize: 12
            }]}>
              {'- Loffee dapat menolak Reservasi'}
            </Text>

            <Text style={[styles.descHead, {
              marginTop: -20,
              fontSize: 12
            }]}>
              {'- Loffee dapat mengganti jadwal dengan konfirmasi customer'}
            </Text>

            <TouchableOpacity 
              style={styles.btnCanc} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.txtBtn}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MyReservation;

const styles = StyleSheet.create({
  txtHead: { color: '#7F6000', fontFamily: 'Poppins-Bold', fontSize: 16, marginTop: 30 },
  txtBoxBold: { color: '#7F6000', fontFamily: 'Poppins-Bold', fontSize: 14 },
  txtBoxStts: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 10, textAlign: 'center', marginTop: 30 },
  descHead: {color: '#7F6000',  fontSize: 14,  fontFamily: 'Poppins-Medium', marginBottom: 30, marginTop: 10, },
  btnCanc: {backgroundColor: '#7F6000', width: '40%', height: 40, alignSelf: 'flex-start',  marginBottom: 10, borderRadius: 8, marginTop: 5, marginHorizontal: 0},
  txtBtn: {textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'},
  txtDesc: { color: '#7F6000', fontFamily: 'Poppins-Light', fontSize: 12, marginTop: 5 },
});