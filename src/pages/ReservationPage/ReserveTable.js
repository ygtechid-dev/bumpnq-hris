import { 
  Image, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  FlatList, 
  ActivityIndicator,
  BackHandler
} from 'react-native'
import React, {useEffect, useState} from 'react'
import Logo from '../../assets/logoloffee.png'
import { List, Modal } from 'react-native-paper'
import { getDate, formatDateNormal, getTimeOnly } from '../../context/DateTimeServices'
import axios from 'axios'
import { API_URL } from '../../context/APIUrl'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ReserveTable = ({navigation, route}) => {
  const {dataTamu, dataOutlets} = route.params;
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [respRspv, setRespRspv] = useState("");

  const [floorDatas, setFloorDatas] = useState("");
  const [seconds, setSeconds] = useState(300); // 5 menit = 300 detik

  console.log('dattam', dataOutlets);
  
  // Format tanggal reservasi ke format yang sesuai dengan API
  const formatDateForAPI = (dateString) => {
    // Mengubah format "DD-MM-YYYY" menjadi "YYYY-MM-DD"
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const formatDateForAPIs = (dateString) => {
    // Jika format seperti "28-Feb-2025"
    const dateParts = dateString.split('-');
    
    if (dateParts.length === 3) {
      const day = dateParts[0];
      const monthName = dateParts[1];
      const year = dateParts[2];
      
      // Konversi nama bulan ke nomor bulan
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const month = monthMap[monthName] || '01';
      
      // Format ulang menjadi YYYY-MM-DD
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
    
    // Jika tidak sesuai format yang diketahui, kembalikan string asli
    return dateString;
  };
  
  // Mengambil data availability dari API
  const getAvailabilityData = async () => {
    setLoading(true);
    try {
      const formattedDate = formatDateForAPIs(dataTamu.rsvp_date);
      
      const response = await axios.get(`${API_URL}/api/availability`, {
        params: {
          date: formattedDate,
          outlet_id: dataOutlets.id_outlet
        }
      });
  
      if (response.data.success) {
        console.log('Original API S:', response.data.data.floors);
        
        // Jika data sudah dalam format yang benar, gunakan langsung
        if (response.data.data && response.data.data.floors) {
          setFloors(response.data.data.floors);
        } else {
          console.error('Unexpected data format:', response.data);
          alert('Format data tidak sesuai yang diharapkan');
        }
      } else {
        console.error('API Error:', response.data.message);
        alert('Gagal memperoleh data ketersediaan: ' + response.data.message);
      }
    } catch (error) {
      console.error('Request Error:', error);
      alert('Terjadi kesalahan saat mengambil data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update status kursi (booking)
  

  // Handle pilih kursi
  const handleSelectSeat = async (seatId, floorId) => {
    const maxTables = Math.ceil(parseInt(dataTamu.person) / 2);  // 1 meja per 2 orang
    
    // Cek apakah kursi tersedia
    const floor = floors.find(f => f.floor_id === floorId);
    if (!floor) return;
    
    const seat = floor.seats.find(s => s.seat_id === seatId);
    if (!seat) return;
    
    // Cek status ketersediaan
    const hourKey = dataTamu.hours_start.split(':')[0];
    const seatStatus = seat.hour_slots[hourKey];
    
    if (seatStatus === 'booked') {
      alert('Kursi ini sudah dipesan');
      return;
    }
    
    if (selectedSeats.some(s => s.seatId === seatId && s.floorId === floorId)) {
      // Jika kursi sudah dipilih, hapus dari daftar
      setSelectedSeats(selectedSeats.filter(s => !(s.seatId === seatId && s.floorId === floorId)));
      setFloorDatas("");
    } else {
      // Batasi pilihan meja hanya sesuai dengan jumlah orang
      if (selectedSeats.length < maxTables) {
        setSelectedSeats([...selectedSeats, { seatId, floorId }]);
        setFloorDatas(floorId);
      } else {
        alert(`Anda hanya dapat memilih hingga ${maxTables} meja.`);
      }
    }
  };

  // Reset selected seats
  const resetSelectedSeats = async () => {
    setSelectedSeats([]);
  };

  // Handle timer selesai
  const handleTimeUp = () => {
    alert('Waktu Habis!');
    resetSelectedSeats();
    navigation.goBack();
  };

  // Format waktu
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle press accordion
  const handlePress = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };


  const generateOrderId = () => {
    const randomNumber = Math.floor(Math.random() * 1000000);
    return `LFID${randomNumber.toString().padStart(6, '0')}`;
};
const orderId = generateOrderId();


  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      alert('Silakan pilih kursi terlebih dahulu');
      return;
    }
  
    setLoading(true);
    try {
      // Perbarui status seat di API dan simpan reservation ID
      const reservationIds = await Promise.all(
        selectedSeats.map(seat => 
          updateSeatStatus(seat.seatId, seat.floorId, 'booked')
        )
      );
  
      // Filter reservation ID yang valid (bukan false)
      const validReservationIds = reservationIds.filter(id => id !== false);
  
      if (validReservationIds.length === selectedSeats.length) {
        // Lanjut ke halaman pembayaran
        navigation.replace('PaymentPage', {
          dataTamu: dataTamu,
          seat: selectedSeats.map(s => s.seatId),
          outlets: dataOutlets,
          floorData: floorDatas,
          dataRspv: validReservationIds[0],
          orderId: orderId // Ambil reservation ID pertama
        });
      } else {
        alert('Gagal membuat reservasi untuk semua kursi');
      }
    } catch (error) {
      console.error('Error during confirmation:', error);
      alert('Terjadi kesalahan saat konfirmasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Modifikasi updateSeatStatus untuk mengembalikan reservation ID
  const updateSeatStatus = async (seatId, floorId, status) => {

  

    try {
      const startHour = parseInt(dataTamu.hours_start.split(':')[0]);
      const endHour = parseInt(dataTamu.hours_end.split(':')[0]);
      const formattedDate = formatDateForAPIs(dataTamu.rsvp_date);
  
      const getData = await AsyncStorage.getItem('@dataSelf')
      const parsingData = JSON.parse(getData);
  
      const response = await axios.post(`${API_URL}/api/reservations`, {
        seat_id: seatId,
        date: formattedDate,
        start_hour: startHour,
        end_hour: endHour,
        place: dataOutlets.name,
        paymentId: orderId,
        customer_name: parsingData[0].namaLengkap || "Guest User",
        customer_phone: parsingData[0].handphone || "-",
        customer_email: parsingData[0].email || "-",
      });
  
      // Kembalikan reservation ID
      const reservationId = response.data?.data?.reservation_id;
      
      if (!reservationId) {
        console.error('Reservation ID is missing');
        return false;
      }
  
      return reservationId;
  
    } catch (error) {
      console.error("Error updating seat status:", error.response?.data || error.message);
      alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
      return false;
    }
  };

  const renderSeat = ({ item }, floorId) => {
    const isSelected = selectedSeats.some(s => s.seatId === item.seat_id && s.floorId === floorId);
    
    // Ambil jam yang diinginkan dari dataTamu
    let hourKey = "";
    try {
      if (dataTamu && dataTamu.hours_start) {
        // Ambil jam dalam format 24 jam tanpa leading zero
        hourKey = dataTamu.hours_start.split(':')[0];
        
        // Pastikan hourKey adalah string
        hourKey = hourKey.toString();
      }
    } catch (e) {
      console.error('Error parsing hours_start:', e);
    }
    
    // Cek status kursi pada jam yang dipilih
    let isBooked = false;
    
    console.log('hourKey', item.hour_slots[hourKey]);
    
    // Filter status kursi berdasarkan hour_slots
    if (item.hour_slots && hourKey in item.hour_slots) {
      isBooked = item.hour_slots[hourKey] !== "available";
    }
    
    const backgroundColor = isBooked ? 'red' : isSelected ? 'yellow' : '#7F6000';
    const textColor = isBooked ? 'white' : isSelected ? 'black' : 'white';
    
    return (
      <TouchableOpacity
        style={[styles.seat, { backgroundColor }]}
        onPress={() => handleSelectSeat(item.seat_id, floorId)}
        disabled={isBooked}
      >
        <Text style={[styles.text, { color: textColor }]}>
          {isBooked ? 'Booked' : item.seat_id}
        </Text>
      </TouchableOpacity>
    );
  };
  // Hapus fungsi checkSeatBookingStatus yang sebelumnya menggunakan API
  
  // Fungsi untuk memeriksa status booking kursi secara langsung ke database
  // Ini bisa diimplementasikan sebagai endpoint API terpisah
  const checkSeatBookingStatus = async (seatId, hourSlot) => {
    try {
      const response = await axios.get(`${API_URL}/api/seat-status`, {
        params: {
          seat_id: seatId,
          hour_slot: hourSlot,
          date: formatDateForAPI(dataTamu.rsvp_date)
        }
      });
      
      if (response.data.success) {
        return response.data.status; // Seharusnya mengembalikan "available" atau "booked"
      }
      return "error";
    } catch (error) {
      console.error("Error checking seat status:", error.response);
      return "error";
    }
  };
  // Effect untuk back handler
  useEffect(() => {
    const backAction = () => {
      resetSelectedSeats();
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [selectedSeats]);

  // Effect untuk timer
  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      handleTimeUp();
    }
  }, [seconds]);

  // Effect untuk loading data
  useEffect(() => {
    getAvailabilityData();
  }, []);

  return (
    <>
      <View style={{flex: 1, backgroundColor: '#F7F7F0'}}>
        <ScrollView>
          <View style={{marginHorizontal: 16, marginTop: 20}}>
            <View style={{alignItems: 'center'}}>
              <Image source={Logo} style={{width: 150, height: 100}} />
              <View>
                <Text style={styles.txtHead}>{'Where do you want to reserve?'}</Text>
                <Text style={[styles.txtHead, {
                  textAlign: 'center',
                  marginTop: 10
                }]}>Sisa Waktu: {formatTime(seconds)}</Text>
              </View>
            </View>

            {/* Reservation info */}
            <View style={styles.reservationInfo}>
              <Text style={styles.infoLabel}>Tanggal: <Text style={styles.infoValue}>{dataTamu.rsvp_date}</Text></Text>
              <Text style={styles.infoLabel}>Jam: <Text style={styles.infoValue}>{dataTamu.hours_start} - {dataTamu.hours_end}</Text></Text>
              <Text style={styles.infoLabel}>Jumlah Orang: <Text style={styles.infoValue}>{dataTamu.person}</Text></Text>
            </View>
            
            <View style={{marginHorizontal: 14, width: 320, marginTop: 16}}>
              <View style={{ borderRadius: 10, overflow: 'hidden', marginTop: 16}}>
                {floors.length > 0 ? (
                  floors.map((floor, index) => (
                    <List.Accordion
                      key={`floor-${floor.floor_id}`}
                      title={`Lantai ${floor.id_lantai}`}
                      expanded={expandedIndex === index}
                      titleStyle={{ color: '#FFFFFF' }}
                      style={{backgroundColor: '#7F6000', borderRadius: 20}}
                      theme={{ colors: { background: '#7F6000', primary: 'white' } }}
                      right={props => (
                        <List.Icon 
                          {...props} 
                          icon={expandedIndex === index ? 'chevron-up' : 'chevron-down'} 
                          color="#FFFFFF" 
                        />
                      )}
                      onPress={() => handlePress(index)}
                    >
                      <View style={{
                        width: '100%', 
                        borderWidth: 1, 
                        borderColor: '#7F6000', 
                        borderBottomRightRadius: 10, 
                        borderBottomLeftRadius: 10,
                        padding: 10
                      }}>
                        <FlatList
                          data={floor.seats}
                          renderItem={(item) => renderSeat(item, floor.floor_id)}
                          keyExtractor={item => `seat-${item.seat_id}`}
                          numColumns={3}
                          columnWrapperStyle={styles.row}
                        />

                        {selectedSeats.length > 0 && (
                          <TouchableOpacity 
                            style={styles.btn} 
                            onPress={handleConfirm}
                          >
                            <Text style={styles.txtBtn}>Confirm</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </List.Accordion>
                  ))
                ) : (
                  !loading && (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>Tidak Ada Data Ketersediaan</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Loading Modal */}
      <Modal visible={loading} contentContainerStyle={styles.loadingModal}>
        <ActivityIndicator size="large" color="#7F6000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </Modal>
    </>
  );
};

export default ReserveTable;

const styles = StyleSheet.create({
  txtHead: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 16,  
    marginTop: 30,
  },
  txtInsideBtn: {
    color: 'white', 
    fontFamily: 'Poppins-Bold', 
    marginTop: 5, 
    fontSize: 12,   
    textAlign: 'center'
  },
  reservationInfo: {
    backgroundColor: '#f2f2e4',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 14,
    borderWidth: 1,
    borderColor: '#7F6000'
  },
  infoLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#7F6000',
    marginBottom: 5
  },
  infoValue: {
    fontFamily: 'Poppins-Regular',
    fontWeight: 'normal'
  },
  descHead: {
    color: '#7F6000',  
    fontSize: 14,  
    fontFamily: 'Poppins-Medium', 
    marginBottom: 30, 
    marginTop: 10, 
    textAlign: 'center'
  },
  btn: {
    backgroundColor: '#7F6000', 
    width: '100%', 
    height: 40, 
    alignSelf: 'center',  
    marginVertical: 10, 
    borderRadius: 8
  },
  btnCanc: {
    backgroundColor: '#7F6000', 
    width: '40%', 
    height: 40, 
    alignSelf: 'flex-end',  
    marginBottom: 10, 
    borderRadius: 8, 
    marginTop: 5, 
    marginHorizontal: 20
  },
  txtBtn: {
    textAlign: 'center', 
    fontSize: 14, 
    fontFamily: 'Poppins-Light', 
    paddingVertical: 8, 
    color: 'white', 
    fontWeight: 'bold'
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  seat: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    margin: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center'
  },
  noDataText: {
    color: '#7F6000',
    fontFamily: 'Poppins-Medium',
    fontSize: 14
  },
  loadingModal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 50,
    borderRadius: 10,
    alignItems: 'center'
  },
  loadingText: {
    color: '#7F6000',
    marginTop: 10,
    fontFamily: 'Poppins-Medium'
  }
});