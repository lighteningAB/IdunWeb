package com.idun.app.ble.db;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

@Database(entities = {BleLog.class}, version = 1, exportSchema = false)
public abstract class BleLogDatabase extends RoomDatabase {
  private static volatile BleLogDatabase INSTANCE;

  public abstract BleLogDao bleLogDao();

  public static BleLogDatabase getInstance(Context context) {
    if (INSTANCE == null) {
      synchronized (BleLogDatabase.class) {
        if (INSTANCE == null) {
          INSTANCE = Room.databaseBuilder(
                  context.getApplicationContext(),
                  BleLogDatabase.class,
                  "ble_logs.db"
              )
              .allowMainThreadQueries()
              .fallbackToDestructiveMigration()
              .build();
        }
      }
    }
    return INSTANCE;
  }
}


