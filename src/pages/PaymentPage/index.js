/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';

import Logo from '../../assets/logoloffee.png'
import LogoQRIS from '../../assets/qris.png';
import LogoBCA from '../../assets/logobca.png';
import ICwait from '../../assets/iconwait.png';
import { Buffer } from 'buffer';
import LogoBNI from '../../assets/logobni.jpg';
import LogoGopay from '../../assets/logogopay.png';
import { Modal } from 'react-native-paper';
import { formatRupiah } from '../../context/DateTimeServices';
import axios from 'axios';
import { ref, get } from 'firebase/database';
import { database } from '../../config/Fire';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '../../context/APIUrl';



const PaymentPage = ({navigation, route}) => {
  const [inputan, setInput] = useState({
    email: "",
    password: "",
    
  })
  const {dataTamu, seat, outlets, floorData, dataRspv, orderId} = route.params;
  console.log('DATASEAT', seat);
  console.log('DATATAMU', dataTamu);
 const originalData = {
seatId: seatText,
            dateSelect: dataTamu.rsvp_date,
            hour_slot: dataTamu.hours_start
 }
 console.log('ordata', originalData);
 
  
 const transformData = (dataTamu) => {
  // Error handling for seat (assuming seat is an array)
  const seatId = Array.isArray(seat) ? `${seat.join(", ")}` : '';
  
  // Error handling for date
  let dateSelect = '';
  try {
    if (dataTamu.dateSelect) {
      const [day, month, year] = dataTamu.dateSelect.split('-');
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      dateSelect = `${year}-${monthMap[month]}-${day.padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error transforming date:', error);
  }
  
  // Error handling for hour slot
  let hour_slot = '';
  try {
    if (dataTamu.hour_slot) {
      hour_slot = parseInt(dataTamu.hour_slot.split(':')[0]);
    }
  } catch (error) {
    console.error('Error transforming hour slot:', error);
  }
  
  return {
    seatId,
    dateSelect,
    hour_slot
  };
};

// Example usage
// const originalData = {
//   seat: [2],
//   rsvp_date: '12-Apr-2025',
//   hours_start: '17:00'
// };

const transformedData = transformData(originalData);
console.log(transformedData);
console.log('dDXXXX', transformedData);
    // Log seluruh route.params untuk melihat apa yang diteruskan
  const [loading, setLoading]= useState(false)
  const [visiblePayment, setVisiblePayment]= useState(false)

  const [hidePassword, setHidePassword] = useState(true);
  const [kodePembayaran, setKodePembayaran] = useState("");
  const [dataKontak, setDataKontak] = useState("");

  const [dataPayment, setDataPayment] = useState([]);


  const [dataPembayaran, setDataPembayaran] = useState({});
  const [seconds, setSeconds] = useState(600);

  const seatText = `${seat.join(", ")}`;
  const [texts, setTexts] = useState('');

   


  const updateSeatsStatus = async () => {
     const statuses = "available"
     
     try {
      await axios.put(`${API_URL}/api/reservations/${dataRspv}/status`, {
        status: 'cancelled' // atau 'confirmed', 'completed', 'pending'
      }).then((res) => {
        console.log('resss', res.data);
        alert('Waktu Habis. Silahkan Pesan Ulang')
    navigation.push('Home')
        
    }).catch((err) => {
      console.log('dccc', err.response.data);
      
    })
} catch (err) {
  console.log('dccc', err.response.data);
}
  }

  const createMidtransTransaction = async (type) => {
    const getData = await AsyncStorage.getItem('@dataSelf')
    const parsingData = JSON.parse(getData);
    setLoading(true)
    setVisiblePayment(true);
   
    setKodePembayaran(orderId)

   
    const MIDTRANS_SERVER_KEY = 'Mid-server-QvzOpNOLQzsX6uo8yxWt22pl'; //RUNNING
    // const MIDTRANS_SERVER_KEY = 'SB-Mid-server-9ZSXCVwF3FCIYb0848ArIxKF'; // SANDBOX
     // Ganti dengan Server Key Anda
    const MIDTRANS_URL = 'https://api.midtrans.com/v2/charge'; 
    // const MIDTRANS_URL = 'https://api.sandbox.midtrans.com/v2/charge'; // Untuk Production, ganti dengan URL yang sesuai
    // Untuk Production, ganti dengan URL yang sesuai
    const grossAmount = outlets.harga_dp * parseInt(dataTamu.person);
    console.log('GRRRR', grossAmount);
    
    const currentTime = new Date();
    
    // Format waktu order sesuai dengan format yang diminta
    const orderTime = currentTime.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }) + ' +0700'; // Menggunakan timezone +0700
    const expiryDuration = 60; // Durasi kedaluwarsa dalam menit (3 jam)
    
    let transactionData;

    // Menentukan jenis transaksi berdasarkan type
    if (type === 'bca' || type === 'bni') {
        transactionData = {
           

           
              "payment_type": "bank_transfer",
              "transaction_details": {
                  "gross_amount": grossAmount, 
                  "order_id": orderId
              },
              "customer_details": {
                  "email": parsingData[0].email,
                  "first_name": "Loffee",
                  "last_name": parsingData[0].namaLengkap,
                  "phone": parsingData[0].handphone
              },
              "item_details": [
                  {
                      "id": "001",
                      "price": grossAmount,
                      "quantity": 1,
                      "name": "Product Loffee"
                  }
              ],
              "bank_transfer": {
                  "bank": type,
                  "va_number": "111111"
              },
              "custom_expiry": {
                  "order_time": orderTime,  // waktu transaksi
                  "expiry_duration": 10,                  // durasi masa berlaku
                  "unit": "minutes"                         // unit waktu (minute, hour, or day)
              }
         
          
        };
    } else if (type === 'qris' || type === 'gopay') {
        transactionData = {
            payment_type: type, // Menggunakan type untuk menentukan metode pembayaran
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
                // gross_amount: 1000,

            },
            // Jika type adalah qris atau gopay, tambahkan deskripsi
            ...(type === 'qris' ? { qris: { acquirer: 'gopay'}} : {}),
            ...(type === 'gopay' ? { gopay: { acquirer: 'gopay'}} : {}),
        };
    } else {
        throw new Error('Unsupported payment type');
    }

    // Encode server key ke Base64
    const base64Key = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
    console.log('Transaction Data QR:', transactionData);
    console.log(' base64Key:', base64Key);

    try {
        const response = await axios.post(MIDTRANS_URL, transactionData, {
            headers: {
                Authorization: `Basic ${base64Key}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('ResponseQRBaru:', response.data);
        const getData = await AsyncStorage.getItem('@dataSelf')
        const parsingData = JSON.parse(getData);
        if  (type === 'qris' || type === 'gopay') {
          console.log('dataHASiLMidtrans', response.data);
          
          setDataPembayaran(response.data);

          const prefix = "TRX"
          const uniquenumber = Math.floor(Math.random() * 1000000);
          const idOrder = prefix + uniquenumber
          const jsObj = {
            trx_id: idOrder,
            place: dataTamu.place,
            person: dataTamu.person,
            id_user: parsingData[0].uid,
            status: response.data.transaction_status,
            tanggal_transaksi: moment().format('YYYY-MM-DD'),
            jam_transaksi: moment().format('HH:mm:ss'),
            pay_type: response.data.payment_type,
            tanggal_book: dataTamu.rsvp_date,
            jam_book_awal: dataTamu.hours_start,
            jam_book_akhir: dataTamu.hours_end,
            uang_rsvp: outlets.harga_dp * parseInt(dataTamu.person),
            seat: seatText,
            payment_id: orderId,
            floor: floorData

           }


           
       
          try {
            axios.post(`${API_URL}/api/transactions`, jsObj).then((res) => {
              console.log('berhasilsimpandatsss', res.data );
          setLoading(false)
              
            }).catch((err) => {
              console.log('errr', err.response.data.message);
              
            }) 
          } catch {
            console.log('errr', err.response.data.message);
            
          }
        } else {
          setDataPembayaran(response.data);
          setTexts(response.data.va_numbers[0].va_number)

          console.log('dataHASiLMidtrans', response.data);
          const getData = await AsyncStorage.getItem('@dataSelf')
          const parsingData = JSON.parse(getData);

          const prefix = "TRX"
          const uniquenumber = Math.floor(Math.random() * 1000000);
          const idOrder = prefix + uniquenumber

          const jsObj = {
            trx_id: idOrder,
            place: dataTamu.place,
            person: dataTamu.person,
            id_user: parsingData[0].uid,
            status: response.data.transaction_status,
            tanggal_transaksi: moment().format('YYYY-MM-DD'),
            jam_transaksi: moment().format('HH:mm:ss'),
            pay_type: response.data.payment_type,
            tanggal_book: dataTamu.rsvp_date,
            jam_book_awal: dataTamu.hours_start,
            jam_book_akhir: dataTamu.hours_end,
            uang_rsvp: outlets.harga_dp * parseInt(dataTamu.person),
            seat: seatText,
            payment_id: orderId,
            floor: floorData


           }


           console.log('kirimanBANK', jsObj);
           
         
          try {
            axios.post(`${API_URL}/api/transactions`, jsObj).then((res) => {
              console.log('berhasilsimpandata', res.data );
          setLoading(false)
              
            }).catch((err) => {
              console.log('errrTRX', err.response);
              
            }) 
          } catch {
            console.log('errr', err.response.data);
            
          }
          
        }
    setLoading(false)
        
        return response.data; // Kembalikan data dari Midtrans
    } catch (error) {
    setLoading(false)

        console.error('Error creating transaction:', error.response);
        throw error; // Throw error untuk ditangani di tempat lain
    }
};



  const MIDTRANS_SERVER_KEY = 'Mid-server-QvzOpNOLQzsX6uo8yxWt22pl'; //RUNNING
  // const MIDTRANS_SERVER_KEY = 'SB-Mid-server-9ZSXCVwF3FCIYb0848ArIxKF'; // SANDBOX
console.log('kode', kodePembayaran);


  const fetchTransactionStatus = async () => {
    console.log('fff', dataRspv);
    
    try {
      const res = await axios.get(`https://api.midtrans.com/v2/${kodePembayaran}/status`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')}`,
        },
      });
      // setResponse(res.data);
      console.log('resFETCH', res.data.transaction_status);
      if(res.data.transaction_status == "pending") {
        alert('Pembayaran Belum Diterima. Silahkan Melakukan Pembayaran ke Nomor yang tertera')
      } else if(res.data.transaction_status == "settlement") {
        alert('Status Pembayaran anda : Berhasil \nTerima Kasih sudah Reservasi Menggunakan LOFFEE MOBILE :)')
       
        const transformedData = transformData(originalData);

       
        try {
          const response = await axios.put(`${API_URL}/api/reservations/${dataRspv}/status`, {
            status: 'completed',
            seatId: transformedData.seatId,
            dateSelect: transformedData.dateSelect,
            hour_slot: transformedData.hour_slot
          });
        
          console.log('Update Status Berhasil:', response.data);
          navigation.push('Home');
        } catch (err) {
          // Error handling yang lebih komprehensif
          if (err.response) {
            // Server merespons dengan status error
            console.error('Error Response:', {
              status: err.response.status,
              data: err.response.data,
              headers: err.response.headers
            });
        
            // Tampilkan pesan error dari server
            alert('Gagal memperbarui status reservasi');
          } else if (err.request) {
            // Request terkirim, tapi tidak ada response
            console.error('No Response Received:', err.request);
            alert('Tidak ada respon dari server');
          } else {
            // Terjadi error saat setup request
            console.error('Error Setting Up Request:', err);
            alert('Terjadi kesalahan: ' + err);
          }
        }
        // Contoh request untuk update status
        
        
      }
      
    } catch (error) {
      console.error(error);
      // setResponse({ status_message: 'Error fetching transaction status' });
    }
  }


   


   
   
 
    
      

    

     


  // if(inputan.email == "admin@gmail.com" && inputan.password == "admin") {
  //     navigation.navigate('Home')
  
  //     console.log('token', token);
  // } else {
  //     alert('Email dan Password Salah!')
  // }
  
  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };
  const handleRegister = async () => {
    
       navigation.navigate('Register')
      
   }
   const pdfUri = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'; // URL atau path lokal ke file PDF
   const getLogo = (paymentType) => {
    switch (paymentType) {
      case 'bca':
        return LogoBCA;
      case 'bni':
        return LogoBNI;
      case 'gopay':
        return LogoGopay;
      case 'qris':
        return LogoQRIS;
      default:
        return null; // Kembalikan null jika tipe tidak dikenali
    }
  };

  const handleTimeUp = async () => {
    alert('Waktu Habis! Silahkan Melakukan Reservasi Ulang');
    // Aksi lain seperti navigasi ke halaman lain
    await updateSeatsStatus()
    navigation.replace('Home');
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getDataPayment = async () => {
  setLoading(true);
  
  try {
    // Firebase v9 syntax
    const dbRef = ref(database, 'bankaccount/');
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const value = snapshot.val();
      console.log('Payment data:', value);
      
      // Convert to array using Object.values (lebih simple)
      const datled = Object.values(value);
      
      console.log('Processed payment data:', datled);
      setDataPayment(datled);
    } else {
      console.log('No payment data available');
      setDataPayment([]);
    }
  } catch (error) {
    console.error('Error getting payment data:', error);
    setDataPayment([]);
  } finally {
    setLoading(false);
  }
};


  

  useEffect(() => {
    getDataPayment()
    const getContact = async () => {
      const get = await AsyncStorage.getItem('kontak')
      const parsingKontak = JSON.parse(get)
      console.log('parsingkonts', parsingKontak);
      setDataKontak(parsingKontak)
    }

    getContact()
  }, [])
  

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(interval); // Bersihkan interval saat komponen unmount
    } else {
      // Aksi ketika timer selesai
      handleTimeUp();
    }
  }, [seconds])

  return (
    <View style={styles.container}>
        <ScrollView>
        <View
        style={styles.wrapper}>
        <>
         
      
      
      <View style={styles.wrapHeader}>
      <Image source={Logo} style={{width: 200, height: 100, alignSelf:'center'}} />
      <Text style={[styles.txtHead, {
      textAlign: 'center',
      marginTop: 10
    }]}>{`Selesaikan Pembayaran Dalam \n ${formatTime(seconds)}`}</Text>
      </View>

      <View style={{marginHorizontal: 16, marginTop: 20}}>
      <Text style={[styles.txtHead, {
        marginTop: 10
      }]}>{dataTamu.place}</Text>

<Text style={[styles.txtHead, {
        marginTop: 10
      }]}>{'Date : ' + dataTamu.rsvp_date }</Text>

<Text style={[styles.txtHead, {
        marginTop: 10
      }]}>{'Hours : ' + dataTamu.hours_start + "-" + dataTamu.hours_end }</Text>

<Text style={[styles.txtHead, {
        marginTop: 10
      }]}>{seatText + "  |   Floor " + floorData}</Text>

<Text style={[styles.txtHead, {
        marginTop: 10
      }]}>{'Down Payment : ' + formatRupiah(outlets.harga_dp * parseInt(dataTamu.person)) }</Text>

      </View>


      <View style={{marginTop: 20, marginHorizontal: 16}}>
        {dataPayment.length > 0 ?
        dataPayment.map((i, index) => {
          return (
            <TouchableOpacity onPress={() => createMidtransTransaction(i.code)} style={{width: '100%', marginTop: 10,height: 60, borderWidth: 2, borderRadius: 10, borderColor: '#7F6000'}}>
            <Image source={{uri: i.pict_bank}} style={{alignSelf: 'center', width: 135, height: 40, marginTop: 5}} />
          </TouchableOpacity>
          )
        })  
        :
        null
      }
      

        {/* <TouchableOpacity onPress={() => createMidtransTransaction("bca")} style={{width: '100%', marginTop: 10, height: 60, borderWidth: 2, borderRadius: 10, borderColor: '#7F6000'}}>
          <Image source={LogoBCA} style={{alignSelf: 'center', width: 120, height: 40, marginTop: 5}} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => createMidtransTransaction("bni")} style={{width: '100%', marginTop: 10, height: 60, borderWidth: 2, borderRadius: 10, borderColor: '#7F6000'}}>
          <Image source={LogoBNI} style={{alignSelf: 'center', width: 120, height: 40, marginTop: 5}} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => createMidtransTransaction("gopay")} style={{width: '100%', marginTop: 10, height: 60, borderWidth: 2, borderRadius: 10, borderColor: '#7F6000'}}>
          <Image source={LogoGopay} style={{alignSelf: 'center', width: 120, height: 40, marginTop: 5}} />
        </TouchableOpacity> */}
      </View>
    
      <View style={{flexDirection: 'row', alignSelf: 'center', marginTop: 20}}>
         <Text style={styles.descHead}>{'Have Trouble in application?'}</Text>
         <Text 
       onPress={() => Linking.openURL('https://wa.me/' + dataKontak)}
         style={[styles.txtHead, {
          fontSize: 14,
          marginTop: 10,
          marginLeft: 5,
          color: '#7F6000',
          
         }]}>Contact Us</Text>
         </View>
        
    
       
     {/* <TouchableOpacity style={styles.btn} 
             onPress={() => navigation.goBack()}
              >
        <Text style={styles.txtBtn} >Back</Text>
    </TouchableOpacity> */}

       
   <Modal visible={visiblePayment} >
    {dataPembayaran.payment_type ? dataPembayaran.payment_type  == "bank_transfer" ?
     <View style={{backgroundColor: 'white', width: 300, alignSelf: 'center', borderRadius: 10}}>
     <Image source={dataPembayaran.va_numbers ? getLogo(dataPembayaran.va_numbers[0].bank ) : null } style={{alignSelf: 'center', width: 120, height: 40, marginTop: 16}} />
     <Text style={[styles.txtHead, {
     marginTop: 10,
     color: 'black',
     textAlign: 'center',
     fontSize: 12
   }]}>{"Virtual Account"}</Text>
 
   <Text style={[styles.txtHead, {
     marginTop: 5,
     textAlign: 'center',
     fontSize: 12,
     color: 'red'
   }]}>{`Selesaikan Pembayaran Dalam \n ${formatTime(seconds)}`}</Text>
<Text style={[styles.txtHead, {
     marginTop: 20,
     textAlign: 'center',
     fontSize: 12
   }]}>{"Status"}</Text>

<Text style={[styles.txtHead, {
     marginTop: 5,
     textAlign: 'center',
     fontSize: 16,
     color: 'red'
   }]}>{dataPembayaran.transaction_status ? dataPembayaran.transaction_status : ""}</Text>

<Text style={[styles.txtHead, {
     marginTop: 20,
     textAlign: 'center',
     fontSize: 12,
     width: '90%',
     marginLeft: 12
   }]}>{"Silahkan melakukan pembayaran ke nomor berikut"}</Text>


<Text style={[styles.txtHead, {
     marginTop: 5,
     textAlign: 'center',
     fontSize: 16,
     color: 'red'
   }]}>{dataPembayaran.va_numbers ? dataPembayaran.va_numbers[0].va_number : null}</Text>


<Image source={ICwait} style={{alignSelf: 'center', width: 120, height: 90, marginTop: 5}} />
<TouchableOpacity style={styles.btn} 
          onPress={() => fetchTransactionStatus()}
           >
     <Text style={styles.txtBtn} >Sudah Transfer</Text>
 </TouchableOpacity>
     </View>
     :
     <View style={{backgroundColor: 'white', height: 400, width: 300, alignSelf: 'center', borderRadius: 10}}>
     <Image source={dataPembayaran.payment_type ? getLogo(dataPembayaran.payment_type) : null } style={{alignSelf: 'center', width: 120, height: 40, marginTop: 16}} />
  



<Text style={[styles.txtHead, {
     marginTop: 20,
     textAlign: 'center',
     fontSize: 12,
     width: '90%',
     marginLeft: 12
   }]}>{"Silahkan scan QR Berikut ini"}</Text>


{dataPembayaran.actions && 
  <Image source={{uri:dataPembayaran.actions[0].url }} style={{alignSelf: 'center', width: 200, height: 200, marginTop: 5}} />
}



<TouchableOpacity style={styles.btn} 
          onPress={() => fetchTransactionStatus()}
           >
     <Text style={styles.txtBtn} >Sudah Transfer</Text>
 </TouchableOpacity>
     </View>
     :
     null
  }
       
   </Modal>

   <Modal visible={loading}>
    <ActivityIndicator size="large" color="black"/>
   </Modal>
     

        </>
      </View>
        </ScrollView>
    
    </View>
    
     
  );
};

export default PaymentPage;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F7F0', },
  wrapper: {
    // alignItems: 'center',

   
    marginTop: 30,
  },
  containers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfViewer: {
    width: '100%',
    height: '100%',
  },
wrapHeader: {alignSelf: 'center'},
txtHead: {color: '#7F6000', fontFamily: 'Poppins-Bold', fontSize: 16,  marginTop: 30,},
txtDesc: {color: '#7F6000', fontFamily: 'Poppins-Light', fontSize: 14,  marginTop: 10, textAlign: 'center'},

descHead: {color: '#7F6000',  fontSize: 14,  fontFamily: 'Poppins-Medium', marginBottom: 30, marginTop: 10, textAlign: 'center'},
txtInput: {
  backgroundColor: 'white',
  borderRadius: 12,
  marginBottom: 8,
  borderWidth: 1,
  padding: 10,
  borderColor: '#E0E2EA',
  marginHorizontal: 20,
  width: '90%',
  color: 'black'
},
toggleButton: {
  position: 'absolute',
  right: 10,
  top: 40,
},
btn: {backgroundColor: '#7F6000', width: '80%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 24, marginHorizontal: 20},

toggleText: {
  color: '#2FBED4',
  fontSize: 14,
  fontWeight: '600',
  marginRight: 20,
  marginTop: -27
},

formInput: {
  marginVertical: 5
},
// txtInput: {
//   height: 50,
//   borderColor: '#020202',
//   borderWidth: 1,
//   borderRadius: 10,
//   paddingLeft: 10
// },
btn: {backgroundColor: '#7F6000', width: '80%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 8, marginHorizontal: 20},
txtBtn: {textAlign: 'center', marginTop:3, fontSize: 14, fontFamily: 'Poppins-Light', paddingVertical: 5, color: 'white', fontWeight: 'bold'}
});
