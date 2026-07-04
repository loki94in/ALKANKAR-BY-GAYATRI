import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';
import { checkOnline } from '../../services/sync';
import { addToSyncQueue } from '../../services/database';
import { SETTINGS_WHATSAPP_KEY, SETTINGS_INSTAGRAM_KEY } from '../../services/sync';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Social Settings
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');

  // Account Settings
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedWhatsapp = await SecureStore.getItemAsync(SETTINGS_WHATSAPP_KEY);
      const savedInstagram = await SecureStore.getItemAsync(SETTINGS_INSTAGRAM_KEY);
      setWhatsapp(savedWhatsapp || '');
      setInstagram(savedInstagram || '');
    } catch (e) {
      console.error('Failed to load settings from storage:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isOnline = await checkOnline();
      
      const payload: any = {
        whatsapp_number: whatsapp,
        instagram_handle: instagram
      };

      if (username) payload.admin_user = username;
      if (password) payload.admin_pass = password;

      // Update local storage immediately
      await SecureStore.setItemAsync(SETTINGS_WHATSAPP_KEY, whatsapp);
      await SecureStore.setItemAsync(SETTINGS_INSTAGRAM_KEY, instagram);

      if (isOnline) {
        await api.post('/api/settings', payload);
        alert('Settings synced successfully!');
      } else {
        addToSyncQueue('/api/settings', 'POST', JSON.stringify(payload));
        alert('Settings saved locally. Will sync to server when online.');
      }
      
      // Clear password field for security
      setPassword('');
      setUsername('');
    } catch (e: any) {
      console.error(e);
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>STORE SOCIAL INFO</Text>

      <Text style={styles.label}>WhatsApp Number (with Country Code, no '+')</Text>
      <TextInput
        style={styles.input}
        value={whatsapp}
        onChangeText={setWhatsapp}
        placeholder="e.g. 919876543210"
        keyboardType="phone-pad"
        placeholderTextColor={Colors.dark.textMuted}
      />

      <Text style={styles.label}>Instagram Handle</Text>
      <TextInput
        style={styles.input}
        value={instagram}
        onChangeText={setInstagram}
        placeholder="e.g. alankar_by_gayatri"
        autoCapitalize="none"
        placeholderTextColor={Colors.dark.textMuted}
      />

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>ADMIN ACCOUNT</Text>
      <Text style={styles.subtext}>Leave these blank unless you want to change your login credentials.</Text>

      <Text style={styles.label}>New Admin Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="e.g. new_username"
        autoCapitalize="none"
        placeholderTextColor={Colors.dark.textMuted}
      />

      <Text style={styles.label}>New Admin Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="e.g. new_password"
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={Colors.dark.textMuted}
      />

      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.dark.crimsonDark} />
        ) : (
          <Text style={styles.saveBtnText}>SAVE SETTINGS</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.dark.gold,
    letterSpacing: 2,
    marginBottom: 16,
  },
  subtext: {
    color: Colors.dark.textDim,
    fontSize: 12,
    marginBottom: 16,
  },
  label: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 14,
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: Colors.dark.gold,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
