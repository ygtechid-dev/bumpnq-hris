import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import TabItem from './Tabitem'

const MyTabBar = ({ state, descriptors, navigation }) => {
 

    return (
      <View style={{  flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 53,
      height: 55,

    
      paddingVertical: 10,
      backgroundColor: 'white',
      borderRadius: 10}}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;
  
          const isFocused = state.index === index;
  
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
  
            if (!isFocused && !event.defaultPrevented) {
              // The `merge: true` option makes sure that the params inside the tab screen are preserved
              navigation.navigate({ name: route.name, merge: true });
            }
          };
  
          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
  
          return (
            <TabItem
            key={index}
            title={label}
            active={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
          );
        })}
      </View>
    );
  }
export default MyTabBar

const styles = StyleSheet.create({})