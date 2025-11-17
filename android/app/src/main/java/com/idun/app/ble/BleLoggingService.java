package com.idun.app.ble;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

import com.idun.app.MainActivity;
import com.idun.app.R;

public class BleLoggingService extends Service {
  public static final String CHANNEL_ID = "ble_logging";
  public static final int NOTIFICATION_ID = 10101;
  private static volatile boolean running = false;

  public static boolean isRunning() {
    return running;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    createNotificationChannel();
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    running = true;
    Notification notification = buildNotification();
    startForeground(NOTIFICATION_ID, notification);
    broadcast("serviceStatus");
    return START_STICKY;
  }

  @Override
  public void onDestroy() {
    running = false;
    stopForeground(true);
    broadcast("serviceStatus");
    super.onDestroy();
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private Notification buildNotification() {
    Intent notificationIntent = new Intent(this, MainActivity.class);
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      flags |= PendingIntent.FLAG_IMMUTABLE;
    }
    PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, flags);
    return new NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("BLE Logging active")
        .setContentText("Collecting data in background")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentIntent(pendingIntent)
        .setOngoing(true)
        .build();
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel serviceChannel = new NotificationChannel(
          CHANNEL_ID,
          "BLE Logging",
          NotificationManager.IMPORTANCE_LOW
      );
      NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
      if (manager != null) {
        manager.createNotificationChannel(serviceChannel);
      }
    }
  }

  private void broadcast(String event) {
    Intent i = new Intent("com.idun.app.BLE_EVENT");
    i.putExtra("event", event);
    sendBroadcast(i);
  }
}


