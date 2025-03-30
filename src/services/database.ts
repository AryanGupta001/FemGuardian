import { initializeApp, getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export interface EmergencyContact {
  id?: string;
  name: string;
  phoneNumber: string;
  relation: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  phone?: string;
  age?: number;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  emergencyContacts: EmergencyContact[];
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

export class DatabaseService {
  // User Profile Operations
  async createUserProfile(profile: Omit<UserProfile, 'uid'>) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    const userProfile = {
      ...profile,
      uid: currentUser.uid,
      emergencyContacts: profile.emergencyContacts || []
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
    
    const userData = snapshot.val();
    if (!userData) return null;

    // Ensure emergencyContacts is always an array
    let contacts: EmergencyContact[] = [];
    if (userData.emergencyContacts) {
      // If it's an object (Firebase sometimes converts arrays to objects), convert it back
      if (typeof userData.emergencyContacts === 'object' && !Array.isArray(userData.emergencyContacts)) {
        contacts = Object.values(userData.emergencyContacts);
      } else if (Array.isArray(userData.emergencyContacts)) {
        contacts = userData.emergencyContacts;
      }
    }

    return {
      ...userData,
      emergencyContacts: contacts
    };
  }

  // Emergency Contacts
  async addEmergencyContact(contact: EmergencyContact) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    try {
      const userRef = database().ref(`/users/${currentUser.uid}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      
      // Ensure contacts is an array
      const contacts: EmergencyContact[] = userData.emergencyContacts || [];
      
      // Check if contact already exists (either phone number or name)
      const exists = contacts.some(c => 
        c && (
          c.phoneNumber === contact.phoneNumber || 
          (c.name.toLowerCase() === contact.name.toLowerCase() && c.relation === contact.relation)
        )
      );
      if (exists) {
        throw new Error('This contact is already added as an emergency contact');
      }

      // Check contact limit
      if (contacts.length >= 2) {
        throw new Error('Maximum number of emergency contacts (2) reached');
      }

      // Add new contact to the array with an ID
      const newId = database().ref().push().key;
      if (!newId) {
        throw new Error('Failed to generate contact ID');
      }
      
      const newContact = {
        ...contact,
        id: newId
      };
      contacts.push(newContact);

      // Update the entire emergencyContacts array
      await userRef.update({
        emergencyContacts: contacts
      });

      return newContact;
    } catch (error: any) {
      console.error('Error adding emergency contact:', error);
      throw new Error(error.message || 'Failed to add emergency contact');
    }
  }

  async updateEmergencyContact(contactId: string, contact: EmergencyContact) {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    try {
      const userRef = database().ref(`/users/${currentUser.uid}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      
      const contacts: EmergencyContact[] = userData.emergencyContacts || [];
      const contactIndex = contacts.findIndex(c => c.id === contactId);
      
      if (contactIndex === -1) {
        throw new Error('Contact not found');
      }

      contacts[contactIndex] = {
        ...contact,
        id: contactId
      };

      await userRef.update({
        emergencyContacts: contacts
      });

      return contacts[contactIndex];
    } catch (error: any) {
      console.error('Error updating emergency contact:', error);
      throw new Error(error.message || 'Failed to update emergency contact');
    }
  }
}

export const databaseService = new DatabaseService();