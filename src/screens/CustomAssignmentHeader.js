import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';


const CustomHeader = ({ title }) => {
  return (
    <View style={styles.headerContainer}>
      
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
   // flexDirection: 'row',
   // alignItems: 'left',       
   // justifyContent: 'flex-start',
   // paddingHorizontal: 0,        
   // paddingVertical: 0,         
   // width: '100%',
  },
  image: {
    width: 30,
    height: 30,
    marginRight: 10,
    left: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',

  },
});

export default CustomHeader;
