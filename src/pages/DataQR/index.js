import { StyleSheet, Text, View, BackHandler, ActivityIndicator, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import HeaderSecond from '../../component/Header/HeaderSecond';
import { conversiDateTimeIDN } from '../../context/DateTimeServices';
import ButtonRegGreenLarge from '../../component/Button/ButtonRegGreenLarge';
import axios from 'axios';
import moment from 'moment';
import { Modal } from 'react-native-paper';
import { API_URL } from '../../context/APIUrl';
import LottieView from 'lottie-react-native'


const DataQR = ({ route, navigation }) => {
  
  const {data} = route.params;
  console.log('data.nama', data);
  const [inputan, setInput] = useState({
    kodebooking: data.nisn,
    namalengkap: data.nama,
    noidentitas: data.kelas
    
  })


  const handleSimpan = async () => {


try {
  axios.post('https://ygtechdev.azurewebsites.net/sendMessage', {
    remoteJid: data.nomor + '@s.whatsapp.net',
    text: "Yth. Orang Tua dari Siswa atasnama " + data.nama + "\n \nKami dari *Annur Islamic Fullday School* menginformasikan bahwa siswa atasnama " + data.nama + " telah hadir di Kelas Hari ini. \n\nTerima Kasih"
  }).then((res) => {
    console.log('responWA', res);
alert('Berhasil Simpan')
  navigation.replace('Home')

  })
} catch (err) {
  alert('Gagal Simpan')
}

  }
  return (
    <>
    
      <View style={{ flex: 1, backgroundColor: 'white' }}>
          <HeaderSecond title="Data Absen Siswa" desc="Konfirmasi Data Siswa" onPressed={() => navigation.goBack()} />

          <View style={{ marginHorizontal: 16, marginTop: 10 }}>
          <Text style={{ color: 'black', fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 5 }}>Nomor Induk Siswa</Text>
              <View style={styles.form}>
              <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Nomor Induk Siswa"
            value={inputan.kodebooking}
            onChangeText={(e) => setInput({ ...inputan, kodebooking: e })}  
          />
              </View>
              
              <Text style={{ color: 'black', fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 15 }}>Nama Lengkap</Text>
              <View style={styles.form}>
              <TextInput
              editable={false}
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Nama Lengkap"
            value={inputan.namalengkap}
            onChangeText={(e) => setInput({ ...inputan, namalengkap: e })}  
          />
              </View>

              <Text style={{ color: 'black', fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 15 }}>Kelas</Text>
              <View style={styles.form}>
              <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Kelas"
            value={inputan.noidentitas}
            onChangeText={(e) => setInput({ ...inputan, noidentitas: e })}  
          />
              </View>


              {/* <Text style={{ color: 'black', fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 15 }}>Tanggal Registrasi</Text>
              <View style={styles.form}>
                  <Text style={{ color: 'black', marginTop: 3, fontFamily: 'Poppins-Light', fontSize: 12 }}>{conversiDateTimeIDN(data.register_date)}</Text>
              </View> */}

              <ButtonRegGreenLarge title="Absen" onPressed={() => handleSimpan()} />

              
          </View>
      </View>
      {/* <Modal visible={loading}>
    <ActivityIndicator size="large" color="black" />
                </Modal> */}
    </>
  );
};

export default DataQR;

const styles = StyleSheet.create({
  form: {
      width: '100%',
      height: 50,
      borderRadius: 10,
      marginTop: 10,
      backgroundColor: 'white',
      borderWidth: 0.5,
      borderColor: 'black',
      padding: 12,
      textAlign: 'center',
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 5,
      },
      shadowOpacity: 0.34,
      shadowRadius: 6.27,
      elevation: 10,
  },
  txtInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    marginTop: -8,
 
    marginHorizontal: 0,
    width: '90%',
    height: 40,
    color: 'black'
  },
});
