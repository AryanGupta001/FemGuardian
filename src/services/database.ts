import { initializeApp, getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  bloodGroup?: string;
  emergencyContacts: {
    name: string;
    phoneNumber: string;
    relation: string;
  }[];
}

export interface LocationRecord {
  latitude: number;
  longitude: number;
  timestamp: number;
  userId: string;
}

export interface VoiceAnalysis {
  userId: string;
  timestamp: number;
  audioUrl: string;
  threatLevel: number;
  analysis: string;
}

class DatabaseService {
  // User Profile Operations
  async createUserProfile(profile: Omit<UserProfile, 'uid'>) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const userProfile: UserProfile = {
      ...profile,
      uid: currentUser.uid,
    };

    await database()
      .ref(`/users/${currentUser.uid}`)
      .set(userProfile);
  }

  async updateUserProfile(updates: Partial<UserProfile>) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    await database()
      .ref(`/users/${currentUser.uid}`)
      .update(updates);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const snapshot = await database()
      .ref(`/users/${userId}`)
      .once('value');
    
    return snapshot.val();
  }

  // Emergency Contacts
  async addEmergencyContact(contact: UserProfile['emergencyContacts'][0]) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const userRef = database().ref(`/users/${currentUser.uid}/emergencyContacts`);
    await userRef.push(contact);
  }

  // Location Tracking
  async saveLocation(location: Omit<LocationRecord, 'userId'>) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const locationRecord: LocationRecord = {
      ...location,
      userId: currentUser.uid,
    };

    await database()
      .ref('/locations')
      .push(locationRecord);
  }

  // Voice Analysis
  async saveVoiceAnalysis(analysis: Omit<VoiceAnalysis, 'userId'>) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const voiceAnalysis: VoiceAnalysis = {
      ...analysis,
      userId: currentUser.uid,
    };

    await database()
      .ref('/voice-analysis')
      .push(voiceAnalysis);
  }
}

export const databaseService = new DatabaseService(); 