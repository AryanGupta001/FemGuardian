export interface EmergencyContact {
  id?: string;
  name: string;
  phoneNumber: string;
  relation: string;
}

export type RootStackParamList = {
  Home: { triggerSOS?: boolean };
  VoiceAnalysis: undefined;
  Profile: undefined;
  EmergencyContacts: undefined;
  Settings: undefined;
  AddContact: {
    contact?: EmergencyContact;
    isEditing?: boolean;
    onSave?: () => Promise<void>;
  };
}; 