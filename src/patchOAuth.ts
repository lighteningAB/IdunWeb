// Monkey-patch OAuth2Client to force correct redirect URLs on Android/iOS
import { OAuth2Client } from "@byteowls/capacitor-oauth2";

const ANDROID_SCHEME =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_URI_SCHEME_ANDROID) ||
  "com.nothingtech.app";
const IOS_SCHEME =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_URI_SCHEME_IOS) ||
  "com.nothingtech.app";

try {
  const anyOAuth = OAuth2Client as any;
  if (!anyOAuth.__patchedRedirectFix && typeof anyOAuth.authenticate === "function") {
    const originalAuth = anyOAuth.authenticate.bind(anyOAuth);
    anyOAuth.authenticate = async (options: any) => {
      options = options || {};
      options.android = options.android || {};
      options.ios = options.ios || {};
      options.android.redirectUrl = `${ANDROID_SCHEME}://auth/cognito/callback`;
      options.android.logoutRedirectUrl = `${ANDROID_SCHEME}://logout`;
      options.ios.redirectUrl = `${IOS_SCHEME}://auth/cognito/callback`;
      options.ios.logoutRedirectUrl = `${IOS_SCHEME}://logout`;
      return originalAuth(options);
    };
    anyOAuth.__patchedRedirectFix = true;
  }
} catch {
  // ignore
}

// Also patch the runtime Capacitor plugin (in case the SDK holds that reference)
function patchWindowPlugin() {
  const w = window as any;
  const cap = w?.Capacitor || w?.CapacitorWeb || w?.capacitor;
  const plugins = cap?.Plugins;
  const oauth = plugins?.OAuth2Client;
  if (!oauth || typeof oauth.authenticate !== "function") return false;
  if ((oauth as any).__patchedRedirectFix) return true;
  const originalAuth = oauth.authenticate.bind(oauth);
  oauth.authenticate = async (options: any) => {
    options = options || {};
    options.android = options.android || {};
    options.ios = options.ios || {};
    options.android.redirectUrl = `${ANDROID_SCHEME}://auth/cognito/callback`;
    options.android.logoutRedirectUrl = `${ANDROID_SCHEME}://logout`;
    options.ios.redirectUrl = `${IOS_SCHEME}://auth/cognito/callback`;
    options.ios.logoutRedirectUrl = `${IOS_SCHEME}://logout`;
    return originalAuth(options);
  };
  (oauth as any).__patchedRedirectFix = true;
  return true;
}

if (typeof window !== "undefined") {
  if (!patchWindowPlugin()) {
    const interval = setInterval(() => {
      if (patchWindowPlugin()) clearInterval(interval);
    }, 100);
    setTimeout(() => clearInterval(interval), 10000);
  }
}


