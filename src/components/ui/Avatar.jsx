import React from 'react';
import { C } from '../../styles/tokens';

/**
 * Avatar — ユーザーのアイコン。
 * avatar_url があれば画像、なければイニシャル。
 */
export default function Avatar({ name, src, size = 32 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: C.accent,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.4}px`,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {name?.[0] ?? '?'}
    </div>
  );
}
