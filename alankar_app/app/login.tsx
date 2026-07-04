import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/Colors';
import { api, ADMIN_TOKEN_KEY } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.post('/api/auth', {
        username,
        password,
      });

      if (response.data && response.data.token) {
        await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, response.data.token);
        router.replace('/admin');
      } else {
        setErrorMsg('Authentication failed. No token received.');
      }
    } catch (e: any) {
      console.error('Login error:', e);
      if (e.response && e.response.data && e.response.data.message) {
        setErrorMsg(e.response.data.message);
      } else {
        setErrorMsg('Login failed. Please check network connectivity.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <Text style={styles.title}>ADMIN ACCESS</Text>
        <Text style={styles.subtitle}>Enter credentials to manage catalog</Text>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TextInput
          placeholder="Username"
          placeholderTextColor={Colors.dark.textMuted}
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={Colors.dark.textMuted}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable 
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark.crimsonDark} />
          ) : (
            <Text style={styles.loginBtnText}>LOGIN</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    justifyContent: 'center',
    padding: 24,
  },
  loginCard: {
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.gold,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.dark.textDim,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 28,
  },
  errorText: {
    color: '#E57373',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.dark.bg3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 14,
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: Colors.dark.gold,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
