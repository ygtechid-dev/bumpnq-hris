import { 
  Image, 
  ScrollView,
  TextInput, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator 
} from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import Logo from '../../assets/logoloffee.png'
import { List, Modal } from 'react-native-paper'
import DatePicker from 'react-native-date-picker'
import { getDate, getTimeOnly } from '../../context/DateTimeServices'
import axios from 'axios'
import { API_URL } from '../../context/APIUrl'

const ReservationPage = ({ navigation }) => {
  const [date, setDate] = useState(new Date())
  const [datez, setDatez] = useState("")
  const [timeF, setTimeF] = useState("")
  const [timeE, setTimeE] = useState("")
  const [inputan, setInput] = useState({ person: "" })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openTimeF, setOpenTimeF] = useState(false)
  const [openTimeE, setOpenTimeE] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [dataOutlet, setDataOutlet] = useState([])

  
  // Mendapatkan tanggal hari ini
  const today = new Date();

  // Mengatur waktu minimum (10:00)
  const minTime = useMemo(() => {
    const minTime = new Date();
    minTime.setHours(10, 0, 0, 0); // Set to 10:00
    return minTime;
  }, []);
  
  // Mengatur waktu maksimum (21:00)
  const maxTime = useMemo(() => {
    const maxTime = new Date();
    maxTime.setHours(21, 0, 0, 0);
    return maxTime;
  }, []);

  const handlePress = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getDataOutlet = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/outlets`);
      setDataOutlet(response.data.data);
    } catch (err) {
      console.error('Error fetching outlets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataOutlet();
  }, []);

  // Menangani perubahan tanggal
  const handleDate = async (selectedDate) => {
    const conversi = await getDate(selectedDate);
    setDatez(conversi);
    setDate(selectedDate);

    // Reset waktu jika sudah dipilih sebelumnya
    setTimeF("");
    setTimeE("");
  };

  // Menangani pemilihan waktu mulai
  const handleTimeF = (selectedTime) => {
    const timeString = getTimeOnly(selectedTime);
    const hours = parseInt(timeString.split(':')[0]);
    
    if (hours < 10 || hours >= 21) {
      alert('Waktu reservasi hanya tersedia antara 10:00 - 21:00 WIB');
      return;
    }
    
    setTimeF(timeString);
  };

  // Menangani pemilihan waktu selesai
  const handleTimeE = (selectedTime) => {
    if (timeF === "") {
      alert('Silakan pilih waktu mulai terlebih dahulu');
      return;
    }
    
    const timeString = getTimeOnly(selectedTime);
    const startHours = parseInt(timeF.split(':')[0]);
    const endHours = parseInt(timeString.split(':')[0]);
    
    // Validasi: waktu akhir harus > waktu mulai dan <= 21:00
    if (endHours <= startHours) {
      alert('Waktu selesai harus setelah waktu mulai');
      return;
    }
    
    if (endHours > 21) {
      alert('Waktu selesai maksimal 21:00 WIB');
      return;
    }
    
    setTimeE(timeString);
  };

  // Menangani button next
  const handleNext = (item) => {
    if (datez === "" || timeF === "" || timeE === "" || !inputan.person) {
      alert('Silakan lengkapi semua data reservasi');
      return;
    }
    
    // Validasi person harus berupa angka
    const personNum = parseInt(inputan.person);
    if (isNaN(personNum) || personNum <= 0) {
      alert('Jumlah orang harus berupa angka positif');
      return;
    }
    
    navigation.push('ReserveTable', {
      store: item.name,
      dataTamu: {
        "place": item.name,
        "rsvp_date": datez,
        "hours_start": timeF,
        "hours_end": timeE,
        "person": inputan.person
      },
      dataOutlets: item
    });
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: '#F7F7F0' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginHorizontal: 16, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Image source={Logo} style={{ width: 150, height: 75 }} />
              <TouchableOpacity 
                onPress={() => navigation.push('MyReservation')} 
                style={styles.myReservationButton}>
                <Text style={styles.txtInsideBtn}>{'My Reservation'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 10, marginTop: -5 }}>
              <Text style={styles.txtHead}>{'Where do you want to reserve?'}</Text>
            </View>

            {dataOutlet.length > 0 ? (
              dataOutlet.map((outlet, index) => (
                <View key={`outlet-${index}`} style={{ marginHorizontal: 14, marginTop: 16 }}>
                  <View style={{ borderRadius: 10, overflow: 'hidden' }}>
                    <List.Accordion
                      title={outlet.name}
                      expanded={expandedIndex === index}
                      titleStyle={{ color: '#FFFFFF' }}
                      style={{ backgroundColor: '#7F6000', borderRadius: 20 }}
                      theme={{ colors: { background: '#7F6000', primary: 'white' } }}
                      right={props => (
                        <List.Icon 
                          {...props} 
                          icon={expandedIndex === index ? 'chevron-up' : 'chevron-down'} 
                          color="#FFFFFF" 
                        />
                      )}
                      onPress={() => handlePress(index)}>
                      <View style={styles.accordionContent}>
                        {/* Reservation Date Section */}
                        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
                          {'Reservation Date'}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => setOpen(true)} 
                          style={styles.selectionField}>
                          <Text style={styles.selectionText}>
                            {datez !== "" ? datez : 'Tap To Select Date'}
                          </Text>
                        </TouchableOpacity>

                        {/* Reservation Hours Section */}
                        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
                          {'Reservation Hours'}
                        </Text>
                        <View style={styles.timeSelectionRow}>
                          <TouchableOpacity 
                            onPress={() => {
                              if (datez === "") {
                                alert('Silakan pilih tanggal terlebih dahulu');
                              } else {
                                setOpenTimeF(true);
                              }
                            }} 
                            style={[styles.selectionField, { width: '40%' }]}>
                            <Text style={styles.selectionText}>
                              {timeF !== "" ? timeF : 'Tap To Select'}
                            </Text>
                          </TouchableOpacity>
                          
                          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
                            {'Until'}
                          </Text>
                          
                          <TouchableOpacity
                            onPress={() => {
                              if (datez === "") {
                                alert('Silakan pilih tanggal terlebih dahulu');
                              } else if (timeF === "") {
                                alert('Silakan pilih waktu mulai terlebih dahulu');
                              } else {
                                setOpenTimeE(true);
                              }
                            }}
                            style={[styles.selectionField, { width: '40%' }]}>
                            <Text style={styles.selectionText}>
                              {timeE !== "" ? timeE : 'Tap To Select'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      
                        {/* Persons Section */}
                        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
                          {'How Many Persons?'}
                        </Text>
                        <TextInput
                          style={styles.txtInput}
                          placeholderTextColor="grey" 
                          placeholder="..."
                          value={inputan.person}
                          onChangeText={(e) => setInput({ ...inputan, person: e })}  
                          keyboardType='numeric'
                          maxLength={2}
                        />
                        
                        <TouchableOpacity 
                          style={styles.btn} 
                          onPress={() => handleNext(outlet)}>
                          <Text style={styles.txtBtn}>Select Table</Text>
                        </TouchableOpacity>
                      </View>
                    </List.Accordion>
                  </View>
                </View>
              ))
            ) : (
              !loading && (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No outlets available</Text>
                </View>
              )
            )}
          </View>
        </ScrollView>
      </View>

      {/* Date Picker */}
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        minimumDate={today} // Menetapkan tanggal minimum hari ini
        onConfirm={(selectedDate) => {
          setOpen(false);
          handleDate(selectedDate);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />

      {/* Time Picker - Start Time */}
      <DatePicker
        modal
        open={openTimeF}
        date={minTime}
        mode="time"
        locale="id-ID" 
        is24hourSource={'locale'}
        minimumDate={minTime}
        maximumDate={maxTime}
        onConfirm={(selectedTime) => {
          setOpenTimeF(false);
          handleTimeF(selectedTime);
        }}
        onCancel={() => {
          setOpenTimeF(false);
        }}
      />

      {/* Time Picker - End Time */}
      <DatePicker
        modal
        open={openTimeE}
        date={maxTime}
        mode="time"
        locale="id-ID" 
        is24hourSource={'locale'}
        minimumDate={minTime}
        maximumDate={maxTime}
        onConfirm={(selectedTime) => {
          setOpenTimeE(false);
          handleTimeE(selectedTime);
        }}
        onCancel={() => {
          setOpenTimeE(false);
        }}
      />

      {/* Loading Modal */}
      <Modal visible={loading} contentContainerStyle={styles.loadingModal}>
        <ActivityIndicator size="large" color="#7F6000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </Modal>
    </>
  );
}

export default ReservationPage;

const styles = StyleSheet.create({
  txtHead: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 16,  
    marginTop: 30,
  },
  myReservationButton: {
    backgroundColor: '#7F6000', 
    width: 110, 
    height: 40, 
    borderRadius: 7, 
    justifyContent: 'center',
    alignItems: 'center', 
    marginTop: 25
  },
  txtInsideBtn: {
    color: 'white', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 12,   
    textAlign: 'center'
  },
  accordionContent: {
    width: '100%', 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#7F6000', 
    borderBottomRightRadius: 10, 
    borderBottomLeftRadius: 10
  },
  sectionLabel: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 12, 
    marginLeft: 5, 
    marginBottom: 5
  },
  selectionField: {
    width: '100%', 
    height: 40,  
    borderRadius: 10, 
    borderWidth: 0.5, 
    borderColor: '#7F6000',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  selectionText: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Light', 
    fontSize: 12
  },
  timeSelectionRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },
  btn: {
    backgroundColor: '#7F6000', 
    width: '40%', 
    height: 40, 
    alignSelf: 'flex-end', 
    marginVertical: 10, 
    borderRadius: 8
  },
  txtBtn: {
    textAlign: 'center', 
    fontSize: 14, 
    fontFamily: 'Poppins-Light', 
    paddingVertical: 8, 
    color: 'white', 
    fontWeight: 'bold'
  },
  txtInput: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    padding: 10,
    borderColor: '#7F6000',
    width: '100%',
    color: '#7F6000'
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 30
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