'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { handleAuthError } from '@/utils/handleAuthError'

export default function UserPhoto() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user', {
          // Add cache: 'no-store' to prevent caching
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          if (errorData.error.includes('401')) {
            await handleAuthError();
            router.push('/auth/login');
            return;
          }
          throw new Error(errorData.error || 'Failed to fetch user data');
        }

        const data = await response.json();

        if (data.photo_urls) {
          const firstKey = Object.keys(data.photo_urls)[0];
          setPhotoUrl(data.photo_urls[firstKey]);
        }
      } catch (error) {
        console.error('Error fetching user photo:', error);
        // If there's an error that wasn't handled above, redirect to login
        router.push('/auth/login');
      }
    };

    fetchUserData();
  }, [router]);

  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-quaternary">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt="User photo"
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-quaternary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-quaternary/40 animate-pulse" />
        </div>
      )}
    </div>
  );
}
