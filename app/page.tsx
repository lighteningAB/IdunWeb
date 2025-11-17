"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGuardian } from "@/lib/guardian";

export default function Home() {
  const [guardianClient, setGuardianClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize Guardian client on component mount
    const client = getGuardian();
    setGuardianClient(client);
  }, []);

  const handleLogin = async () => {
    if (!guardianClient) return;

    setIsLoading(true);
    try {
      const auth = await guardianClient.checkAuth();

      if (auth?.authenticated) {
        router.push("/dashboard");
      } else {
        // If not authenticated, the SDK will redirect to login page
        // The redirect URL should handle the authorization code in the query parameter
        console.log("Please complete login in the opened window...");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-3xl font-bold mb-4">
          IDUN Guardian SDK Sample App
        </h1>
        <p className="text-center max-w-md mb-8">
          This is a minimal example to get started with IDUN Guardian SDK.
        </p>

        <button
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 disabled:opacity-50"
          onClick={handleLogin}
          disabled={isLoading || !guardianClient}
        >
          {isLoading ? "Logging in..." : "Login with IDUN Guardian"}
        </button>
      </main>
    </div>
  );
}