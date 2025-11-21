"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGuardian } from "@/lib/guardian";

export default function ClientCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processAuth = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const scope = searchParams.get("scope");
        const state = searchParams.get("state");
        const logout = searchParams.get("logout");
        
        // If coming from logout: check for logout parameter OR no state parameter
        // Redirect to home immediately without any auth checks
        if (logout === "true" || (!state && !code && !error)) {
          router.replace("/");
          return;
        }
        
        // If there's an error, redirect to home
        if (error) {
          router.replace("/");
          return;
        }
        
        // If no code (but might have other params), redirect to home
        if (!code) {
          router.replace("/");
          return;
        }
        
        // We have a code, so this is a login flow
        const guardianClient = getGuardian();
        const auth = await guardianClient.checkAuth();
        if (auth?.authenticated) {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      } catch {
        router.replace("/");
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