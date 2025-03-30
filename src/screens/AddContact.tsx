import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { databaseService } from '../services/database';
import { ErrorHandler } from '../utils/ErrorHandler';
import Toast from 'react-native-toast-message';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddContact'>;
type AddContactScreenRouteProp = RouteProp<RootStackParamList, 'AddContact'>;

const AddContact = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddContactScreenRouteProp>();
  const { contact, isEditing, onSave } = route.params || {};

  const [name, setName] = useState(contact?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(contact?.phoneNumber || '');
  const [relation, setRelation] = useState(contact?.relation || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !phoneNumber || !relation) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all fields'
      });
      return;
    }

    setSaving(true);
    try {
      if (isEditing && contact?.id) {
        await databaseService.updateEmergencyContact(contact.id, {
          name,
          phoneNumber,
          relation
        });
      } else {
        await databaseService.addEmergencyContact({
          name,
          phoneNumber,
          relation
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Contact Saved',
        text2: `${name} has been ${isEditing ? 'updated' : 'added'} as an emergency contact`
      });

      if (onSave) {
        await onSave();
      }
      navigation.goBack();
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
            dense
          />
          <TextInput
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            mode="outlined"
            dense
            keyboardType="phone-pad"
          />
          <TextInput
            label="Relation"
            value={relation}
            onChangeText={setRelation}
            style={[styles.input, styles.lastInput]}
            mode="outlined"
            dense
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        >
          {saving ? 'Saving...' : isEditing ? 'Update Contact' : 'Add Contact'}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  buttonContainer: {
    padding: 12,
    gap: 8,
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    borderColor: colors.border,
  },
});

export default AddContact; 