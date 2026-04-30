import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { account } from '../appwrite';
import { findUser, DUMMY_USERS } from '../data/dummy';

/**
 * AuthContext — ログイン中のユーザー情報・ログイン/ログアウト関数を提供。
 *
 * 開発初期は Appwrite Auth が未設定でも動くよう、ダミーログインも併用。
 * Appwrite で実ユーザーを作成すれば、実ログインに切り替わる。
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 起動時に Appwrite セッションをチェック
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await account.get();
        if (!cancelled) {
          // Appwrite のユーザーを我々の profile 形式に変換（DB 連携前の暫定）
          setUser({
            id: me.$id,
            full_name: me.name || me.email,
            email: me.email,
            is_admin: me.labels?.includes('admin') ?? false,
          });
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ログイン（Appwrite Email + Password）
  const login = useCallback(async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const me = await account.get();
    setUser({
      id: me.$id,
      full_name: me.name || me.email,
      email: me.email,
      is_admin: me.labels?.includes('admin') ?? false,
    });
  }, []);

  // 開発用：ダミーログイン（Appwrite に実ユーザーを作る前に UI 確認するため）
  const loginAsDummy = useCallback((userId = 'u1') => {
    const dummy = findUser(userId) || DUMMY_USERS[0];
    setUser(dummy);
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // ダミーログイン時は Appwrite セッションがないので無視
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDummy, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
