import { Text, SafeAreaView, StyleSheet, Button, View , TouchableOpacity, TextInput, Modal, FlatList, Alert, Dimensions, Linking, Keyboard, AppState} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import React, { useState, useRef, useEffect } from 'react';
import PasswordScreen from './components/pwScreen';
import RatingModal from './components/ratingModal';
import { WebView } from 'react-native-webview';

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [newVideoURL, setNewVideoURL] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingToEdit, setRatingToEdit] = useState(null);
  const [newRating, setNewRating] = useState('');
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState(null);

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
  const modalWidth = 150;
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

    const handleOpenInBrowser = (url) => {
      setWebViewUrl(url);
      setWebViewVisible(true);
    };

    const handleVideoSelection = (url) => {
      handleOpenInBrowser(url);
    };

    const handleExportVideos = async () => {
      try {
        if (videos.length === 0) {
          Alert.alert('Info', 'No videos to export');
          return;
        }
        
        // Extract URLs and join with space and line feed
        const urlList = videos.map(video => video.url).join(' \n');
        
        await Clipboard.setStringAsync(urlList);
        Alert.alert('Success', `${videos.length} video URLs copied to clipboard`);
      } catch (error) {
        Alert.alert('Error', 'Could not copy URLs to clipboard');
      }
    };

    const handleUpdateRating = (videoIndex) => {
      setRatingToEdit(videoIndex);
      setNewRating(videos[videoIndex].rating.toString());
      setRatingModalVisible(true);
    };

    const submitRatingUpdate = (numRating) => {
      const updatedVideos = [...videos];
      updatedVideos[ratingToEdit].rating = numRating;
      setVideos(updatedVideos);
      setRatingModalVisible(false);
      setRatingToEdit(null);
      setNewRating('');
      Alert.alert('Success', `Rating updated to ${numRating} star${numRating !== 1 ? 's' : ''}`);
    };

    const cancelRatingUpdate = () => {
      setRatingModalVisible(false);
      setRatingToEdit(null);
      setNewRating('');
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
              placeholder="Enter Video URL or whitespace separated list of URLs"
              value={newVideoURL}
              onChangeText={setNewVideoURL}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.addURLBtn} onPress={handleAddVideo}>
              <Text style={styles.addBtnText}>Add Video(s)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportBtn} 
              onPress={handleExportVideos}
            >
              <Text style={styles.exportBtnText}>
                📋 Export URLs ({videos.length})
              </Text>
            </TouchableOpacity>
          </View>

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
                <TouchableOpacity onPress={() => handleUpdateRating(index)}>
                  <Text style={styles.videoRatingText}>Rating: {'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}</Text>
                </TouchableOpacity>
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

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={cancelRatingUpdate}
        currentRating={newRating}
        onRatingChange={setNewRating}
        onSubmit={submitRatingUpdate}
      />

      {/* WebView Modal */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        onRequestClose={() => setWebViewVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={{ height: 50, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 10 }}>
            <TouchableOpacity onPress={() => setWebViewVisible(false)}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: webViewUrl }}
            style={{ flex: 1 }}
            incognito={true}
            cacheEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={false}
          />
        </View>
      </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20, // Reduced from 40 to move widgets up
    padding: 10,
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
    height: 70,
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
  exportBtn: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28a745',
    marginTop: 5,
  },
  exportBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
    width: 180,
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
    paddingHorizontal: 5,
  },
});
