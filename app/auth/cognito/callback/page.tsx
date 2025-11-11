"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Guardian } from "@iduntech/idun-guardian-sdk";

export default function CognitoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Get the code from the URL
        const code = searchParams.get("code");

        if (!code) {
          console.error("No authorization code provided");
          router.push("/");
          return;
        }

        // The Guardian SDK should handle the code internally
        const guardianClient = new Guardian();
        guardianClient.isRemoteDevice = true;

        // Just calling checkAuth() here should process the code
        // that's already in the URL
        const auth = await guardianClient.checkAuth();

        if (auth?.authenticated) {
          router.push("/dashboard");
        } else {
          console.error("Authentication failed");
          router.push("/");
        }
      } catch (error) {
        console.error("Error processing callback:", error);
        router.push("/");
      }
    };

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing login, please wait...</p>
    </div>
  );
}

