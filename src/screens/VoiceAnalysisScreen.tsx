import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorderPlayer = new AudioRecorderPlayer();

const VoiceAnalysisScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const result = await audioRecorderPlayer.startRecorder();
      setRecordingPath(result);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      analyzeRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const analyzeRecording = async () => {
    if (!recordingPath) return;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: recordingPath,
        type: 'audio/wav',
        name: 'recording.wav',
      });

      const response = await fetch('https://speech-threat-chatbot-api.onrender.com/analyze-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.is_threat) {
        Alert.alert(
          'Threat Detected',
          `Threat Level: ${data.threat_score}/10\nTranscribed Text: ${data.transcribed_text}`,
          [
            { text: 'OK' },
            {
              text: 'Send SOS',
              style: 'destructive',
              onPress: () => {
                // Navigate to Home screen and trigger SOS
                // navigation.navigate('Home', { triggerSOS: true });
              },
            },
          ]
        );
      } else {
        Alert.alert('Analysis Complete', 'No threats detected in the audio.');
      }
    } catch (error) {
      console.error('Error analyzing recording:', error);
      Alert.alert('Error', 'Failed to analyze recording');
    } finally {
      setAnalyzing(false);
      setRecordingPath(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Voice Analysis</Text>
        <Text style={styles.description}>
          Record audio to analyze potential threats in your surroundings
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={analyzing}
      >
        {analyzing ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <View style={[styles.recordButtonInner, isRecording && styles.recordingButtonInner]} />
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingButton: {
    backgroundColor: '#ff4081',
  },
  recordButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  recordingButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceAnalysisScreen; 