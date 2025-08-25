import { Text, SafeAreaView, StyleSheet, Button, View , TouchableOpacity, TextInput, Modal, FlatList, Alert, Dimensions, Linking, Keyboard, AppState} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import React, { useState, useRef, useEffect } from 'react';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PasswordScreen from './components/pwScreen';

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videos, setVideos] = useState([]);
  //const [currentVideo, setCurrentVideo] = useState("http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
  const [currentVideo, setCurrentVideo] = useState(null);
  const [newVideoURL, setNewVideoURL] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [useBrowser, setUseBrowser] = useState(true);

  // Constant encryption key (same across app sessions)
  const ENCRYPTION_KEY = 42857; // Fixed random number for encryption
  const STORAGE_KEY = 'encrypted_videos';

  // Simple encryption function using XOR with hex encoding
  const encryptData = (data) => {
    const jsonString = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i) ^ (ENCRYPTION_KEY % 256);
      encrypted += charCode.toString(16).padStart(2, '0');
    }
    return encrypted;
  };

  // Simple decryption function using XOR with hex decoding
  const decryptData = (encryptedData) => {
    try {
      let decrypted = '';
      for (let i = 0; i < encryptedData.length; i += 2) {
        const hexPair = encryptedData.substr(i, 2);
        const charCode = parseInt(hexPair, 16) ^ (ENCRYPTION_KEY % 256);
        decrypted += String.fromCharCode(charCode);
      }
      return JSON.parse(decrypted);
    } catch (error) {
      console.log('Decryption error:', error);
      return [];
    }
  };

  // Save encrypted videos to storage
  const saveVideosToStorage = async (videosToSave) => {
    try {
      const encryptedData = encryptData(videosToSave);
      await AsyncStorage.setItem(STORAGE_KEY, encryptedData);
      console.log('Videos saved and encrypted successfully');
    } catch (error) {
      console.log('Error saving videos:', error);
    }
  };

  // Load and decrypt videos from storage
  const loadVideosFromStorage = async () => {
    try {
      const encryptedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (encryptedData) {
        const decryptedVideos = decryptData(encryptedData);
        setVideos(decryptedVideos);
        console.log('Videos loaded and decrypted successfully');
      }
    } catch (error) {
      console.log('Error loading videos:', error);
    }
  };

  // Load videos when app starts
  useEffect(() => {
    loadVideosFromStorage();
  }, []);

  // Save videos whenever the videos state changes
  useEffect(() => {
    if (videos.length > 0) {
      saveVideosToStorage(videos);
    }
  }, [videos]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Save videos when app goes to background
        saveVideosToStorage(videos);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [videos]);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const modalWidth = 120;
  const modalHeight = 120; // Approximate height of modal content

  // Helper function to calculate safe modal position
  const calculateSafeModalPosition = (touchX, touchY) => {
    let x = touchX - modalWidth;
    let y = touchY;

    // Ensure modal doesn't go off the right edge
    if (x + modalWidth > screenWidth) {
      x = screenWidth - modalWidth - 10;
    }
    
    // Ensure modal doesn't go off the left edge
    if (x < 10) {
      x = 10;
    }
    
    // Ensure modal doesn't go off the bottom edge
    if (y + modalHeight > screenHeight) {
      y = touchY - modalHeight;
    }
    
    // Ensure modal doesn't go off the top edge
    if (y < 40) {
      y = 40;
    }

    return { x, y };
  };

    const player = useVideoPlayer(currentVideo, player => {
      player.loop = true;
      player.play();
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

    const handleAddVideo = () => {
      if (newVideoURL.trim()) {
        // Split the input by spaces and filter for URLs starting with http
        const urlPattern = /https?:\/\/[^\s]+/g;
        const foundUrls = newVideoURL.match(urlPattern);
        
        if (foundUrls && foundUrls.length > 0) {
          // Get existing URLs for duplicate checking
          const existingUrls = videos.map(video => video.url);
          
          // Filter out duplicates
          const uniqueNewUrls = foundUrls.filter(url => !existingUrls.includes(url.trim()));
          
          if (uniqueNewUrls.length > 0) {
            const newVideos = uniqueNewUrls.map(url => ({
              url: url.trim(),
              dateAdded: new Date().toLocaleDateString(),
              rating: 0,
              labels: []
            }));
            
            setVideos([...videos, ...newVideos]);
            setNewVideoURL('');
            
            // Dismiss the keyboard after adding videos
            Keyboard.dismiss();
            
            // Show confirmation message
            const duplicateCount = foundUrls.length - uniqueNewUrls.length;
            if (uniqueNewUrls.length > 1) {
              let message = `Added ${uniqueNewUrls.length} videos to the list`;
              if (duplicateCount > 0) {
                message += `. ${duplicateCount} duplicate URL(s) were skipped.`;
              }
              Alert.alert('Success', message);
            } else if (duplicateCount > 0) {
              Alert.alert('Info', `${duplicateCount} duplicate URL(s) were skipped.`);
            }
          } else {
            Alert.alert('Info', 'All URLs are already in the list. No new videos were added.');
          }
        } else {
          Alert.alert('Error', 'Please enter at least one valid URL starting with http:// or https://');
        }
      } else {
        Alert.alert('Error', 'Please enter a valid video URL');
      }
    };
    
    const handleDeleteVideo = () => {
      const updatedVideos = [...videos];
      updatedVideos.splice(selectedVideoIndex, 1);
      setVideos(updatedVideos);
      setModalVisible(false);
    };
  
    const handleCopyURL = async () => {
      const videoUrl = videos[selectedVideoIndex].url;
      setModalVisible(false);
      await Clipboard.setStringAsync(videoUrl);
      Alert.alert('Copied', 'URL copied to clipboard');
    };

    const handleOpenInBrowser = async (url) => {
      try {
        // Debug: Log the URL being opened
        console.log('Opening URL:', url);
        
        // Ensure URL has proper protocol
        let formattedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          formattedUrl = 'https://' + url;
        }
        
        console.log('Formatted URL:', formattedUrl);
        
        // Check if URL is supported
        const supported = await Linking.canOpenURL(formattedUrl);
        console.log('URL supported:', supported);
        
        if (supported) {
          await Linking.openURL(formattedUrl);
        } else {
          Alert.alert('Error', `Cannot open this URL: ${formattedUrl}`);
        }
      } catch (error) {
        console.log('Browser open error:', error);
        Alert.alert('Error', `Could not open URL in browser: ${error.message}`);
      }
    };

    const handleVideoSelection = (url) => {
      if (useBrowser) {
        handleOpenInBrowser(url);
      } else {
        setCurrentVideo(url);
      }
    };

  return (
    <SafeAreaView style={styles.container}>
      {!isLoggedIn ? (
        // Login Screen Component
        <PasswordScreen onLogin={() => setIsLoggedIn(true)} />
      ) : (
        // Main App
        <>
          <View style={styles.addURL}>
            <TextInput
              style={styles.addURLTxt}
              placeholder="Enter Video URL"
              value={newVideoURL}
              onChangeText={setNewVideoURL}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.addURLBtn} onPress={handleAddVideo}>
              <Text style={styles.addBtnText}>Add Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleBtn, useBrowser && styles.toggleBtnActive]} 
              onPress={() => setUseBrowser(!useBrowser)}
            >
              <Text style={[styles.toggleBtnText, useBrowser && styles.toggleBtnTextActive]}>
                {useBrowser ? '🌐 External Browser' : '📺 Video Player Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          {!useBrowser && (
            <VideoView style={styles.videoPlayer} player={player} allowsFullscreen allowsPictureInPicture />
          )}
            
          <View style={styles.listContainer}>
      <FlatList
        data={videos}
        renderItem={({ item, index }) => (
          <View style={styles.videoEntryContainer}>
            <View style={styles.videoInfoContainer}>
              <Text style={styles.videoURLText} onPress={() => handleVideoSelection(item.url)}>
                {item.url}
              </Text>
              <View style={styles.videoMetaContainer}>
                <Text style={styles.videoDateText}>Added: {item.dateAdded}</Text>
                <Text style={styles.videoRatingText}>Rating: {'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}</Text>
                {item.labels.length > 0 && (
                  <View style={styles.labelsContainer}>
                    {item.labels.map((label, labelIndex) => (
                      <Text key={labelIndex} style={styles.labelText}>#{label}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
                style={styles.menuButton}
                onPress={(event) => {
                  const { pageX, pageY } = event.nativeEvent;
                  const safePosition = calculateSafeModalPosition(pageX, pageY);
                  setModalPosition(safePosition);
                  console.log('Touch Position:', { x: pageX, y: pageY });
                  console.log('Safe Position:', safePosition);
                  setSelectedVideoIndex(index);
                  setModalVisible(true);
                }}
            >
            <Text style={styles.menuButtonText}>⋮</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>

      {/* Modal for options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { top: modalPosition.y, left: modalPosition.x }]}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalItem} 
              onPress={() => {
                handleOpenInBrowser(videos[selectedVideoIndex].url);
                setModalVisible(false);
              }} > 
              <Text style={styles.modalText}>Open in Browser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} 
              onPress={handleDeleteVideo} > 
              <Text style={styles.modalText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} 
              onPress={handleCopyURL} >
              <Text style={styles.modalText}>Copy URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem}
              onPress={() => setModalVisible(false)} > 
              <Text style={styles.modalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </View>
        </Modal>
        </>
      )}
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  addURL: {
    marginBottom: 15,
  },
  addURLTxt: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
    fontSize: 14,
    height: 80,
    maxHeight: 80,
  },
  addURLBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 5,
  },
  addBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleBtn: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toggleBtnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleBtnTextActive: {
    color: 'white',
  },
  videoPlayer: {
    height: 200,
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#000',
  },
  listContainer: {
    flex: 1,
  },
  videoEntryContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
    padding: 10,
  },
  videoInfoContainer: {
    flex: 1,
  },
  videoURLText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  videoMetaContainer: {
    marginTop: 5,
  },
  videoDateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  videoRatingText: {
    fontSize: 12,
    color: '#ff9500',
    marginBottom: 5,
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  labelText: {
    fontSize: 10,
    color: '#0066cc',
    backgroundColor: '#e6f3ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 2,
  },
  menuButton: {
    paddingLeft: 10,
    paddingRight: 10,
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    position: 'absolute',
    width: 120,
    zIndex: 1000,
  },
  modalItem: {
    marginBottom: 2,
    marginTop: 2,
  },
  modalText: {
    fontSize: 14,
  },
  modalContent: {
    backgroundColor: '#ddd',
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
  },
});
