// Run this script to clear all stored data
// Usage: node clear-storage.js

console.log('To clear app storage on your device:');
console.log('');
console.log('For iOS Simulator:');
console.log('1. Device > Erase All Content and Settings');
console.log('2. Or: xcrun simctl erase all');
console.log('');
console.log('For Android Emulator:');
console.log('1. Settings > Apps > HR Nexus > Storage > Clear Data');
console.log('2. Or: adb shell pm clear com.yourcompany.mobile');
console.log('');
console.log('For Expo Go:');
console.log('1. Shake device > Dev Menu > Clear AsyncStorage');
console.log('2. Or uninstall and reinstall the app');
console.log('');
console.log('Alternative: Add a logout button in your app that calls:');
console.log('await storage.removeToken()');
