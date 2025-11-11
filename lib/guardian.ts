'use client';

import { Guardian } from '@iduntech/idun-guardian-sdk';

let guardianInstance: Guardian | null = null;

export function getGuardian(): Guardian {
  if (!guardianInstance) {
    guardianInstance = new Guardian();
    // Ensure remote device mode for OAuth/browser handling on web
    (guardianInstance as any).isRemoteDevice = true;
  }
  return guardianInstance;
}

export type { Guardian };


