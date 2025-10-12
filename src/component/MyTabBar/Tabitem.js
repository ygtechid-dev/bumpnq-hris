import React from 'react'
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';

import ICSF from '../../assets/homesh.svg'
import ICSR from '../../assets/homedeact.svg'
import APactive from '../../assets/homesh.svg'
import APnonactive from '../../assets/homedeact.svg'
import TRXactive from '../../assets/homesh.svg'
import TRXnonactive from '../../assets/homedeact.svg'
import FontAwesomeIcon5 from 'react-native-vector-icons/FontAwesome5'

const TabItem = ({title, active, onPress, onLongPress}) => {
  const Icon = () => {
    if (title == 'Beranda') {
      return active ?  <FontAwesomeIcon5 name="home" size={25} color="#03A700" /> :  <FontAwesomeIcon5 name="home" size={25} color="grey" />;
    }
    if (title == 'Peta Navigasi') {
        return active ?   <FontAwesomeIcon5 name="map" size={25} color="#03A700" /> :  <FontAwesomeIcon5 name="map" size={25} color="grey" />;
      }
      if (title == 'Profil') {
        return active ?   <FontAwesomeIcon5 name="user-alt" size={25} color="#03A700" /> :  <FontAwesomeIcon5 name="user-alt" size={25} color="grey" />
      }
      // if (title == 'Setting') {
      //   return active ?   <FontAwesomeIcon5 name="user" size={25} color="#3E67F4" /> :  <FontAwesomeIcon5 name="user" size={25} color="grey" />
      // }
    return  <Icon name='area-chart' color="#1A5D98" size={20} />;
  };
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress}>
      <Icon />
      <Text style={styles.text(active)}>{title}</Text>
    </TouchableOpacity>
  );
}

export default TabItem;

const styles = StyleSheet.create({
  container: {alignItems: 'center', },
  text: (active) => ({
    fontSize: 10,
    marginTop: 3,
    color: active ? '#03A700' : 'grey',


  
  }),
})