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
        if (!code) {
          router.push("/");
          return;
        }
        const guardianClient = getGuardian();
        const auth = await guardianClient.checkAuth();
        if (auth?.authenticated) {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      } catch {
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


