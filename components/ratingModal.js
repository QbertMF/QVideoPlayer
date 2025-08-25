import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StyleSheet } from 'react-native';

const RatingModal = ({ 
  visible, 
  onClose, 
  currentRating, 
  onRatingChange, 
  onSubmit 
}) => {
  const handleDecrease = () => {
    const current = parseInt(currentRating) || 0;
    if (current > 0) {
      onRatingChange((current - 1).toString());
    }
  };

  const handleIncrease = () => {
    const current = parseInt(currentRating) || 0;
    if (current < 5) {
      onRatingChange((current + 1).toString());
    }
  };

  const handleSubmit = () => {
    const numRating = parseInt(currentRating);
    if (isNaN(numRating) || numRating < 0 || numRating > 5) {
      Alert.alert('Error', 'Please enter a valid rating between 0 and 5');
      return;
    }
    onSubmit(numRating);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.ratingModalOverlay}>
        <View style={styles.ratingModalContent}>
          <Text style={styles.ratingModalTitle}>Update Rating</Text>
          <Text style={styles.ratingModalSubtitle}>Enter a rating between 0 and 5:</Text>
          
          <View style={styles.ratingInputContainer}>
            <TouchableOpacity 
              style={styles.ratingButton} 
              onPress={handleDecrease}
            >
              <Text style={styles.ratingButtonText}>−</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.ratingInput}
              value={currentRating}
              onChangeText={onRatingChange}
              placeholder="0-5"
              keyboardType="numeric"
              maxLength={1}
              autoFocus={true}
            />
            
            <TouchableOpacity 
              style={styles.ratingButton} 
              onPress={handleIncrease}
            >
              <Text style={styles.ratingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.ratingModalButtons}>
            <TouchableOpacity style={styles.ratingCancelBtn} onPress={onClose}>
              <Text style={styles.ratingCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ratingUpdateBtn} onPress={handleSubmit}>
              <Text style={styles.ratingUpdateText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  ratingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ratingModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  ratingModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  ratingModalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  ratingButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    width: 60,
  },
  ratingModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  ratingCancelBtn: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  ratingUpdateBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  ratingCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  ratingUpdateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RatingModal;
