import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider } from 'expo-router';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useTheme } from '@/hooks/use-theme';
import { addAuthListener, mobileApi } from '@/utils/api';
import { Colors, Spacing } from '@/constants/theme';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  
  // Auth Screen States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bloodType, setBloodType] = useState('O-');
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Listen to token changes
    const unsubscribe = addAuthListener((t, u) => {
      setToken(t);
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const handleAuthSubmit = async () => {
    setAuthError('');
    if (!username.trim() || !password.trim()) {
      setAuthError('Please fill in username and password.');
      return;
    }
    
    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        if (!email.trim() || !phone.trim()) {
          setAuthError('Email and Phone Number are required.');
          setAuthLoading(false);
          return;
        }
        
        await mobileApi.auth.register({
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
          phone_number: phone.trim(),
          city: city.trim() || 'Nairobi',
          blood_type: bloodType,
          date_of_birth: new Date('1995-01-01').toISOString(), // default seed dob
        });
      } else {
        await mobileApi.auth.login({
          username: username.trim(),
          password: password.trim(),
        });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <ExpoThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      
      {token ? (
        /* Authenticated: Render App Navigation Tabs */
        <AppTabs />
      ) : (
        /* Unauthenticated: Render Login/Register Screen Gate */
        <SafeAreaView style={[styles.loginWrapper, { backgroundColor: theme.background }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer} style={{ width: '100%' }}>
              <View style={[styles.loginCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                {/* Logo / Title */}
                <View style={styles.logoRow}>
                  <View style={styles.heartIcon}>
                    <Text style={styles.heartText}>♥</Text>
                  </View>
                  <Text style={[styles.brandTitle, { color: theme.text }]}>BloodHero</Text>
                </View>
                <Text style={[styles.tagline, { color: theme.textSecondary }]}>
                  {isRegisterMode ? 'Join the emergency donor network' : 'Sign in to coordinate donations'}
                </Text>

                {authError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ {authError}</Text>
                  </View>
                ) : null}

                {/* Form fields */}
                <View style={styles.formContainer}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Username</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                    placeholder="Enter username"
                    placeholderTextColor={theme.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />

                  {isRegisterMode && (
                    <>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email Address</Text>
                      <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                        placeholder="email@example.com"
                        placeholderTextColor={theme.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </>
                  )}

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Password</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  {isRegisterMode && (
                    <>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Phone Number</Text>
                      <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                        placeholder="+254712345678"
                        placeholderTextColor={theme.textSecondary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />

                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>City</Text>
                      <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}
                        placeholder="Nairobi"
                        placeholderTextColor={theme.textSecondary}
                        value={city}
                        onChangeText={setCity}
                      />

                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Blood Type</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodSelector}>
                        {bloodTypes.map(type => {
                          const isSelected = bloodType === type;
                          return (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.bloodBubble,
                                isSelected 
                                  ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } 
                                  : { backgroundColor: theme.background, borderColor: theme.backgroundSelected }
                              ]}
                              onPress={() => setBloodType(type)}
                            >
                              <Text style={[styles.bloodBubbleText, { color: isSelected ? '#ffffff' : theme.text }]}>
                                {type}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleAuthSubmit}
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {isRegisterMode ? 'Create Account' : 'Sign In'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Toggle mode */}
                  <TouchableOpacity 
                    style={styles.toggleBtn}
                    onPress={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError('');
                    }}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                      {isRegisterMode 
                        ? 'Already have an account? Sign In' 
                        : "Don't have an account? Sign Up"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </ExpoThemeProvider>
  );
}

import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loginWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  heartIcon: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderRadius: 12,
    padding: Spacing.two,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formContainer: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  bloodSelector: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bloodBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bloodBubbleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleBtn: {
    marginTop: Spacing.one,
    padding: 8,
  },
});
