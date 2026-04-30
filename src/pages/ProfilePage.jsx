import React, { useState } from 'react';
import { User, Lock, LogOut, Image as ImageIcon, Crown, Shield } from 'lucide-react';
import { C, S } from '../styles/tokens';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import FormField, { inputStyle } from '../components/ui/FormField';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import {
  myDepartments,
  myTeams,
  isTeamLeader,
} from '../data/dummy';

/**
 * ProfilePage — マイページ（仕様 3-1：プロフィール編集 + パスワード変更）。
 *
 * 構成（縦並び）：
 *   1. プロフィールカード（アバター、氏名、メール、ロール表示、所属）
 *   2. プロフィール編集（氏名・アバター URL）
 *   3. パスワード変更
 *   4. ログアウト
 */
export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const departments = myDepartments(user.id);
  const teams = myTeams(user.id);
  const leader = isTeamLeader(user.id);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, margin: 0, marginBottom: S.l }}>
        マイページ
      </h1>

      {/* プロフィールサマリー */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: S.m }}>
          <Avatar name={user.full_name} src={user.avatar_url} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: C.text,
            }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: '0.857rem', color: C.textSub, marginTop: '2px' }}>
              {user.email}
            </div>
            <div style={{ display: 'flex', gap: S.xs, marginTop: S.xs, flexWrap: 'wrap' }}>
              {user.is_admin && <RoleBadge Icon={Shield} label="管理者" color={C.accent} />}
              {leader && <RoleBadge Icon={Crown} label="チームリーダー" color={C.orange} />}
              {!user.is_admin && !leader && <RoleBadge Icon={User} label="メンバー" color={C.textSub} />}
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
            {departments.length === 0 ? (
              <span style={{ color: C.textMuted }}>未所属</span>
            ) : (
              departments.map(d => d.name).join(' / ')
            )}
          </Meta>
          <Meta label="所属チーム">
            {teams.length === 0 ? (
              <span style={{ color: C.textMuted }}>未所属</span>
            ) : (
              teams.map(t => t.name).join(' / ')
            )}
          </Meta>
        </div>
      </Card>

      {/* プロフィール編集 */}
      <div style={{ marginTop: S.m }}>
        <ProfileEditor user={user} />
      </div>

      {/* パスワード変更 */}
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
function ProfileEditor({ user }) {
  const [name, setName]           = useState(user.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [saving, setSaving]       = useState(false);

  const dirty = name !== user.full_name || avatarUrl !== (user.avatar_url || '');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    // TODO: Appwrite 連携時に account.updateName 等を呼ぶ
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    alert('プロフィールを更新しました（※ダミー、まだ DB に保存されません）');
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: S.m }}>
        <Button onClick={handleSave} disabled={!dirty || saving || !name.trim()}>
          {saving ? '保存中…' : '保存する'}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// パスワード変更
// ============================================================
function PasswordChanger() {
  const [oldPwd, setOldPwd]     = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  const handleChange = async () => {
    setError('');
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
    setSaving(true);
    // TODO: Appwrite 連携時に account.updatePassword(newPwd, oldPwd) を呼ぶ
    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    alert('パスワードを変更しました（※ダミー、まだ DB には反映されません）');
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

