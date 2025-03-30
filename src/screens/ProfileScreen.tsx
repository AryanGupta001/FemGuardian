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
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { databaseService } from '../services/database';
import type { UserProfile, EmergencyContact } from '../services/database';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, TextInput as PaperTextInput, IconButton } from 'react-native-paper';
import { ErrorHandler } from '../utils/ErrorHandler';
import { DatabaseService } from '../services/database';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Toast from 'react-native-toast-message';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const userProfile = await databaseService.getUserProfile(userId);
      setProfile(userProfile);
      if (userProfile) {
        setName(userProfile.name || '');
        setPhone(userProfile.phone || '');
        setAge(userProfile.age?.toString() || '');
        setBloodGroup(userProfile.bloodGroup || '');
        setAllergies(userProfile.allergies || '');
        setMedicalConditions(userProfile.medicalConditions || '');
      }
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const previousProfile = profile ? { ...profile } : null;
    
    try {
      setSaving(true);
      await databaseService.updateUserProfile({
        name,
        phone,
        age: age ? parseInt(age, 10) : undefined,
        bloodGroup,
        allergies,
        medicalConditions,
      });
      setIsEditing(false);
      await loadProfile(); // Reload profile after update
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully'
      });
    } catch (error) {
      if (previousProfile) {
        setProfile(previousProfile);
      }
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update profile. Please try again.'
      });
      ErrorHandler.handle(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditContact = async (contact: EmergencyContact) => {
    if (!profile?.emergencyContacts) return;
    
    try {
      navigation.navigate('AddContact', { 
        contact,
        isEditing: true,
        onSave: loadProfile
      });
    } catch (error) {
      ErrorHandler.handle(error);
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
        <ActivityIndicator size="large" color={colors.primary} />
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
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Button
          mode={isEditing ? "contained" : "outlined"}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          loading={saving}
          style={styles.editButton}
        >
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <PaperTextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            disabled={!isEditing}
            mode="outlined"
            dense
          />
          <PaperTextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            disabled={!isEditing}
            mode="outlined"
            dense
            keyboardType="phone-pad"
          />
          <PaperTextInput
            label="Age"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            disabled={!isEditing}
            mode="outlined"
            dense
            keyboardType="number-pad"
          />
          <PaperTextInput
            label="Blood Group"
            value={bloodGroup}
            onChangeText={setBloodGroup}
            style={styles.input}
            disabled={!isEditing}
            mode="outlined"
            dense
          />
          <PaperTextInput
            label="Allergies"
            value={allergies}
            onChangeText={setAllergies}
            style={styles.input}
            disabled={!isEditing}
            mode="outlined"
            dense
            multiline
          />
          <PaperTextInput
            label="Medical Conditions"
            value={medicalConditions}
            onChangeText={setMedicalConditions}
            style={[styles.input, styles.lastInput]}
            disabled={!isEditing}
            mode="outlined"
            dense
            multiline
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {(!profile.emergencyContacts || profile.emergencyContacts.length < 2) && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddContact', { onSave: loadProfile })}
                style={styles.addButton}
              >
                Add Contact
              </Button>
            )}
          </View>
          <Text style={styles.description}>
            You can add up to 2 emergency contacts who will be notified in case of an emergency.
          </Text>
          
          {profile.emergencyContacts?.map((contact, index) => (
            <Card key={contact.id || index} style={styles.contactCard}>
              <Card.Content>
                <View style={styles.contactHeader}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactDetail}>{contact.phoneNumber}</Text>
                    <Text style={styles.contactDetail}>{contact.relation}</Text>
                  </View>
                  <Button
                    mode="contained"
                    icon="pencil"
                    onPress={() => handleEditContact(contact)}
                    style={styles.editContactButton}
                    contentStyle={{ height: 40 }}
                  >
                    Edit
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor={colors.error}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editButton: {
    minWidth: 80,
    height: 36,
  },
  card: {
    margin: 12,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  lastInput: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  description: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  addButton: {
    height: 36,
  },
  contactCard: {
    marginTop: 8,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  contactInfo: {
    flex: 1,
    paddingRight: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  editContactButton: {
    marginLeft: 8,
    height: 40,
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
  logoutButton: {
    margin: 20,
  },
});

export default ProfileScreen; 