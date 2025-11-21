import { Capacitor } from "@capacitor/core";
import {
  BluetoothLe,
  type RequestBleDeviceOptions,
  type ReadOptions,
  type WriteOptions,
} from "@capacitor-community/bluetooth-le";

export const isNative = () => Capacitor.isNativePlatform();

export async function initializeBle() {
  if (!isNative()) return;
  await BluetoothLe.initialize({ androidNeverForLocation: true });
}

export async function ensureBluetoothEnabled() {
  if (!isNative()) return;
  const { value } = await BluetoothLe.isEnabled();
  if (!value) {
    await BluetoothLe.requestEnable();
  }
}

export async function requestDevice(options?: RequestBleDeviceOptions) {
  if (!isNative()) return undefined;
  return BluetoothLe.requestDevice(options);
}

export async function startScan(options?: RequestBleDeviceOptions) {
  if (!isNative()) return;
  await BluetoothLe.requestLEScan(options);
}

export async function stopScan() {
  if (!isNative()) return;
  await BluetoothLe.stopLEScan();
}

export async function connect(deviceId: string) {
  if (!isNative()) return;
  await BluetoothLe.connect({ deviceId });
}

export async function startNotifications(opts: ReadOptions, cb: (value?: DataView | string) => void) {
  if (!isNative()) return { remove: () => {} };
  const handle = await BluetoothLe.addListener("notification", (event) => {
    if (
      "characteristic" in event &&
      "service" in event &&
      event.characteristic === opts.characteristic &&
      event.service === opts.service
    ) {
      cb(event.value);
    }
  });
  await BluetoothLe.startNotifications(opts);
  return handle;
}

export async function write(opts: WriteOptions) {
  if (!isNative()) return;
  await BluetoothLe.write(opts);
}


