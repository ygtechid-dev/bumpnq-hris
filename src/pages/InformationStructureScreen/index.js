import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { API_URL } from '../../context/APIUrl';

const { width } = Dimensions.get('window');

const InformationStructureScreen = ({ navigation }) => {
  const [informations, setInformations] = useState([]);
  const [filteredInformations, setFilteredInformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInformations();
  }, []);

  useEffect(() => {
    filterInformations();
  }, [searchQuery, informations]);

  const fetchInformations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/informations`);
      const data = await response.json();
      
      if (response.ok) {
        setInformations(data.informations || []);
      } else {
        Alert.alert('Error', data.error || 'Gagal memuat informasi');
      }
    } catch (error) {
      console.error('Error fetching informations:', error);
      Alert.alert('Error', 'Gagal memuat informasi');
    } finally {
      setLoading(false);
    }
  };

  const filterInformations = () => {
    if (!searchQuery.trim()) {
      setFilteredInformations(informations);
    } else {
      const filtered = informations.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredInformations(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInformations();
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const isImageFile = (fileUrl) => {
    if (!fileUrl) return false;
    const extension = fileUrl.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  };

  const isPDFFile = (fileUrl) => {
    if (!fileUrl) return false;
    return fileUrl.toLowerCase().endsWith('.pdf');
  };

  const canViewInApp = (fileUrl) => {
    return isImageFile(fileUrl) || isPDFFile(fileUrl);
  };

  const handleFilePress = async (item) => {
    if (!item.file_url) {
      Alert.alert('Info', 'File tidak tersedia');
      return;
    }

    // Check if file can be viewed in-app
    if (canViewInApp(item.file_url)) {
      // Navigate to FileViewerScreen
      navigation.navigate('FileViewerScreen', {
        fileUrl: item.file_url,
        title: item.title,
        fileType: isImageFile(item.file_url) ? 'image' : 'pdf',
      });
    } else {
      // For other file types, open externally
      try {
        await Linking.openURL(item.file_url);
      } catch (error) {
        console.error('Error opening file:', error);
        Alert.alert('Error', 'Gagal membuka file');
      }
    }
  };

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return 'file';
    
    const extension = fileUrl.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      default:
        return 'file';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderSearchResults = () => {
    if (searchQuery.trim() && filteredInformations.length === 0) {
      return (
        <View style={styles.emptySearchContainer}>
          <FontAwesome5 name="search" size={60} color="#ccc" />
          <Text style={styles.emptySearchText}>Tidak ada hasil</Text>
          <Text style={styles.emptySearchSubText}>
            Coba kata kunci yang berbeda untuk pencarian Anda
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderInformationCard = (item, index) => {
    const canView = canViewInApp(item.file_url);
    
    return (
      <View key={item.id} style={styles.card}>
        {/* File Preview */}
        <TouchableOpacity
          style={styles.fileContainer}
          onPress={() => handleFilePress(item)}
          activeOpacity={0.8}
        >
          {item.file_url && isImageFile(item.file_url) ? (
            <Image
              source={{ uri: item.file_url }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fileIconContainer}>
              <FontAwesome5
                name={getFileIcon(item.file_url)}
                size={40}
                color="#5EC898"
              />
              <Text style={styles.fileTypeText}>
                {item.file_url ? item.file_url.split('.').pop().toUpperCase() : 'FILE'}
              </Text>
            </View>
          )}
          
          {/* Overlay with view type indicator */}
          <View style={styles.overlay}>
            <FontAwesome5 
              name={canView ? "eye" : "external-link-alt"} 
              size={16} 
              color="white" 
            />
          </View>

          {/* Badge for viewable files */}
          {canView && (
            <View style={styles.viewableBadge}>
              <Text style={styles.viewableBadgeText}>Lihat di App</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          
          {item.description && (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <FontAwesome5 name="calendar-alt" size={12} color="#999" />
              <Text style={styles.dateText}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.viewButton,
                canView && styles.viewButtonHighlight
              ]}
              onPress={() => handleFilePress(item)}
            >
              <Text style={[
                styles.viewButtonText,
                canView && styles.viewButtonTextHighlight
              ]}>
                {canView ? 'Buka' : 'Lihat'}
              </Text>
              <FontAwesome5 
                name={canView ? "arrow-right" : "chevron-right"} 
                size={12} 
                color={canView ? "white" : "#5EC898"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Struktur & Informasi</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5EC898" />
          <Text style={styles.loadingText}>Memuat informasi...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5EC898" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Struktur & Informasi</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <FontAwesome5 
            name="sync-alt" 
            size={18} 
            color="white" 
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari informasi..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <FontAwesome5 name="times-circle" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Counter */}
        {searchQuery.trim() && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsText}>
              {filteredInformations.length} hasil ditemukan
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5EC898']}
            tintColor="#5EC898"
          />
        }
      >
        {informations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada informasi</Text>
            <Text style={styles.emptySubText}>
              Informasi struktur organisasi akan ditampilkan di sini
            </Text>
          </View>
        ) : (
          <>
            {renderSearchResults()}
            {filteredInformations.length > 0 && (
              <View style={styles.listContainer}>
                {filteredInformations.map((item, index) => renderInformationCard(item, index))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default InformationStructureScreen;

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
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  searchResultsContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  fileContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  fileIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  fileTypeText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewableBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#5EC898',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewableBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
  },
  viewButtonHighlight: {
    backgroundColor: '#5EC898',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#5EC898',
    fontWeight: '500',
    marginRight: 6,
  },
  viewButtonTextHighlight: {
    color: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    },
  emptySearchText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySearchSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
})