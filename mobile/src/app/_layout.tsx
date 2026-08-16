import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [showPassword, setShowPassword] = useState(false);
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
        <SafeAreaView style={[styles.loginWrapper, { backgroundColor: '#131314' }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer} style={{ width: '100%' }}>
              <View style={[styles.loginCard, { backgroundColor: '#1C1B1C', borderColor: '#2A2A2B' }]}>
                {/* Logo / Title */}
                <View style={styles.logoRow}>
                  <View style={styles.heartIcon}>
                    <Text style={styles.heartText}>♥</Text>
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>BloodHero</Text>
                    <Text style={styles.hudSubtext}>v2.4</Text>
                  </View>
                </View>
                <Text style={styles.tagline}>
                  {isRegisterMode ? 'REGISTER DONOR PROFILE' : 'AUTHENTICATE SESSION'}
                </Text>

                {authError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠ {authError}</Text>
                  </View>
                ) : null}

                {/* Form fields */}
                <View style={styles.formContainer}>
                  <Text style={styles.fieldLabel}>USERNAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter username"
                    placeholderTextColor="#919095"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />

                  {isRegisterMode && (
                    <>
                      <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="email@example.com"
                        placeholderTextColor="#919095"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </>
                  )}

                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                      placeholder="••••••••"
                      placeholderTextColor="#919095"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity 
                      style={styles.eyeToggleBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={20} 
                        color="#919095" 
                      />
                    </TouchableOpacity>
                  </View>

                  {isRegisterMode && (
                    <>
                      <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+254712345678"
                        placeholderTextColor="#919095"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />

                      <Text style={styles.fieldLabel}>CITY / REGION</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nairobi"
                        placeholderTextColor="#919095"
                        value={city}
                        onChangeText={setCity}
                      />

                      <Text style={styles.fieldLabel}>BLOOD GROUP</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodSelector}>
                        {bloodTypes.map(type => {
                          const isSelected = bloodType === type;
                          return (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.bloodBubble,
                                isSelected 
                                  ? { backgroundColor: '#FF0033', borderColor: '#FF5357' } 
                                  : { backgroundColor: '#0E0E0F', borderColor: '#2A2A2B' }
                              ]}
                              onPress={() => setBloodType(type)}
                            >
                              <Text style={[styles.bloodBubbleText, { color: isSelected ? '#ffffff' : '#E5E2E3' }]}>
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
                        {isRegisterMode ? 'REGISTER ACCOUNT' : 'SIGN IN'}
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
                    <Text style={{ color: '#FF5357', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                      {isRegisterMode 
                        ? 'ALREADY REGISTERED? SIGN IN' 
                        : "NEW TO BLOODHERO? REGISTER DONOR ACCOUNT"}
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

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loginWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heartIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF0033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  brandTitle: {
    color: '#E5E2E3',
    fontSize: 20,
    fontWeight: '900',
  },
  hudSubtext: {
    color: '#00F1FE',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  tagline: {
    color: '#919095',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 0, 51, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 51, 0.3)',
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    color: '#FF5357',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formContainer: {
    gap: 10,
  },
  fieldLabel: {
    color: '#919095',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0E0E0F',
    borderWidth: 1,
    borderColor: '#2A2A2B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#E5E2E3',
    fontSize: 13,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0F',
    borderWidth: 1,
    borderColor: '#2A2A2B',
    borderRadius: 12,
    paddingRight: 8,
  },
  eyeToggleBtn: {
    padding: 8,
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
    backgroundColor: '#FF0033',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  toggleBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
});
