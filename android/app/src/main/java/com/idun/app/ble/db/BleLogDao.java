package com.idun.app.ble.db;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

@Dao
public interface BleLogDao {
  @Insert
  void insertAll(List<BleLog> logs);

  @Query("SELECT * FROM ble_logs WHERE timestampMs >= :since ORDER BY timestampMs ASC LIMIT :limit")
  List<BleLog> getSince(long since, int limit);

  @Query("DELETE FROM ble_logs")
  void clear();
}


