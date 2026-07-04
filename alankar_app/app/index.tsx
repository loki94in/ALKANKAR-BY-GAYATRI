import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

declare var require: any;

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.brandTitle}>ALANKAR</Text>
      <Text style={styles.brandSubtitle}>BY GAYATRI</Text>
      
      <ActivityIndicator 
        size="large" 
        color={Colors.dark.gold} 
        style={styles.loader} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.dark.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.dark.gold,
    letterSpacing: 6,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 10,
    color: Colors.dark.silver,
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  loader: {
    marginTop: 64,
  },
});
