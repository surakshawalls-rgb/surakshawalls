package io.suraksha.report;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private int tokenRetryCount = 0;
    private static final int MAX_RETRIES = 5;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.e("SURAKSHA", "========================================");
        Log.e("SURAKSHA", "MainActivity onCreate() started");
        Log.e("SURAKSHA", "========================================");
        
        // Create notification channels for instant push (like GPay, Swiggy)
        createNotificationChannels();
        
        // Check Google Play Services availability
        GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
        int resultCode = apiAvailability.isGooglePlayServicesAvailable(this);
        if (resultCode != ConnectionResult.SUCCESS) {
            Log.e("SURAKSHA", "❌ Google Play Services not available. Error code: " + resultCode);
            return;
        }
        Log.e("SURAKSHA", "✅ Google Play Services available - code: " + resultCode);
        
        // Firebase is auto-initialized by FirebaseInitProvider
        // Token retrieval will be handled by Capacitor PushNotifications plugin
        Log.e("SURAKSHA", "✅ MainActivity onCreate complete - Firebase initialized");
        Log.e("SURAKSHA", "✅ Token retrieval will be handled by Capacitor PushNotifications plugin");
    }
    
    /**
     * Create high-priority notification channels
     * Required for instant push notifications (Android 8.0+)
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            
            // HIGH PRIORITY CHANNEL - for payments, registrations, urgent alerts
            NotificationChannel highChannel = new NotificationChannel(
                "suraksha_high_priority",
                "Important Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            highChannel.setDescription("Library payments, registrations, urgent alerts");
            highChannel.enableVibration(true);
            highChannel.enableLights(true);
            highChannel.setShowBadge(true);
            highChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(highChannel);
            
            // DEFAULT CHANNEL - for general notifications
            NotificationChannel defaultChannel = new NotificationChannel(
                "suraksha_default",
                "General Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("General updates and information");
            defaultChannel.enableVibration(true);
            defaultChannel.setShowBadge(true);
            notificationManager.createNotificationChannel(defaultChannel);
            
            Log.d(TAG, "✅ Notification channels created (high priority + default)");
        }
    }
    
    private void attemptGetToken() {
        tokenRetryCount++;
        Log.e("SURAKSHA", "📱 Attempt " + tokenRetryCount + "/" + MAX_RETRIES + " - Getting FCM token...");
        
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    String token = task.getResult();
                    if (!token.isEmpty()) {
                        Log.e("SURAKSHA", "🔥🔥🔥 FCM TOKEN RECEIVED! 🔥🔥🔥");
                        Log.e("SURAKSHA", "🔥 Token: " + token);
                        Log.e("SURAKSHA", "🔥 Token length: " + token.length());
                        Log.e("SURAKSHA", "🔥🔥🔥 SUCCESS! 🔥🔥🔥");
                    } else {
                        Log.e("SURAKSHA", "❌ Token is empty");
                        retryGetToken();
                    }
                } else {
                    Exception exception = task.getException();
                    Log.e("SURAKSHA", "❌ Failed to get FCM token (attempt " + tokenRetryCount + ")", exception);
                    if (exception != null) {
                        Log.e("SURAKSHA", "❌ Exception: " + exception.getClass().getName() + ": " + exception.getMessage());
                    }
                    retryGetToken();
                }
            });
    }
    
    private void retryGetToken() {
        if (tokenRetryCount < MAX_RETRIES) {
            int delayMs = tokenRetryCount * 10000; // 10s, 20s, 30s, 40s, 50s
            Log.e("SURAKSHA", "🔄 Will retry in " + (delayMs/1000) + " seconds...");
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                attemptGetToken();
            }, delayMs);
        } else {
            Log.e("SURAKSHA", "❌ Failed to get FCM token after " + MAX_RETRIES + " attempts");
            Log.e("SURAKSHA", "❌ Check: 1) Google Play Services   2) Firebase Console FCM enabled   3) SHA-1 fingerprint added");
        }
    }
}
