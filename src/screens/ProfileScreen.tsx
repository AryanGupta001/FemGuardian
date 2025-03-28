import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { databaseService } from '../services/database';
import type { UserProfile } from '../services/database';

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  relation: string;
}

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    phoneNumber: '',
    relation: '',
  });
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const userProfile = await databaseService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      await databaseService.updateUserProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phoneNumber || !newContact.relation) {
      Alert.alert('Error', 'Please fill in all contact details');
      return;
    }

    try {
      setSaving(true);
      await databaseService.addEmergencyContact(newContact);
      setNewContact({ name: '', phoneNumber: '', relation: '' });
      setShowAddContact(false);
      await loadProfile(); // Reload profile to get updated contacts
      Alert.alert('Success', 'Emergency contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={profile.phoneNumber}
          onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Group"
          value={profile.bloodGroup}
          onChangeText={(text) => setProfile({ ...profile, bloodGroup: text })}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdateProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {profile.emergencyContacts.map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactDetails}>{contact.phoneNumber}</Text>
            <Text style={styles.contactDetails}>{contact.relation}</Text>
          </View>
        ))}

        {showAddContact ? (
          <View style={styles.addContactForm}>
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Phone Number"
              value={newContact.phoneNumber}
              onChangeText={(text) => setNewContact({ ...newContact, phoneNumber: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Relation"
              value={newContact.relation}
              onChangeText={(text) => setNewContact({ ...newContact, relation: text })}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddContact(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={handleAddContact}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Add Contact</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={() => setShowAddContact(true)}
          >
            <Text style={styles.buttonText}>+ Add Emergency Contact</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#e91e63',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2196f3',
  },
  cancelButton: {
    backgroundColor: '#666',
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    margin: 20,
  },
  contactCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactDetails: {
    fontSize: 14,
    color: '#666',
  },
  addContactForm: {
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default ProfileScreen; 