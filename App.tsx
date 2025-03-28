/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ActivityIndicator, View } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import LocationScreen from './src/screens/LocationScreen';
import VoiceAnalysisScreen from './src/screens/VoiceAnalysisScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type RootStackParamList = {
  MainApp: undefined;
  Profile: undefined;
};

type TabParamList = {
  Home: undefined;
  Chatbot: undefined;
  Location: undefined;
  Voice: undefined;
};

type TabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList>,
  StackScreenProps<RootStackParamList>
>;

function TabNavigator() {
  const navigation = useNavigation<TabScreenProps['navigation']>();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Chatbot':
              iconName = 'chat';
              break;
            case 'Location':
              iconName = 'location-on';
              break;
            case 'Voice':
              iconName = 'mic';
              break;
            default:
              iconName = 'error';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerRight: () => (
            <Icon 
              name="person" 
              size={24} 
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate('Profile')}
            />
          ),
        }}
      />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
      <Tab.Screen name="Voice" component={VoiceAnalysisScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Handle user state changes
  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#e91e63" />
    </View>
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {!user ? (
            // Auth screens
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Signup" 
                component={SignupScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            // App screens
            <>
              <Stack.Screen
                name="MainApp"
                component={TabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
