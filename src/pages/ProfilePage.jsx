import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, Lock, LogOut, Image as ImageIcon, Crown, Shield } from 'lucide-react';
import { C, S } from '../styles/tokens';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import FormField, { inputStyle } from '../components/ui/FormField';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { account } from '../appwrite';
import {
  getProfile,
  updateProfile,
  listAllTeamMembers,
  listTeams,
  listDepartments,
} from '../api';
import useReloadOnFocus from '../hooks/useReloadOnFocus';

/**
 * ProfilePage — マイページ（仕様 3-1：プロフィール編集 + パスワード変更）。
 * PHASE 3 で実 DB 化。プロフィール編集は updateProfile() に接続。
 *
 * 構成（縦並び）：
 *   1. プロフィールカード（アバター、氏名、メール、ロール、所属）
 *   2. プロフィール編集（氏名・アバター URL）
 *   3. パスワード変更（PHASE 4 で本実装、現状はダミー）
 *   4. ログアウト
 */
export default function ProfilePage() {
  const { user, logout, refresh } = useAuth();

  // ─── 取得データ ───
  const [profile, setProfile]         = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teams, setTeams]             = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, tm, t, d] = await Promise.all([
        getProfile(user.id),
        listAllTeamMembers(),
        listTeams(),
        listDepartments(),
      ]);
      setProfile(p);
      setTeamMembers(tm);
      setTeams(t);
      setDepartments(d);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'プロフィール情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);
  useReloadOnFocus(reload);

  // ─── 派生：自分の所属部署・チーム・リーダー判定 ───
  const view = useMemo(() => {
    if (!user?.id) return { departments: [], teams: [], isLeader: false };
    const myMemberships = teamMembers.filter(m => m.user_id === user.id);
    const myTeamIds = new Set(myMemberships.map(m => m.team_id));
    const myTeams = teams.filter(t => myTeamIds.has(t.id));
    const myDeptIds = new Set(myTeams.map(t => t.department_id));
    const myDepts = departments.filter(d => myDeptIds.has(d.id));
    const isLeader = myMemberships.some(m => m.role === 'leader');
    return { departments: myDepts, teams: myTeams, isLeader };
  }, [user?.id, teamMembers, teams, departments]);

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.05rem, 4vw, 1.5rem)', fontWeight: 700, color: C.text, margin: 0, marginBottom: S.l }}>
          マイページ
        </h1>
        <div style={{ padding: S.xl, textAlign: 'center', color: C.textMuted }}>
          読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(1.05rem, 4vw, 1.5rem)', fontWeight: 700, color: C.text, margin: 0, marginBottom: S.l }}>
          マイページ
        </h1>
        <div style={{ padding: S.xl, textAlign: 'center', color: C.danger }}>
          {error}
          <div style={{ marginTop: S.s }}>
            <Button variant="secondary" size="sm" onClick={reload}>再試行</Button>
          </div>
        </div>
      </div>
    );
  }

  // 表示は profile（最新）を優先、無ければ user（AuthContext のフォールバック）
  const displayUser = profile || user;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(1.05rem, 4vw, 1.5rem)', fontWeight: 700, color: C.text, margin: 0, marginBottom: S.l }}>
        マイページ
      </h1>

      {/* プロフィールサマリー */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: S.m }}>
          <Avatar name={displayUser.full_name} src={displayUser.avatar_url} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: C.text }}>
              {displayUser.full_name}
            </div>
            <div style={{ fontSize: '0.857rem', color: C.textSub, marginTop: '2px' }}>
              {displayUser.email}
            </div>
            <div style={{ display: 'flex', gap: S.xs, marginTop: S.xs, flexWrap: 'wrap' }}>
              {displayUser.is_admin && <RoleBadge Icon={Shield} label="管理者" color={C.accent} />}
              {view.isLeader && <RoleBadge Icon={Crown} label="チームリーダー" color={C.orange} />}
              {!displayUser.is_admin && !view.isLeader && (
                <RoleBadge Icon={User} label="メンバー" color={C.textSub} />
              )}
            </div>
          </div>
        </div>

        {/* 所属情報 */}
        <div style={{
          marginTop: S.m,
          paddingTop: S.m,
          borderTop: `1px solid ${C.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: S.m,
        }}>
          <Meta label="所属部署">
            {view.departments.length === 0 ? (
              <span style={{ color: C.textMuted }}>未所属</span>
            ) : (
              view.departments.map(d => d.name).join(' / ')
            )}
          </Meta>
          <Meta label="所属チーム">
            {view.teams.length === 0 ? (
              <span style={{ color: C.textMuted }}>未所属</span>
            ) : (
              view.teams.map(t => t.name).join(' / ')
            )}
          </Meta>
        </div>
      </Card>

      {/* プロフィール編集 */}
      <div style={{ marginTop: S.m }}>
        <ProfileEditor profile={displayUser} onSaved={async () => { await reload(); await refresh(); }} />
      </div>

      {/* パスワード変更（PHASE 4 で本実装） */}
      <div style={{ marginTop: S.m }}>
        <PasswordChanger />
      </div>

      {/* ログアウト */}
      <div style={{ marginTop: S.m }}>
        <LogoutCard onLogout={logout} />
      </div>
    </div>
  );
}

// ============================================================
// プロフィール編集
// ============================================================
function ProfileEditor({ profile, onSaved }) {
  const [name, setName]           = useState(profile.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // 親の profile が変わったら追随（reload 後）
  useEffect(() => {
    setName(profile.full_name || '');
    setAvatarUrl(profile.avatar_url || '');
  }, [profile.full_name, profile.avatar_url]);

  const dirty = name !== (profile.full_name || '') || avatarUrl !== (profile.avatar_url || '');

  const handleSave = async () => {
    if (!name.trim()) return;
    setError('');
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        full_name: name.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
      await onSaved?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="プロフィール編集" Icon={User}>
      <FormField label="氏名" required>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="山田 太郎"
          style={inputStyle}
        />
      </FormField>

      <FormField label="アバター画像 URL" hint="将来は Appwrite Storage へのアップロードに置き換え予定">
        <div style={{ display: 'flex', gap: S.s, alignItems: 'center' }}>
          <Avatar name={name} src={avatarUrl} size={48} />
          <input
            type="url"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            style={inputStyle}
          />
        </div>
      </FormField>

      <div style={{
        marginTop: S.s,
        padding: S.s,
        background: C.bg,
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: C.textMuted,
        display: 'flex',
        alignItems: 'center',
        gap: S.xs,
      }}>
        <ImageIcon size={12} />
        画像アップロードは Appwrite Storage 連携時に実装します
      </div>

      {error && (
        <div style={{
          marginTop: S.s,
          padding: S.s,
          background: C.dangerBg,
          color: C.danger,
          borderRadius: '6px',
          fontSize: '0.857rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: S.m }}>
        <Button onClick={handleSave} disabled={!dirty || saving || !name.trim()}>
          {saving ? '保存中…' : '保存する'}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// パスワード変更（Appwrite Auth に接続）
// ============================================================
function PasswordChanger() {
  const [oldPwd, setOldPwd]     = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [saving, setSaving]     = useState(false);

  const handleChange = async () => {
    setError('');
    setSuccess('');
    if (!oldPwd || !newPwd || !confirmPwd) {
      setError('すべての項目を入力してください');
      return;
    }
    if (newPwd.length < 8) {
      setError('新しいパスワードは 8 文字以上にしてください');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('新しいパスワードと確認用が一致しません');
      return;
    }
    if (newPwd === oldPwd) {
      setError('新しいパスワードは現在のものと異なる必要があります');
      return;
    }

    setSaving(true);
    try {
      // 引数の順序：(newPassword, oldPassword)
      await account.updatePassword(newPwd, oldPwd);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setSuccess('パスワードを変更しました。次回ログインから新しいパスワードを使用してください。');
    } catch (err) {
      console.error(err);
      // よくあるエラーを日本語化
      let msg = err?.message || 'パスワードの変更に失敗しました';
      if (/invalid credentials|password|wrong/i.test(msg)) {
        msg = '現在のパスワードが正しくありません';
      } else if (/session/i.test(msg)) {
        msg = 'セッションが切れています。再ログインしてからお試しください。';
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="パスワード変更" Icon={Lock}>
      <FormField label="現在のパスワード" required>
        <input
          type="password"
          value={oldPwd}
          onChange={e => setOldPwd(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </FormField>
      <FormField label="新しいパスワード" required hint="8 文字以上">
        <input
          type="password"
          value={newPwd}
          onChange={e => setNewPwd(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </FormField>
      <FormField label="新しいパスワード（確認）" required>
        <input
          type="password"
          value={confirmPwd}
          onChange={e => setConfirmPwd(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
      </FormField>

      {error && (
        <div style={{
          padding: S.s,
          background: C.dangerBg,
          color: C.danger,
          borderRadius: '6px',
          fontSize: '0.857rem',
          marginBottom: S.s,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: S.s,
          background: '#e8f4ec',
          color: C.success,
          borderRadius: '6px',
          fontSize: '0.857rem',
          marginBottom: S.s,
        }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleChange} disabled={saving}>
          {saving ? '変更中…' : 'パスワードを変更'}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// ログアウト
// ============================================================
function LogoutCard({ onLogout }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <Card>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: S.m,
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: C.text }}>
              ログアウト
            </div>
            <div style={{ fontSize: '0.857rem', color: C.textSub, marginTop: '2px' }}>
              現在のセッションを終了します
            </div>
          </div>
          <Button variant="secondary" Icon={LogOut} onClick={() => setConfirmOpen(true)}>
            ログアウト
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="ログアウトしますか？"
        message="再度ログインするにはメールとパスワードが必要です。"
        confirmLabel="ログアウト"
        variant="primary"
        onConfirm={onLogout}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

// ============================================================
// 小コンポーネント
// ============================================================
function RoleBadge({ Icon, label, color }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '4px',
      background: C.bgSub,
      color,
      fontSize: '0.75rem',
      fontWeight: 700,
    }}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function Meta({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: '0.7rem',
        color: C.textMuted,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.857rem', color: C.text }}>
        {children}
      </div>
    </div>
  );
}
