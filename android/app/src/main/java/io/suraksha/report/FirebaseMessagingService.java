package io.suraksha.report;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Custom Firebase Messaging Service for handling push notifications
 * Provides instant delivery like Swiggy, Zomato, GPay, PhonePe
 */
public class FirebaseMessagingService extends com.google.firebase.messaging.FirebaseMessagingService {
    
    private static final String TAG = "SurakFCMService";
    private static final String HIGH_PRIORITY_CHANNEL = "suraksha_high_priority";
    private static final String DEFAULT_CHANNEL = "suraksha_default";
    
    /**
     * Called when a message is received from FCM
     * This runs even when app is closed or in background
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "⚡ FCM Message received from: " + remoteMessage.getFrom());
        
        // Handle data payload (always received, even in background)
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "📦 Data payload: " + remoteMessage.getData().toString());
            
            // Extract custom data
            String type = remoteMessage.getData().get("type");
            String route = remoteMessage.getData().get("route");
            String timestamp = remoteMessage.getData().get("timestamp");
            
            Log.d(TAG, "📍 Type: " + type + ", Route: " + route + ", Time: " + timestamp);
            
            // Process data (e.g., update local database, trigger background sync)
            handleDataMessage(remoteMessage.getData());
        }
        
        // Handle notification payload (only when app is in foreground)
        // For background, FCM automatically displays the notification
        if (remoteMessage.getNotification() != null) {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            
            Log.d(TAG, "🔔 Notification: " + title + " - " + body);
            
            // Show custom notification with high priority
            sendNotification(title, body, remoteMessage.getData());
        }
    }
    
    /**
     * Called when FCM registration token is updated
     * This happens when app is first installed or token changes
     */
    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "🔄 New FCM token generated: " + token);
        
        // Send token to your backend (Capacitor plugin handles this)
        // But you can also manually send it here for redundancy
        sendTokenToServer(token);
    }
    
    /**
     * Handle data-only messages for background processing
     */
    private void handleDataMessage(Map<String, String> data) {
        String type = data.get("type");
        
        if (type == null) return;
        
        switch (type) {
            case "payment":
                Log.d(TAG, "💰 Processing payment notification");
                // Update payment cache, trigger sync, etc.
                break;
            case "registration":
                Log.d(TAG, "👨‍🎓 Processing registration notification");
                // Update student cache
                break;
            case "expense":
                Log.d(TAG, "💸 Processing expense notification");
                // Update expense cache
                break;
            case "urgent":
                Log.d(TAG, "🚨 Processing urgent notification");
                // Handle urgent notification with special logic
                break;
            default:
                Log.d(TAG, "📬 Processing general notification");
                break;
        }
    }
    
    /**
     * Send FCM token to your backend
     */
    private void sendTokenToServer(String token) {
        // This is optional - Capacitor plugin handles token registration
        // But you can add custom logic here if needed
        Log.d(TAG, "📤 Token sent to server: " + token.substring(0, 20) + "...");
    }
    
    /**
     * Create and show a notification with high priority
     * Works exactly like GPay, Swiggy, PhonePe notifications
     */
    private void sendNotification(String title, String messageBody, Map<String, String> data) {
        // Create intent to open app when notification is tapped
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        // Add all custom data to intent for navigation
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }
        
        // Create pending intent
        int flags = PendingIntent.FLAG_ONE_SHOT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            (int) System.currentTimeMillis(), // Unique ID for each notification
            intent,
            flags
        );
        
        // Determine notification priority based on type
        String channelId = HIGH_PRIORITY_CHANNEL;
        int priority = NotificationCompat.PRIORITY_MAX;
        
        String type = data != null ? data.get("type") : "info";
        if ("info".equals(type) || "success".equals(type)) {
            channelId = DEFAULT_CHANNEL;
            priority = NotificationCompat.PRIORITY_DEFAULT;
        }
        
        // Get default notification sound
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        
        // Build notification
        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.mipmap.ic_launcher) // App icon
                .setContentTitle(title)
                .setContentText(messageBody)
                .setAutoCancel(true) // Dismiss when tapped
                .setSound(defaultSoundUri)
                .setPriority(priority) // Max priority for instant delivery
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // Show on lock screen
                .setContentIntent(pendingIntent)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody)); // Expandable
        
        // Add custom color (optional - use your brand color)
        // notificationBuilder.setColor(ContextCompat.getColor(this, R.color.primary));
        
        // Add vibration pattern (optional - like GPay)
        if (priority == NotificationCompat.PRIORITY_MAX) {
            long[] vibrationPattern = {0, 250, 250, 250}; // Wait 0ms, vibrate 250ms, wait 250ms, vibrate 250ms
            notificationBuilder.setVibrate(vibrationPattern);
        }
        
        // Show notification
        NotificationManager notificationManager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        // Create notification channel for Android 8.0+
        createNotificationChannel(notificationManager);
        
        // Notify with unique ID to allow multiple notifications
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, notificationBuilder.build());
        
        Log.d(TAG, "✅ Notification shown with ID: " + notificationId);
    }
    
    /**
     * Create notification channels for Android 8.0+
     * Required for showing notifications on modern Android
     */
    private void createNotificationChannel(NotificationManager notificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // High priority channel (for payments, urgent alerts)
            NotificationChannel highChannel = notificationManager.getNotificationChannel(HIGH_PRIORITY_CHANNEL);
            if (highChannel == null) {
                highChannel = new NotificationChannel(
                    HIGH_PRIORITY_CHANNEL,
                    "Important Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                );
                highChannel.setDescription("Library payments, registrations, urgent alerts");
                highChannel.enableVibration(true);
                highChannel.enableLights(true);
                highChannel.setShowBadge(true);
                highChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(highChannel);
                Log.d(TAG, "✅ High priority notification channel created");
            }
            
            // Default channel (for general notifications)
            NotificationChannel defaultChannel = notificationManager.getNotificationChannel(DEFAULT_CHANNEL);
            if (defaultChannel == null) {
                defaultChannel = new NotificationChannel(
                    DEFAULT_CHANNEL,
                    "General Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
                );
                defaultChannel.setDescription("General updates and information");
                defaultChannel.enableVibration(true);
                defaultChannel.setShowBadge(true);
                notificationManager.createNotificationChannel(defaultChannel);
                Log.d(TAG, "✅ Default notification channel created");
            }
        }
    }
}
