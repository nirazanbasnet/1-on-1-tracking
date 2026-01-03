'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getGravatarUrl, getInitials, getAvatarColor } from '@/lib/utils/avatar';

interface AvatarProps {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ email, fullName, avatarUrl, size = 40, className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(fullName || null, email);
  const bgColor = getAvatarColor(email);

  // Use avatarUrl if available, otherwise fall back to Gravatar
  const imageUrl = avatarUrl || getGravatarUrl(email, size * 2); // 2x for retina

  if (imageError) {
    // Fallback to initials
    return (
      <div
        className={`flex items-center justify-center rounded-full text-white font-semibold ${bgColor} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`relative rounded-full overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <Image
        src={imageUrl}
        alt={fullName || email}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ email: string; full_name?: string | null }>;
  max?: number;
  size?: number;
}

export function AvatarGroup({ users, max = 3, size = 32 }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, index) => (
        <div key={user.email} className="relative" style={{ zIndex: displayUsers.length - index }}>
          <Avatar
            email={user.email}
            fullName={user.full_name}
            size={size}
            className="ring-2 ring-white"
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold ring-2 ring-white"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
