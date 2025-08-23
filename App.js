import { Text, SafeAreaView, StyleSheet, Button, View , TouchableOpacity, TextInput, Modal, FlatList, Alert, Dimensions} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import React, { useState, useRef } from 'react';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState([]);
  //const [currentVideo, setCurrentVideo] = useState("http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
  const [currentVideo, setCurrentVideo] = useState(null);
  const [newVideoURL, setNewVideoURL] = useState('');
  const [newVideoRating, setNewVideoRating] = useState(0);
  const [newVideoLabels, setNewVideoLabels] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);

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

    const handleLogin = () => {
      if (password === 'qv') {
        setIsLoggedIn(true);
      } else {
        Alert.alert('Error', 'Incorrect password');
      }
    };
  
    const handleAddVideo = () => {
      if (newVideoURL.trim()) {
        // Split the input by spaces and filter for URLs starting with http
        const urlPattern = /https?:\/\/[^\s]+/g;
        const foundUrls = newVideoURL.match(urlPattern);
        
        if (foundUrls && foundUrls.length > 0) {
          const newVideos = foundUrls.map(url => ({
            url: url.trim(),
            dateAdded: new Date().toLocaleDateString(),
            rating: newVideoRating,
            labels: newVideoLabels.split(',').map(label => label.trim()).filter(label => label)
          }));
          
          setVideos([...videos, ...newVideos]);
          setNewVideoURL('');
          setNewVideoRating(0);
          setNewVideoLabels('');
          
          // Show confirmation message
          if (foundUrls.length > 1) {
            Alert.alert('Success', `Added ${foundUrls.length} videos to the list`);
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

  return (
    <SafeAreaView style={styles.container}>

    <View style={styles.addURL}>
      <TextInput
        style={styles.addURLTxt}
        placeholder="Enter Video URL"
        value={newVideoURL}
        onChangeText={setNewVideoURL}
      />
      <TextInput
        style={styles.addRatingTxt}
        placeholder="Rating (0-5)"
        value={newVideoRating.toString()}
        onChangeText={(text) => {
          const rating = parseInt(text) || 0;
          setNewVideoRating(Math.min(Math.max(rating, 0), 5));
        }}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.addLabelsTxt}
        placeholder="Labels (comma separated)"
        value={newVideoLabels}
        onChangeText={setNewVideoLabels}
      />
      <TouchableOpacity style={styles.addURLBtn} onPress={handleAddVideo}>
        <Text style={styles.addBtnText}>Add Video</Text>
      </TouchableOpacity>
    </View>

    <VideoView style={styles.videoPlayer} player={player} allowsFullscreen allowsPictureInPicture />
      
    <View style={styles.listContainer}>
      <FlatList
        data={videos}
        renderItem={({ item, index }) => (
          <View style={styles.videoEntryContainer}>
            <View style={styles.videoInfoContainer}>
              <Text style={styles.videoURLText} onPress={() => setCurrentVideo(item.url)}>
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


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  addRatingTxt: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
    fontSize: 14,
  },
  addLabelsTxt: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
    fontSize: 14,
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
