/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Animated, Dimensions, Linking, BackHandler} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from "axios";
import { API_WA } from '../../context/APIUrl';
import Logo from '../../assets/logoloffee.png'
import MemberCard from '../../assets/silvermember.png'
import { ProgressBar, MD3Colors } from 'react-native-paper';
import { ref, get } from 'firebase/database';
import { database } from '../../config/Fire';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Membership = ({navigation, route}) => {

  
  const [inputan, setInput] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading]= useState(false)
  const [hidePassword, setHidePassword] = useState(true);
  const [dataMember, setDataMember] = useState([])
  const [pointNextLevel, setPointNextLevel] = useState("")
  const [progress, setProgress] = useState("")
  const [parsingData, setParsingData] = useState(null); // State untuk menyimpan parsingData
  const [membershipBenefits, setMembershipBenefits] = useState([]); // State untuk benefits
  const [activeTab, setActiveTab] = useState('Silver'); // Tab aktif untuk benefits

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Gunakan parsingData jika tersedia, fallback ke data dari route params
  const memberData = parsingData
  const isTemanLoffee = memberData?.membership_status === "TemanLoffee";

  console.log('inputan', inputan);
  console.log('memberData', memberData);
  console.log('isTemanLoffee', isTemanLoffee);

  // BackHandler untuk handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true; // Prevent default behavior
      };

      // Add event listener
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Cleanup
      return () => subscription.remove();
    }, [navigation])
  );

  // Smart back function
  const handleBackPress = () => {
    console.log('Back pressed - canGoBack:', navigation.canGoBack());
    
    if (navigation.canGoBack()) {
      console.log('Going back to previous screen...');
      navigation.goBack();
    } else {
      console.log('No history, navigating to Beranda...');
      navigation.navigate('Beranda');
    }
  };

  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

 const getData = async () => {
  setLoading(true);
  
  try {
    // Firebase v9 - create references
    const membershipRef = ref(database, 'membership_card/');
    const benefitsRef = ref(database, 'membership_benefits/');
    
    // Get both data simultaneously using Promise.all
    const [membershipSnapshot, benefitsSnapshot] = await Promise.all([
      get(membershipRef),
      get(benefitsRef)
    ]);
    
    // Process membership cards data
    const membershipValue = membershipSnapshot.exists() ? membershipSnapshot.val() : null;
    const benefitsValue = benefitsSnapshot.exists() ? benefitsSnapshot.val() : null;
    
    console.log('membership cards:', membershipValue);
    console.log('benefits data:', benefitsValue);
    
    if (membershipValue) {
      // Convert to array
      const datled = Object.values(membershipValue);
      
      // Get user data from AsyncStorage
      const getDatas = await AsyncStorage.getItem('@dataSelf');
      const parsedData = JSON.parse(getDatas);
      console.log('User data:', parsedData);
      
      setParsingData(parsedData[0]);
      
      const pointMember = memberData?.point_member || 0;
      console.log('User points:', pointMember);
      
      // Skip point calculation for TemanLoffee
      if (!isTemanLoffee) {
        const filteredMembership = datled.filter((e) => e.level === parsedData[0].membership_status);
        
        setDataMember(filteredMembership);
        console.log('Filtered membership:', filteredMembership);
        
        if (filteredMembership.length > 0) {
          const currentMembership = filteredMembership.find(card => card.level === memberData?.membership_status);
          
          if (currentMembership) {
            const nextMembership = datled.find(card => 
              parseInt(card.minpoint, 10) > parseInt(currentMembership.maxpoint, 10)
            );
            
            const progressToNextLevel = nextMembership
              ? (pointMember - parseInt(currentMembership.minpoint, 10)) / 
                (parseInt(nextMembership.minpoint, 10) - parseInt(currentMembership.minpoint, 10))
              : 1;

            console.log('Progress to next level:', progressToNextLevel);
            setProgress(Math.max(0, Math.min(1, progressToNextLevel))); // Clamp between 0 and 1

            const pointsToNextLevel = nextMembership 
              ? parseInt(nextMembership.minpoint, 10) - pointMember 
              : null;
            
            console.log('Points to next level:', pointsToNextLevel);
            setPointNextLevel(pointsToNextLevel);
          }
        }
      }
    }
    
    // Process benefits data
    if (benefitsValue) {
      const benefitsArray = Object.values(benefitsValue);
      console.log('====================================');
      console.log('benefit', benefitsArray);
      console.log('====================================');
      setMembershipBenefits(benefitsArray);
    }
    
  } catch (error) {
    console.error('Error getting membership data:', error);
    
    // Set default values on error
    setDataMember([]);
    setMembershipBenefits([]);
    setProgress(0);
    setPointNextLevel(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    getData()
  }, [])

  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  const handleRegister = async () => {
    navigation.navigate('Register')
  }

  // TemanLoffee Exclusive Component - UPDATED dengan Point Wallet
  const TemanLoffeeCard = () => (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
    }}>
      <View style={styles.cardContainer}>
        <Image 
          source={{uri: dataMember.length > 0 ? dataMember[0].pict : null}} 
          style={styles.membershipImage}
        />
        <LinearGradient
          colors={['rgba(127, 96, 0, 0.1)', 'rgba(127, 96, 0, 0.3)']}
          style={styles.imageOverlay}
        />
      </View>

      {/* TemanLoffee Points and Wallet Container */}
      <View style={styles.TemanLoffeePointsContainer}>
        {/* Member Points Card */}
        <View style={styles.TemanLoffeePointsCard}>
          <LinearGradient
            colors={['#2a2a2a', '#1a1a1a']}
            style={styles.TemanLoffeeCard}
          >
            <View style={styles.TemanLoffeeHeader}>
              <FontAwesome5 name="coins" size={24} color="#DAA520" />
              <Text style={styles.TemanLoffeePointsLabel}>Member Points</Text>
            </View>
            
            <Text style={styles.TemanLoffeePointsValue}>{memberData?.point_member || 0}</Text>
            
            <Text style={styles.TemanLoffeePointsDesc}>
              Premium rewards & exclusive benefits
            </Text>
          </LinearGradient>
        </View>

        {/* Wallet Points Card */}
        <View style={styles.TemanLoffeeWalletCard}>
          <LinearGradient
            colors={['#1a2a1a', '#0f1f0f']}
            style={styles.TemanLoffeeCard}
          >
            <View style={styles.TemanLoffeeHeader}>
              <FontAwesome5 name="wallet" size={24} color="#FFD700" />
              <Text style={styles.TemanLoffeeWalletLabel}>Wallet Points</Text>
            </View>
            
            <Text style={styles.TemanLoffeeWalletValue}>{memberData?.point_wallet || 0}</Text>
            
            <Text style={styles.TemanLoffeeWalletDesc}>
              Direct payment & instant bookings
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* VIP Action Button */}
      <TouchableOpacity style={styles.TemanLoffeeButton} onPress={() => Linking.openURL('https://loffee.id')}>
        <LinearGradient
          colors={['#DAA520', '#FFD700']}
          style={styles.TemanLoffeeButtonGradient}
        >
          <FontAwesome5 name="crown" size={16} color="#8B4513" />
          <Text style={styles.TemanLoffeeButtonText}>VIP Portal</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Regular Member Component with enhanced design - UPDATED
  const RegularMemberCard = () => (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    }}>
      <View style={styles.regularMemberSection}>
        <View style={styles.cardContainer}>
          <Image 
            source={{uri: dataMember.length > 0 ? dataMember[0].pict : null}} 
            style={styles.membershipImage}
          />
          <LinearGradient
            colors={['rgba(127, 96, 0, 0.1)', 'rgba(127, 96, 0, 0.3)']}
            style={styles.imageOverlay}
          />
        </View>
        
        {/* Points and Wallet Container - UPDATED */}
        <View style={styles.pointsWalletContainer}>
          {/* Member Points Card */}
          <View style={styles.pointsContainer}>
            <LinearGradient
              colors={['#F7F7F0', '#FFFFFF']}
              style={styles.pointsCard}
            >
              <View style={styles.pointsHeader}>
                <FontAwesome5 name="coins" size={20} color="#DAA520" />
                <Text style={styles.pointsLabel}>Member Points</Text>
              </View>
              
              <Text style={styles.pointsValue}>{memberData?.point_member || 0}</Text>
              
              <Text style={styles.pointsDesc}>
                Redeem at outlets for rewards
              </Text>
            </LinearGradient>
          </View>

          {/* Wallet Points Card - NEW */}
          <View style={styles.walletContainer}>
            <LinearGradient
              colors={['#E8F5E8', '#FFFFFF']}
              style={styles.walletCard}
            >
              <View style={styles.walletHeader}>
                <FontAwesome5 name="wallet" size={20} color="#28a745" />
                <Text style={styles.walletLabel}>Wallet Points</Text>
              </View>
              
              <Text style={styles.walletValue}>{memberData?.point_wallet || 0}</Text>
              
              <Text style={styles.walletDesc}>
                Use for purchases & bookings
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Combined Action Button */}
        <TouchableOpacity style={styles.checkButton} onPress={() => Linking.openURL('https://loffee.id')}>
          <LinearGradient
            colors={['#7F6000', '#9A7200']}
            style={styles.checkButtonGradient}
          >
            <FontAwesome5 name="external-link-alt" size={14} color="white" />
            <Text style={styles.checkButtonText}>View Outlets</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              🎯 {pointNextLevel} points to next level
            </Text>
            <Text style={styles.progressSubtitle}>Keep earning to unlock Gold benefits!</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <ProgressBar 
              progress={progress} 
              color={'#DAA520'} 
              style={styles.progressBar}
            />
            <Text style={styles.progressPercentage}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  // Enhanced Benefits Tab Component - UPDATED with ordering
  const MembershipBenefitsSection = () => {
    const membershipLevels = ['Silver', 'Gold', 'Platinum'];
    
    const getCurrentBenefits = () => {
      // Filter benefits by membership level and sort by order parameter
      const filteredBenefits = membershipBenefits.filter(benefit => 
        benefit.membership_level === activeTab
      );
      
      // Sort by order parameter (ascending - smallest first)
      return filteredBenefits.sort((a, b) => {
        const orderA = parseInt(a.order || 0, 10);
        const orderB = parseInt(b.order || 0, 10);
        return orderA - orderB;
      });
    };

    const getLevelColors = (level) => {
      switch(level) {
        case 'Silver': return ['#C0C0C0', '#E8E8E8'];
        case 'Gold': return ['#FFD700', '#FFA500'];
        case 'Platinum': return ['#E5E4E2', '#B8B8B8'];
        default: return ['#C0C0C0', '#E8E8E8'];
      }
    };

    return (
      <Animated.View style={[styles.benefitsSection, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }]}>
        <View style={styles.benefitsTitleContainer}>
          <FontAwesome5 name="gift" size={24} color="#7F6000" />
          <Text style={styles.benefitsTitle}>Membership Benefits</Text>
          <FontAwesome5 name="star" size={20} color="#DAA520" />
        </View>
        
        {/* Enhanced Tab Navigation */}
        <View style={styles.tabContainer}>
          {membershipLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.tabButton,
                activeTab === level && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(level)}
            >
              {activeTab === level && (
                <LinearGradient
                  colors={getLevelColors(level)}
                  style={styles.activeTabGradient}
                >
                  <FontAwesome5 
                    name={level === 'Silver' ? 'medal' : level === 'Gold' ? 'trophy' : 'crown'} 
                    size={12} 
                    color="#333" 
                  />
                  <Text style={styles.activeTabText}>{level}</Text>
                </LinearGradient>
              )}
              {activeTab !== level && (
                <Text style={styles.tabText}>{level}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Enhanced Benefits Content */}
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.benefitsContent}
        >
          {getCurrentBenefits().map((benefit, index) => (
            <Animated.View 
              key={index} 
              style={[styles.benefitItem, {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }]
              }]}
            >
              <LinearGradient
                colors={getLevelColors(activeTab)}
                style={styles.benefitIcon}
              >
                <FontAwesome5 name={benefit.icon || "star"} size={16} color="#333" />
              </LinearGradient>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
              <FontAwesome5 name="check-circle" size={16} color="#28a745" />
            </Animated.View>
          ))}
          
          {getCurrentBenefits().length === 0 && (
            <View style={styles.noBenefitsContainer}>
              <FontAwesome5 name="info-circle" size={32} color="#DAA520" />
              <Text style={styles.noBenefitsText}>
                No benefits available for {activeTab} membership
              </Text>
              <Text style={styles.noBenefitsSubtext}>
                Earn more points to unlock exclusive perks!
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  // Loading state sementara data belum tersedia
  if (!memberData) {
    return (
      <LinearGradient
        colors={['#F7F7F0', '#FFFFFF']}
        style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}
      >
        <ActivityIndicator size="large" color="#7F6000" />
        <Text style={styles.loadingText}>Loading member data...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isTemanLoffee ? ['#FFF8DC', '#FFFFFF'] : ['#F7F7F0', '#FFFFFF']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.wrapper, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <View style={styles.wrapHeader}>
            <Image source={Logo} style={styles.logoImage} />
            {isTemanLoffee && (
              <View style={styles.familyBadge}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.familyBadgeGradient}
                >
                  <FontAwesome5 name="crown" size={12} color="#8B4513" />
                  <Text style={styles.familyBadgeText}>FAMILY MEMBER</Text>
                </LinearGradient>
              </View>
            )}
          </View>
          
          {!isTemanLoffee && (
            <View style={styles.memberInfoContainer}>
              <Text style={styles.memberName}>{memberData.namaLengkap}</Text>
              <Text style={styles.membershipLabel}>
                {memberData?.membership_status || 'Silver'} Membership
              </Text>
            </View>
          )}

          {isTemanLoffee && (
            <View style={styles.memberInfoContainer}>
              <Text style={styles.memberName}>{memberData.namaLengkap}</Text>
              <Text style={styles.TemanLoffeeMembershipLabel}>
                TemanLoffee VIP Member
              </Text>
            </View>
          )}
          
          <View style={styles.cardSection}>
            {isTemanLoffee ? <TemanLoffeeCard /> : <RegularMemberCard />}
          </View>

          {/* Benefits Section for Regular Members */}
          {!isTemanLoffee && <MembershipBenefitsSection />}

          {isTemanLoffee && (
            <Animated.View style={[styles.TemanLoffeePerks, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}>
              <View style={styles.perksTitleContainer}>
                <FontAwesome5 name="star" size={20} color="#DAA520" />
                <Text style={styles.perksTitle}>Your Exclusive Perks</Text>
                <FontAwesome5 name="star" size={20} color="#DAA520" />
              </View>
              
              <LinearGradient
                colors={['#2a2a2a', '#1a1a1a']}
                style={styles.perksList}
              >
                {[
                  { icon: 'percentage', title: 'Special Discounts', desc: 'Up to 20% off on all items' },
                  { icon: 'calendar-alt', title: 'Priority Booking', desc: 'Skip the queue, book instantly' },
                  { icon: 'concierge-bell', title: 'VIP Support', desc: '24/7 dedicated customer service' },
                ].map((perk, index) => (
                  <Animated.View 
                    key={index}
                    style={[styles.perkItem, {
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }]
                    }]}
                  >
                    <LinearGradient
                      colors={['#DAA520', '#FFD700']}
                      style={styles.perkIcon}
                    >
                      <FontAwesome5 name={perk.icon} size={16} color="#8B4513" />
                    </LinearGradient>
                    <View style={styles.perkContent}>
                      <Text style={styles.perkTitle}>{perk.title}</Text>
                      <Text style={styles.perkDesc}>{perk.desc}</Text>
                    </View>
                    <FontAwesome5 name="check" size={16} color="#DAA520" />
                  </Animated.View>
                ))}
              </LinearGradient>
            </Animated.View>
          )}

          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}>
            {loading ? 
              <ActivityIndicator size="large" color={isTemanLoffee ? "#DAA520" : "#7F6000"} />
              :
              <TouchableOpacity 
                style={styles.backButtonContainer} 
                onPress={handleBackPress}
              >
                <LinearGradient
                  colors={isTemanLoffee ? ['#DAA520', '#FFD700'] : ['#7F6000', '#9A7200']}
                  style={styles.backButton}
                >
                  <FontAwesome5 name="arrow-left" size={16} color="white" />
                  <Text style={styles.backButtonText}>
                    {navigation.canGoBack() ? 'Back' : 'Back to Home'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            }
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Membership;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  wrapHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 220,
    height: 110,
    resizeMode: 'contain',
  },
  familyBadge: {
    marginTop: 10,
  },
  familyBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  familyBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: '#8B4513',
    marginLeft: 6,
    letterSpacing: 1,
  },
  memberInfoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  memberName: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 5,
  },
  membershipLabel: {
    color: '#DAA520', 
    fontFamily: 'Poppins-Medium', 
    fontSize: 14,
    textAlign: 'center',
  },
  TemanLoffeeMembershipLabel: {
    color: '#DAA520', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  cardSection: {
    marginTop: 10,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#7F6000',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginTop: 16,
  },
  
  // Regular Member Styles
  regularMemberSection: {
    alignItems: 'center',
    width: '100%',
  },
  cardContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  membershipImage: {
    width: 320,
    height: 200,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },

  // Points and Wallet Container - UPDATED
  pointsWalletContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 10,
    gap: 10,
  },
  pointsContainer: {
    flex: 1,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#7F6000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#7F6000',
    marginLeft: 8,
  },
  pointsValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#DAA520',
    marginBottom: 8,
  },
  pointsDesc: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Wallet Container - NEW
  walletContainer: {
    flex: 1,
  },
  walletCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#28a745',
    marginLeft: 8,
  },
  walletValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#28a745',
    marginBottom: 8,
  },
  walletDesc: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },

  checkButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  checkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  checkButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 24,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#7F6000',
    textAlign: 'center',
  },
  progressSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#DAA520',
    marginLeft: 12,
  },

  // TemanLoffee Styles - UPDATED
  TemanLoffeePointsContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 10,
    gap: 10,
    marginTop: 20,
  },
  TemanLoffeePointsCard: {
    flex: 1,
  },
  TemanLoffeeWalletCard: {
    flex: 1,
  },
  TemanLoffeeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  TemanLoffeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  TemanLoffeePointsLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#DAA520',
    marginLeft: 8,
  },
  TemanLoffeePointsValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#DAA520',
    marginBottom: 8,
  },
  TemanLoffeePointsDesc: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 16,
  },
  TemanLoffeeWalletLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  TemanLoffeeWalletValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  TemanLoffeeWalletDesc: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 16,
  },
  TemanLoffeeButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  TemanLoffeeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  TemanLoffeeButtonText: {
    color: '#8B4513',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 1,
  },

  // Perks Section
  TemanLoffeePerks: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  perksTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  perksTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#DAA520',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  perksList: {
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
  },
  perkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  perkContent: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#DAA520',
    marginBottom: 4,
  },
  perkDesc: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#cccccc',
    lineHeight: 18,
  },

  // Benefits Section Styles
  benefitsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  benefitsTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#7F6000',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 30,
    padding: 6,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
  },
  activeTabButton: {
    // Active styling handled by gradient
  },
  activeTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#888',
  },
  activeTabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 6,
  },
  benefitsContent: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#7F6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  benefitContent: {
    flex: 1,
    marginRight: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    lineHeight: 18,
  },
  noBenefitsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noBenefitsText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  noBenefitsSubtext: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },

  // Button Styles
  backButtonContainer: {
    marginTop: 32,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#7F6000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginLeft: 12,
    letterSpacing: 0.5,
  },

  // Utility Styles
  txtHead: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Bold', 
    fontSize: 16,  
    marginTop: 30, 
    textAlign: 'center'
  },
  txtDesc: {
    color: '#7F6000', 
    fontFamily: 'Poppins-Light', 
    fontSize: 14,  
    marginTop: 10, 
    textAlign: 'center'
  },
  descHead: {
    color: '#7F6000',  
    fontSize: 14,  
    fontFamily: 'Poppins-Medium', 
    marginBottom: 30, 
    marginTop: 10, 
    textAlign: 'center'
  },
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
});