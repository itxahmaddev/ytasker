import { useState } from 'react';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function Avatar({ user, size = 40 }) {
  const [broken, setBroken] = useState(false);
  const showImage = user?.avatar && !broken;
  return (
    <span className="avatar" style={{ '--size': `${size}px` }} aria-hidden="true">
      {showImage ? (
        <img
          src={user.avatar}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
}
