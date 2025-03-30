import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { analyzeVoice } from '../services/api';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { ErrorHandler } from '../utils/ErrorHandler';
import SkeletonLoader from '../components/SkeletonLoader';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const audioRecorderPlayer = new AudioRecorderPlayer();

type VoiceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VoiceAnalysis'>;

const VoiceAnalysisScreen = () => {
  const navigation = useNavigation<VoiceScreenNavigationProp>();
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const checkMicrophonePermission = async () => {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        ios: PERMISSIONS.IOS.MICROPHONE,
      });

      if (!permission) {
        throw new Error('Platform not supported');
      }

      const result = await check(permission);
      
      if (result === RESULTS.DENIED) {
        const permissionResult = await request(permission);
        if (permissionResult !== RESULTS.GRANTED) {
          throw new Error('Microphone permission denied');
        }
      } else if (result !== RESULTS.GRANTED) {
        throw new Error('Microphone permission not granted');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Microphone access is needed for voice analysis'
      });
      ErrorHandler.handle(error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const audioPath = Platform.select({
        ios: 'recording.m4a',
        android: '/storage/emulated/0/Download/recording.mp3',
      });

      if (!audioPath) throw new Error('Platform not supported');

      await audioRecorderPlayer.startRecorder(audioPath);
      audioRecorderPlayer.addRecordBackListener((e) => {
        const seconds = Math.floor(e.currentPosition / 1000);
        setRecordingTime({
          minutes: Math.floor(seconds / 60),
          seconds: seconds % 60,
        });
      });
      
      setRecordingPath(audioPath);
      setRecording(true);
      Toast.show({
        type: 'info',
        text1: 'Recording Started',
        text2: 'Tap the button again to stop recording'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Recording Error',
        text2: 'Failed to start recording'
      });
      ErrorHandler.handle(error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      setRecordingTime({ minutes: 0, seconds: 0 });
      analyzeRecording();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Recording Error',
        text2: 'Failed to stop recording'
      });
      ErrorHandler.handle(error);
    }
  };

  const analyzeRecording = async () => {
    if (!recordingPath) {
      Toast.show({
        type: 'error',
        text1: 'Analysis Error',
        text2: 'No recording found to analyze'
      });
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: recordingPath,
        type: Platform.OS === 'ios' ? 'audio/x-m4a' : 'audio/mp3',
        name: Platform.OS === 'ios' ? 'recording.m4a' : 'recording.mp3',
      });

      const data = await analyzeVoice(formData);
      
      if (data.is_threat) {
        Toast.show({
          type: 'error',
          text1: 'Threat Detected',
          text2: `Threat Level: ${data.threat_score}/10`
        });
        navigation.navigate('Home', { triggerSOS: true });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Analysis Complete',
          text2: 'No threats detected'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Analysis Error',
        text2: 'Failed to analyze recording'
      });
      ErrorHandler.handle(error);
    } finally {
      setAnalyzing(false);
      setRecordingPath(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Card variant="elevated" style={styles.card}>
            <SkeletonLoader width={200} height={24} style={styles.skeletonTitle} />
            <SkeletonLoader width={300} height={16} style={styles.skeletonText} />
          </Card>

          <View style={styles.analysisContainer}>
            <Card variant="elevated" style={styles.analysisCard}>
              <View style={styles.analysisInfo}>
                <SkeletonLoader width={150} height={20} style={styles.skeletonTitle} />
                <SkeletonLoader width={200} height={16} style={styles.skeletonText} />
              </View>
            </Card>
          </View>

          <View style={styles.controlsContainer}>
            <View style={styles.recordButton}>
              <SkeletonLoader width={160} height={160} borderRadius={80} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Record your voice to analyze for potential threats
        </Text>

        <View style={styles.recordSection}>
          <Text style={styles.recordStatus}>
            {analyzing ? 'Analyzing voice pattern...' : 
             recording ? formatTime(recordingTime.minutes, recordingTime.seconds) :
             'Ready to Record'}
          </Text>
          <Text style={styles.recordInstructions}>
            {recording ? 'Tap to stop recording' : 'Tap the button below to start recording'}
          </Text>

          <Button
            onPress={recording ? stopRecording : startRecording}
            title={recording ? 'STOP' : 'RECORD'}
            variant={recording ? 'danger' : 'primary'}
            size="large"
            style={styles.recordButton}
            textStyle={styles.recordButtonText}
            disabled={analyzing}
          />
        </View>

        {analyzing && (
          <Card variant="elevated" style={styles.analysisCard}>
            <Text style={styles.analysisText}>Analyzing voice pattern...</Text>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  description: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 60,
    paddingHorizontal: 24,
    lineHeight: 32,
  },
  recordSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  recordStatus: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  recordInstructions: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  recordButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  analysisCard: {
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  analysisText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  skeletonTitle: {
    marginBottom: 8,
  },
  skeletonText: {
    marginBottom: 4,
  },
  skeletonIcon: {
    marginRight: 20,
  },
});

export default VoiceAnalysisScreen; 