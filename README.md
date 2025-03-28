# FemGuardian - Women's Safety App

FemGuardian is a React Native mobile application designed to enhance women's safety in urban environments. The app provides various features including emergency SOS, location tracking, voice threat analysis, and an AI-powered safety chatbot.

## Features

1. **Emergency SOS**
   - Quick access SOS button
   - Sends alerts to emergency contacts
   - Shares current location with authorities
   - Integrates with local emergency services

2. **Location Services**
   - Real-time location tracking
   - Route deviation detection
   - Safe route recommendations
   - Location history for trusted contacts

3. **Voice Threat Analysis**
   - Real-time audio analysis
   - Threat detection in voice recordings
   - Automatic SOS triggering on threat detection
   - Audio evidence recording

4. **AI Safety Chatbot**
   - 24/7 safety assistance
   - Emergency helpline information
   - Safety tips and guidelines
   - Local safety resource recommendations

## Prerequisites

- Node.js >= 14
- React Native development environment setup
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase account
- Google Maps API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/FemGuardian.git
   cd FemGuardian
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a new Firebase project
   - Add Android and iOS apps in Firebase console
   - Download and add the configuration files:
     - Android: `google-services.json` to `android/app/`
     - iOS: `GoogleService-Info.plist` to your Xcode project
   - Update Firebase config in `src/config/firebase.ts`

4. Configure Google Sign-In:
   - Create OAuth 2.0 client IDs in Google Cloud Console
   - Add the web client ID to `src/config/firebase.ts`

5. Add Google Maps API key:
   - Get an API key from Google Cloud Console
   - Add it to:
     - Android: `android/app/src/main/AndroidManifest.xml`
     - iOS: `ios/FemGuardian/AppDelegate.m`

## Running the App

### Android
```bash
npx react-native run-android
```

### iOS
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## API Endpoints

The app uses the following API endpoints:

1. Chatbot API:
   ```
   POST https://speech-threat-chatbot-api.onrender.com/chatbot
   Content-Type: application/json
   Body: { "text": "your_query" }
   ```

2. Voice Analysis API:
   ```
   POST https://speech-threat-chatbot-api.onrender.com/analyze-audio
   Content-Type: multipart/form-data
   Body: Form data with audio file
   ```

3. Location Deviation API:
   ```
   POST https://deploy-tracking-model.onrender.com/check-deviation
   Content-Type: application/json
   Body: { "latitude": number, "longitude": number }
   ```

4. Emergency Alert API:
   ```
   POST http://localhost:3000/api/send-emergency-alert
   Content-Type: application/json
   Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
   Body: { "message": "Emergency message" }
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React Native Community
- Firebase
- Google Maps Platform
- AI Model Providers
- Emergency Services Integration Partners
