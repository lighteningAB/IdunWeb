package com.idun.app.ble;

import android.content.Context;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.idun.app.ble.db.BleLog;
import com.idun.app.ble.db.BleLogDao;
import com.idun.app.ble.db.BleLogDatabase;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "BleBg")
public class BleBgPlugin extends Plugin {
  private BroadcastReceiver receiver;

  @Override
  public void load() {
    super.load();
    IntentFilter filter = new IntentFilter();
    filter.addAction("com.idun.app.BLE_EVENT");
    receiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        String event = intent.getStringExtra("event");
        JSObject data = new JSObject();
        data.put("running", BleLoggingService.isRunning());
        notifyListeners(event != null ? event : "serviceStatus", data);
      }
    };
    getContext().registerReceiver(receiver, filter);
  }

  @Override
  protected void handleOnDestroy() {
    super.handleOnDestroy();
    if (receiver != null) {
      getContext().unregisterReceiver(receiver);
      receiver = null;
    }
  }

  @PluginMethod
  public void startService(PluginCall call) {
    Context context = getContext();
    Intent intent = new Intent(context, BleLoggingService.class);
    ContextCompat.startForegroundService(context, intent);
    JSObject ret = new JSObject();
    ret.put("started", true);
    call.resolve(ret);
    notifyServiceStatus();
  }

  @PluginMethod
  public void stopService(PluginCall call) {
    Context context = getContext();
    Intent intent = new Intent(context, BleLoggingService.class);
    context.stopService(intent);
    JSObject ret = new JSObject();
    ret.put("stopped", true);
    call.resolve(ret);
    notifyServiceStatus();
  }

  @PluginMethod
  public void getStatus(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("running", BleLoggingService.isRunning());
    ret.put("devices", new JSArray());
    call.resolve(ret);
  }

  @PluginMethod
  public void getLogs(PluginCall call) {
    Long since = call.getLong("sinceEpochMs", 0L);
    Integer limit = call.getInt("limit", 500);
    BleLogDao dao = BleLogDatabase.getInstance(getContext()).bleLogDao();
    List<BleLog> logs = dao.getSince(since, limit);
    JSArray arr = new JSArray();
    for (BleLog log : logs) {
      JSObject o = new JSObject();
      o.put("id", log.id);
      o.put("timestampMs", log.timestampMs);
      o.put("deviceId", log.deviceId);
      o.put("serviceUuid", log.serviceUuid);
      o.put("characteristicUuid", log.characteristicUuid);
      o.put("valueBase64", log.valueBase64);
      arr.put(o);
    }
    JSObject ret = new JSObject();
    ret.put("logs", arr);
    call.resolve(ret);
  }

  @PluginMethod
  public void clearLogs(PluginCall call) {
    BleLogDao dao = BleLogDatabase.getInstance(getContext()).bleLogDao();
    dao.clear();
    call.resolve();
  }

  private void notifyServiceStatus() {
    JSObject data = new JSObject();
    data.put("running", BleLoggingService.isRunning());
    notifyListeners("serviceStatus", data);
  }
}


