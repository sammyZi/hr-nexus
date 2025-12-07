import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { FontFamily } from '@/constants/theme';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

const { height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });



  if (!fontsLoaded) {
    return null;
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
            {/* Header Section with Gradient */}
            <LinearGradient
              colors={['#2563EB', '#1D4ED8', '#4F46E5']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decorative circles */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
              
              {/* Logo */}
              <View style={styles.logoSection}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>H</Text>
                </View>
                <Text style={styles.brandName}>HR Nexus</Text>
              </View>
            </LinearGradient>

            {/* Form Card - Overlapping Header */}
            <View style={styles.formWrapper}>
              <View style={styles.formCard}>
                {/* Welcome Text Inside Card */}
                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeTitle}>Welcome Back</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Sign in to access your HR workspace
                  </Text>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={emailFocused ? '#2563EB' : '#9CA3AF'} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={emailInputRef}
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="you@company.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                      textContentType="emailAddress"
                      editable={!loading}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={passwordFocused ? '#2563EB' : '#9CA3AF'} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      textContentType="password"
                      onSubmitEditing={handleSignIn}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ['#9CA3AF', '#6B7280'] : ['#2563EB', '#4F46E5']}
                    style={styles.signInGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <View style={styles.loaderContainer}>
                        <View style={styles.loader} />
                        <Text style={styles.signInButtonText}>Signing in...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.signInButtonText}>Sign In</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/signup')}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <Text style={styles.footerLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: isSmallDevice ? 20 : 30,
  },
  headerGradient: {
    height: isSmallDevice ? 180 : 220,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  logo: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  formWrapper: {
    marginTop: -50,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: isSmallDevice ? 20 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 24 : 32,
    paddingTop: 4,
  },
  welcomeTitle: {
    fontSize: isSmallDevice ? 26 : 30,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: isSmallDevice ? 14 : 15,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: isSmallDevice ? 16 : 20,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  inputWrapperFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  signInButton: {
    marginTop: isSmallDevice ? 16 : 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    minHeight: 54,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.3,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loader: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallDevice ? 16 : 20,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});
