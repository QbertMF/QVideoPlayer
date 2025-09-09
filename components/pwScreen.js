import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import appConfig from '../app.json';

const PasswordScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const appVersion = appConfig.expo.version;

  const handleLogin = () => {
    if (password === 'qv') {
      onLogin();
      setPassword(''); // Clear password field
    } else {
      Alert.alert('Error', 'Incorrect password');
      setPassword(''); // Clear password field on error
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>QVideoPlayer</Text>
      <Text style={styles.versionText}>v{appVersion}</Text>
      <Text style={styles.loginSubtitle}>Enter password to continue</Text>
      
      <TextInput
        style={styles.passwordInput}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        autoFocus={true}
        onSubmitEditing={handleLogin}
      />
      
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginBtnText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  versionText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    width: '100%',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PasswordScreen;
