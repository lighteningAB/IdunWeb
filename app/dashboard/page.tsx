"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Guardian } from "@iduntech/idun-guardian-sdk";
import { StreamsTypes } from "@iduntech/idun-guardian-sdk";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [guardianClient, setGuardianClient] = useState<Guardian | null>(null);
  const [connectedEarbuds, setConnectedEarbuds] = useState<any>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(
    undefined,
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isEEGStreaming, setIsEEGStreaming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // Initialize Guardian client
        const client = new Guardian();
        client.isRemoteDevice = true;
        setGuardianClient(client);

        // Verify with SDK
        const authStatus = await client.checkAuth();
        if (!authStatus?.authenticated) {
          router.push("/");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isEEGStreaming || !connectedEarbuds) return;

    const handleSocketData = (data: any) => {
      console.log("EEG Data received:", data);
    };

    const setupStream = async () => {
      try {
        // StreamsTypes.RAW_EEG is also an option if you need unfiltered data
        // Handles subscription to the socket data
        await connectedEarbuds.startRealtimeStream(StreamsTypes.FILTERED_EEG);

        // Handles the data received from the socket
        connectedEarbuds.listenToSocketData(handleSocketData);
        console.log("EEG stream setup complete");
      } catch (error) {
        console.error("Error setting up EEG stream:", error);
      }
    };

    setupStream();

    return () => {
      connectedEarbuds.stopRealtimeStream();
      console.log("EEG stream stopped");
    };
  }, [isEEGStreaming, connectedEarbuds]);

  const handleLogout = async () => {
    try {
      if (guardianClient) {
        await guardianClient.logout();
        // No need for router.push as the SDK will redirect
      }
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  const handleConnectDevice = async () => {
    if (!guardianClient) return;

    setIsConnecting(true);
    try {
      const earbuds = await guardianClient.connectEarbuds();
      setConnectedEarbuds(earbuds);

      // Get battery level if connected
      if (earbuds) {
        const level = await earbuds.getBatteryLevel();
        setBatteryLevel(level);
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      setConnectedEarbuds(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectDevice = async () => {
    if (!connectedEarbuds) return;

    setIsDisconnecting(true);
    try {
      await connectedEarbuds.disconnect();
      setConnectedEarbuds(null);
      setBatteryLevel(undefined);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleEEGStream = async () => {
    if (!connectedEarbuds) return;

    try {
      if (!isEEGStreaming) {
        // When Starting EEG Stream, a recording is created behind the scenes
        await connectedEarbuds.startEEGStream();
        setIsEEGStreaming(true);
      } else {
        // When Stopping EEG Stream, the recording is stopped
        await connectedEarbuds.stopEEGStream();
        setIsEEGStreaming(false);
      }
    } catch (error) {
      console.error(
        `Failed to ${isEEGStreaming ? "stop" : "start"} EEG stream:`,
        error,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Successfully Logged In!</h2>
        <p className="mb-4">
          You are now connected to your IDUN Guardian account.
        </p>

        <div className="flex flex-col gap-4 mt-6">
          {!connectedEarbuds ? (
            <button
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              onClick={handleConnectDevice}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect Device"}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-green-50 dark:bg-green-800 rounded-md">
                <p className="font-medium">Device Connected!</p>
                {batteryLevel !== undefined && (
                  <p className="text-sm mt-1">Battery Level: {batteryLevel}%</p>
                )}
              </div>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                onClick={handleEEGStream}
              >
                {isEEGStreaming ? "Stop EEG Stream" : "Start EEG Stream"}
              </button>
              <button
                className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                onClick={handleDisconnectDevice}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect Device"}
              </button>
            </div>
          )}

          <button
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}