import { Suspense } from "react";
import ClientCallback from "./ClientCallback";

function Fallback() {
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing login, please wait...</p>
    </div>
  );
}

export default function CognitoCallbackPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ClientCallback />
    </Suspense>
  );
}

