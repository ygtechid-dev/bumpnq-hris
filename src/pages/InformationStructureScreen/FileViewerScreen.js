import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const FileViewerScreen = ({ route, navigation }) => {
  const { fileUrl, title } = route.params;
  const [loading, setLoading] = useState(true);

  const isImage = () => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const extension = fileUrl.toLowerCase().split('.').pop();
    return imageExtensions.includes(extension);
  };

  const isPDF = () => {
    return fileUrl.toLowerCase().endsWith('.pdf');
  };

  const getViewerUrl = () => {
    if (isPDF()) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    return fileUrl;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\n${fileUrl}`,
        url: fileUrl,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Download',
      'Fitur download akan segera tersedia',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isImage() ? 'Image' : isPDF() ? 'PDF Document' : 'Document'}
          </Text>
        </View>

        <View style={styles.headerActions}>
        
        </View>
      </View>

      {/* WebView Content */}
      <WebView
        source={{ uri: getViewerUrl() }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#5EC898" />
            <Text style={styles.loadingText}>Memuat file...</Text>
          </View>
        )}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView Error:', nativeEvent);
          Alert.alert('Error', 'Gagal memuat file');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        allowFileAccess={true}
        mixedContentMode="always"
      />
    </View>
  );
};

export default FileViewerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#5EC898',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 5,
  },
  webview: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});