import { Capacitor, registerPlugin } from "@capacitor/core";

export type BleBgPlugin = {
  startService(options: { deviceId?: string; characteristics?: string[]; sampleRateHz?: number }): Promise<void>;
  stopService(): Promise<void>;
  getStatus(): Promise<{ running: boolean; devices: string[] }>;
  getLogs(options?: { sinceEpochMs?: number; limit?: number }): Promise<{ logs: any[] }>;
  clearLogs(): Promise<void>;
  addListener(
    event: "bleData" | "serviceStatus" | "connectionState" | "error",
    cb: (data: any) => void
  ): Promise<{ remove: () => void }>;
};

export const BleBg: BleBgPlugin = Capacitor.isNativePlatform()
  ? registerPlugin<BleBgPlugin>("BleBg")
  : ({
      startService: async () => {},
      stopService: async () => {},
      getStatus: async () => ({ running: false, devices: [] }),
      getLogs: async () => ({ logs: [] }),
      clearLogs: async () => {},
      addListener: async (_e: any, _cb: any) => ({ remove: () => {} }),
    } as unknown as BleBgPlugin);


