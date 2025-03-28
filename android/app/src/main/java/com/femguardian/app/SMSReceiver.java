package com.femguardian.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSReceiver";
    private static final String SMS_RECEIVED = "SMS_RECEIVED";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                try {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    if (pdus != null) {
                        for (Object pdu : pdus) {
                            SmsMessage message = SmsMessage.createFromPdu((byte[]) pdu);
                            String sender = message.getOriginatingAddress();
                            String messageBody = message.getMessageBody();

                            // Create event data
                            WritableMap eventData = Arguments.createMap();
                            eventData.putString("sender", sender);
                            eventData.putString("message", messageBody);

                            // Send event to React Native
                            ReactContext reactContext = ((MainApplication) context.getApplicationContext()).getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
                            if (reactContext != null) {
                                reactContext
                                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit(SMS_RECEIVED, eventData);
                            }

                            Log.d(TAG, "SMS from: " + sender);
                            Log.d(TAG, "Message: " + messageBody);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error processing SMS", e);
                }
            }
        }
    }
} 