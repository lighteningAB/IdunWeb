"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Guardian } from "@iduntech/idun-guardian-sdk";
import { StreamsTypes } from "@iduntech/idun-guardian-sdk";
import { RealtimePredictions } from "@iduntech/idun-guardian-sdk";

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
  const [isPredicting, setIsPredicting] = useState(false);
  const [hasCalmPrediction, setHasCalmPrediction] = useState(false);
  const [hasFFT, setHasFFT] = useState(false);
  const [hasJawClench, setHasJawClench] = useState(false);
  const [hasHeog, setHasHeog] = useState(false);
  const [hasQualityScore, setHasQualityScore] = useState(false);
  const [lastQualityScore, setLastQualityScore] = useState<number | null>(null);
  const [lastJawClench, setLastJawClench] = useState<number | null>(null);
  const [lastHeogDirection, setLastHeogDirection] = useState<-1 | 1 | null>(null);
  const maxPoints = 200;
  const maxEegPoints = 600;
  // Ring buffers for realtime series
  const calmBufferRef = useRef<Float32Array>(new Float32Array(maxPoints));
  const calmHeadRef = useRef<number>(0);
  const calmCountRef = useRef<number>(0);
  const [calmTick, setCalmTick] = useState(false);
  const eegBufferRef = useRef<Float32Array>(new Float32Array(maxEegPoints));
  const eegHeadRef = useRef<number>(0);
  const eegCountRef = useRef<number>(0);
  const [eegTick, setEegTick] = useState(false);
  const router = useRouter();
  const hasAnyPrediction =
    hasCalmPrediction || hasFFT || hasJawClench || hasHeog || hasQualityScore;
  const showCollectingToast = isPredicting && !hasAnyPrediction;

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
      // Expecting an array of ChartData { x, y }
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const y = data[i] && typeof data[i].y === "number" ? data[i].y : null;
          if (typeof y === "number") {
            eegBufferRef.current[eegHeadRef.current] = y;
            eegHeadRef.current = (eegHeadRef.current + 1) % maxEegPoints;
            if (eegCountRef.current < maxEegPoints) eegCountRef.current += 1;
          }
        }
        setEegTick((v) => !v);
      }
    };

    const setupStream = async () => {
      try {
        // Start realtime RAW_EEG stream for direct EEG samples via websocket
        await connectedEarbuds.startRealtimeStream(StreamsTypes.RAW_EEG);
        connectedEarbuds.listenToSocketData(handleSocketData);
      } catch (error) {
        console.error("Error setting up EEG stream:", error);
      }
    };

    setupStream();

    return () => {
      connectedEarbuds.stopRealtimeStream();
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

  const onPredictionMessage = (msg: any) => {
    if (!msg?.predictionType) return;
    switch (msg.predictionType) {
      case RealtimePredictions.CALM_SCORE: {
        if (!hasCalmPrediction) setHasCalmPrediction(true);
        const value =
          msg?.result?.relaxation_index_display ??
          msg?.result?.relaxation_index ??
          null;
        if (typeof value !== "number") break;
        calmBufferRef.current[calmHeadRef.current] = value;
        calmHeadRef.current = (calmHeadRef.current + 1) % maxPoints;
        if (calmCountRef.current < maxPoints) calmCountRef.current += 1;
        setCalmTick((v) => !v);
        break;
      }
      case RealtimePredictions.QUALITY_SCORE: {
        setHasQualityScore(true);
        const qs = msg?.result?.quality_score;
        if (typeof qs === "number") setLastQualityScore(qs);
        break;
      }
      case RealtimePredictions.JAW_CLENCH: {
        setHasJawClench(true);
        const res = msg?.result?.result;
        if (typeof res === "number") setLastJawClench(res);
        break;
      }
      case RealtimePredictions.BIN_HEOG: {
        setHasHeog(true);
        const heog = msg?.result?.heog;
        if (heog === -1 || heog === 1) setLastHeogDirection(heog);
        break;
      }
      case RealtimePredictions.FFT: {
        setHasFFT(true);
        // We just mark arrival; detailed FFT rendering can be added later
        break;
      }
      default:
        break;
    }
  };

  const handleRealtimePrediction = async () => {
    if(!connectedEarbuds || !isEEGStreaming) return;

    try {
      if(!isPredicting) {
        setHasCalmPrediction(false);
        setHasFFT(false);
        setHasJawClench(false);
        setHasHeog(false);
        setHasQualityScore(false);
        setLastQualityScore(null);
        setLastJawClench(null);
        setLastHeogDirection(null);
        await connectedEarbuds.subscribeRealtimePredictions(
          [
            RealtimePredictions.CALM_SCORE,
            RealtimePredictions.QUALITY_SCORE,
            RealtimePredictions.JAW_CLENCH,
            RealtimePredictions.BIN_HEOG,
            RealtimePredictions.FFT,
          ],
          onPredictionMessage
        );
        setIsPredicting(true);
      } else {
        await connectedEarbuds.unsubscribeRealtimePredictions();
        setIsPredicting(false);
        setHasCalmPrediction(false);
        setHasFFT(false);
        setHasJawClench(false);
        setHasHeog(false);
        setHasQualityScore(false);
        setLastQualityScore(null);
        setLastJawClench(null);
        setLastHeogDirection(null);
      }
    } catch (error) {
      console.error(
        `Failed to ${isPredicting ? "stop" : "start"} realtime prediction:`,
        error,
      );
    }

  }

  // Snapshots for rendering from ring buffers
  const calmSnapshot = useMemo(() => {
    const count = calmCountRef.current;
    if (count === 0) return [];
    const out = new Array<number>(count);
    const head = calmHeadRef.current;
    for (let i = 0; i < count; i++) {
      const idx = (head - count + i + maxPoints) % maxPoints;
      out[i] = calmBufferRef.current[idx];
    }
    return out;
  }, [calmTick]);

  const eegSnapshot = useMemo(() => {
    const count = eegCountRef.current;
    if (count === 0) return [];
    const out = new Array<number>(count);
    const head = eegHeadRef.current;
    for (let i = 0; i < count; i++) {
      const idx = (head - count + i + maxEegPoints) % maxEegPoints;
      out[i] = eegBufferRef.current[idx];
    }
    return out;
  }, [eegTick]);

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
              {isEEGStreaming && (
                <button
                  className="bg-green-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  onClick={handleRealtimePrediction}
                >
                  {isPredicting ? "Stop Realtime Prediction" : "Start Realtime Prediction"}
                </button>
                )
              }
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
      {/* Realtime Predictions Overview */}
      <div className="mt-6 w-full max-w-3xl p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-3">Realtime Predictions Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">Calm Score</span>
              <span className={`h-2.5 w-2.5 rounded-full ${hasCalmPrediction ? "bg-emerald-500" : "bg-gray-300"}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {hasCalmPrediction
                ? `Latest: ${calmSnapshot.length ? calmSnapshot[calmSnapshot.length - 1].toFixed(1) : "—"}`
                : "Waiting…"}
            </div>
          </div>
          <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">Quality Score</span>
              <span className={`h-2.5 w-2.5 rounded-full ${hasQualityScore ? "bg-emerald-500" : "bg-gray-300"}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {hasQualityScore
                ? `Latest: ${lastQualityScore ?? "—"}`
                : "Waiting…"}
            </div>
          </div>
          <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">Jaw Clench</span>
              <span className={`h-2.5 w-2.5 rounded-full ${hasJawClench ? "bg-emerald-500" : "bg-gray-300"}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {hasJawClench
                ? `Latest: ${lastJawClench ?? "—"}`
                : "Waiting…"}
            </div>
          </div>
          <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">Eye Movement (HEOG)</span>
              <span className={`h-2.5 w-2.5 rounded-full ${hasHeog ? "bg-emerald-500" : "bg-gray-300"}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {hasHeog
                ? `Latest: ${lastHeogDirection === -1 ? "LEFT" : lastHeogDirection === 1 ? "RIGHT" : "—"}`
                : "Waiting…"}
            </div>
          </div>
          <div className="p-3 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">FFT</span>
              <span className={`h-2.5 w-2.5 rounded-full ${hasFFT ? "bg-emerald-500" : "bg-gray-300"}`} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {hasFFT ? "Receiving…" : "Waiting…"}
            </div>
          </div>
        </div>
      </div>
      {calmSnapshot.length > 0 && (
        <div className="mt-6 w-full max-w-3xl p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Calm Score (Realtime)</h3>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Latest: {calmSnapshot[calmSnapshot.length - 1].toFixed(1)}
            </span>
          </div>
          <div className="w-full h-32">
            <svg
              viewBox={`0 0 ${maxPoints - 1} 100`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <g stroke="#e5e7eb" strokeWidth="0.5">
                <line x1="0" y1="0" x2={maxPoints - 1} y2="0" />
                <line x1="0" y1="25" x2={maxPoints - 1} y2="25" />
                <line x1="0" y1="50" x2={maxPoints - 1} y2="50" />
                <line x1="0" y1="75" x2={maxPoints - 1} y2="75" />
                <line x1="0" y1="100" x2={maxPoints - 1} y2="100" />
              </g>
              <g fill="#6b7280" fontSize="8">
                <text x="2" y="8">100</text>
                <text x="2" y="33">75</text>
                <text x="2" y="58">50</text>
                <text x="2" y="83">25</text>
                <text x="2" y="98">0</text>
              </g>
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={
                  calmSnapshot
                    .map((v, i) => {
                      const x =
                        calmSnapshot.length > 1
                          ? (i * (maxPoints - 1)) / (calmSnapshot.length - 1)
                          : 0;
                      const clamped = Math.max(0, Math.min(100, v));
                      const y = 100 - clamped;
                      return `${x},${y}`;
                    })
                    .join(" ")
                }
              />
            </svg>
          </div>
        </div>
      )}
      {eegSnapshot.length > 0 && (
        <div className="mt-6 w-full max-w-3xl p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Raw EEG (Realtime)</h3>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Latest: {eegSnapshot[eegSnapshot.length - 1].toFixed(0)}
            </span>
          </div>
          <div className="w-full h-32">
            <svg
              viewBox={`0 0 ${maxEegPoints - 1} 100`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <g stroke="#e5e7eb" strokeWidth="0.5">
                <line x1="0" y1="0" x2={maxEegPoints - 1} y2="0" />
                <line x1="0" y1="25" x2={maxEegPoints - 1} y2="25" />
                <line x1="0" y1="50" x2={maxEegPoints - 1} y2="50" />
                <line x1="0" y1="75" x2={maxEegPoints - 1} y2="75" />
                <line x1="0" y1="100" x2={maxEegPoints - 1} y2="100" />
              </g>
              {(() => {
                const min = Math.min(...eegSnapshot);
                const max = Math.max(...eegSnapshot);
                const span = max - min || 1;
                const points = eegSnapshot
                  .map((v, i) => {
                    const x =
                      eegSnapshot.length > 1
                        ? (i * (maxEegPoints - 1)) / (eegSnapshot.length - 1)
                        : 0;
                    const norm = ((v - min) / span) * 100;
                    const y = 100 - norm;
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    points={points}
                  />
                );
              })()}
            </svg>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
            Auto-scaled to current window (min/max).
          </div>
        </div>
      )}
      {showCollectingToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-md bg-slate-900 text-white px-4 py-3 shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>Collecting data for prediction…</span>
          </div>
        </div>
      )}
    </div>
  );
}