// Ensure process.env is available in the WebView before third-party libs read it
if (typeof window !== "undefined") {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = {
    ...(((window as any).process.env as any) || {}),
    NEXT_PUBLIC_URI_SCHEME_ANDROID:
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_URI_SCHEME_ANDROID) ||
      "com.nothingtech.app",
    NEXT_PUBLIC_URI_SCHEME_IOS:
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_URI_SCHEME_IOS) ||
      "com.nothingtech.app",
    NEXT_PUBLIC_AUTH_APPID_ANDROID:
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AUTH_APPID_ANDROID) ||
      "7nd2k9flb3arolsv6gnoegphjm",
    NEXT_PUBLIC_AUTH_APPID_IOS:
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AUTH_APPID_IOS) ||
      "7nd2k9flb3arolsv6gnoegphjm",
    NEXT_PUBLIC_AUTH_APPID_WEB:
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AUTH_APPID_WEB) ||
      "7nd2k9flb3arolsv6gnoegphjm",
  };
}


