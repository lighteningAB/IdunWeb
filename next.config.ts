import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@iduntech/idun-guardian-sdk", "@byteowls/capacitor-oauth2"],
  env: {
    NEXT_PUBLIC_URI_SCHEME_ANDROID:
      process.env.NEXT_PUBLIC_URI_SCHEME_ANDROID ?? "com.nothingtech.app",
    NEXT_PUBLIC_URI_SCHEME_IOS:
      process.env.NEXT_PUBLIC_URI_SCHEME_IOS ?? "com.nothingtech.app",
    NEXT_PUBLIC_AUTH_APPID_ANDROID:
      process.env.NEXT_PUBLIC_AUTH_APPID_ANDROID ?? "7nd2k9flb3arolsv6gnoegphjm",
    NEXT_PUBLIC_AUTH_APPID_IOS:
      process.env.NEXT_PUBLIC_AUTH_APPID_IOS ?? "7nd2k9flb3arolsv6gnoegphjm",
    NEXT_PUBLIC_AUTH_APPID_WEB:
      process.env.NEXT_PUBLIC_AUTH_APPID_WEB ?? "7nd2k9flb3arolsv6gnoegphjm",
  }
};

export default nextConfig;
