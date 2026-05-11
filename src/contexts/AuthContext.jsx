import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { account } from '../appwrite';
import { getProfile } from '../api/profiles';

/**
 * AuthContext — ログイン中のユーザー情報・ログイン/ログアウト関数を提供。
 *
 * PHASE 4：Appwrite Auth セッション + profiles コレクションを統合。
 *   - ログイン直後に getProfile(user.$id) でプロフィールを取得して user に統合
 *   - profiles に未登録なら、Auth の name / email を使うフォールバック
 *
 * Step E でダミーログインを撤去（Q3=B）。
 */
const AuthContext = createContext(null);

/** Appwrite Auth の me + profiles を統合して UI 用 user を作る */
async function buildUser(me) {
  const profile = await getProfile(me.$id);
  return {
    id: me.$id,
    email: me.email || profile?.email || null,
    full_name: profile?.full_name || me.name || me.email || '',
    avatar_url: profile?.avatar_url || null,
    is_admin: profile?.is_admin ?? false,
    is_active: profile?.is_active ?? true,
    // 元の Auth オブジェクトも保持（labels 等を参照したい場合）
    _auth: me,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 起動時に Appwrite セッションをチェック
  // v21：is_active=false なら自動でログアウト（停止中ユーザーがセッション維持で
  // 居続けないように）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await account.get();
        const merged = await buildUser(me);
        if (merged.is_active === false) {
          try { await account.deleteSession('current'); } catch (_) {}
          if (!cancelled) setUser(null);
        } else {
          if (!cancelled) setUser(merged);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 自分のプロフィールを再取得（マイページ編集後に呼び出して反映）
  const refresh = useCallback(async () => {
    try {
      const me = await account.get();
      const merged = await buildUser(me);
      setUser(merged);
    } catch (err) {
      console.error('refresh failed:', err);
    }
  }, []);

  // ログイン（Appwrite Email + Password）
  // v21：profiles.is_active === false のユーザーはログインを拒否
  //      （Auth は残っているが、管理画面で「停止」されたユーザー対策）
  const login = useCallback(async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const me = await account.get();
    const merged = await buildUser(me);
    if (merged.is_active === false) {
      // セッションを破棄してエラーを投げる
      try { await account.deleteSession('current'); } catch (_) {}
      const err = new Error('このアカウントは停止されています。管理者にお問い合わせください。');
      err.code = 'account_inactive';
      throw err;
    }
    setUser(merged);
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // セッションが既に切れている場合は無視
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
