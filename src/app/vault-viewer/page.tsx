'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VaultViewerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/wiki');
  }, [router]);
  return null;
}
