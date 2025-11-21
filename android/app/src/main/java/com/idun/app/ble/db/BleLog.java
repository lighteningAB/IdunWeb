package com.idun.app.ble.db;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "ble_logs")
public class BleLog {
  @PrimaryKey(autoGenerate = true)
  public long id;
  public long timestampMs;
  public String deviceId;
  public String serviceUuid;
  public String characteristicUuid;
  public String valueBase64;
}


