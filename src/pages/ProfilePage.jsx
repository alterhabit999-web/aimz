import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User, Lock, LogOut, Crown, Shield, Upload, Trash2 } from 'lucide-react';
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
  uploadAvatar,
  deleteAvatarByUrl,
  isStorageAvatar,
  AVATAR_MAX_BYTES,
  AVATAR_ACCEPT,
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
  const fileInputRef = useRef(null);

  const [name, setName]                 = useState(profile.full_name || '');
  // 永続化済みのアバター URL（DB 値）
  const [savedUrl, setSavedUrl]         = useState(profile.avatar_url || '');
  // 選択中の File（未アップロード）
  const [pendingFile, setPendingFile]   = useState(null);
  // ローカルプレビュー用 ObjectURL
  const [previewUrl, setPreviewUrl]     = useState(null);
  // 「削除」フラグ：保存時に DB を null にする
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // 親の profile が変わったら追随（reload 後）
  useEffect(() => {
    setName(profile.full_name || '');
    setSavedUrl(profile.avatar_url || '');
    setPendingFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [profile.id, profile.full_name, profile.avatar_url]);

  // ObjectURL のクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const dirty =
    name !== (profile.full_name || '') ||
    !!pendingFile ||
    removeAvatar;

  // ─── ファイル選択 / ドロップ ───
  const handlePickFile = (file) => {
    setError('');
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES) {
      setError(`ファイルサイズは ${(AVATAR_MAX_BYTES / 1_000_000).toFixed(0)} MB 以下にしてください`);
      return;
    }
    // 拡張子で判定（file.type が空 / 非標準なブラウザでも通せるように）
    const ext = (file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
    const okByExt = ['png', 'jpg', 'jpeg'].includes(ext);
    const okByType = !file.type || AVATAR_ACCEPT.includes(file.type);
    if (!okByExt || !okByType) {
      setError('PNG / JPG / JPEG のみアップロードできます');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    handlePickFile(file);
    // 同じファイルを再選択しても onChange が発火するよう、処理後に value をクリア
    // （onClick 内で value='' すると一部ブラウザで onChange 抑制されるため、ここで実施）
    if (e.target) e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlePickFile(e.dataTransfer?.files?.[0] || null);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClearPending = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveCurrent = () => {
    handleClearPending();
    setRemoveAvatar(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setError('');
    setSaving(true);
    try {
      let nextUrl = savedUrl || null;

      // 1) 新ファイルのアップロード
      if (pendingFile) {
        nextUrl = await uploadAvatar(pendingFile);
      }

      // 2) 削除フラグ
      if (removeAvatar) {
        nextUrl = null;
      }

      // 3) DB 更新
      await updateProfile(profile.id, {
        full_name: name.trim(),
        avatar_url: nextUrl,
      });

      // 4) 古いアバターを Storage から削除（差し替え or 削除フラグの場合）
      const replaced = pendingFile || removeAvatar;
      if (replaced && savedUrl && isStorageAvatar(savedUrl) && savedUrl !== nextUrl) {
        await deleteAvatarByUrl(savedUrl);
      }

      // 5) ローカル状態を片付け
      handleClearPending();
      setRemoveAvatar(false);

      await onSaved?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 表示用：プレビュー（新ファイル）> 削除フラグなら未設定 > 既存 DB
  const displayedSrc = previewUrl
    ? previewUrl
    : (removeAvatar ? null : (savedUrl || null));

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

      <FormField label="プロフィール画像" hint="PNG / JPG（最大 5 MB）。クリック または ドラッグ&ドロップ">
        {/*
          input は label の外（兄弟）に置き htmlFor で接続。
          内側にネストすると、プログラマティック click が親に再バブル / display:none で
          file picker が起動しないブラウザがあるため、視覚的に隠す sr-only パターンを採用。
        */}
        <input
          id="avatar-file-input"
          ref={fileInputRef}
          type="file"
          accept={AVATAR_ACCEPT.join(',')}
          onChange={onFileChange}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />
        <label
          htmlFor="avatar-file-input"
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.m,
            padding: S.m,
            border: `1px dashed ${C.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            background: C.surface,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = C.accent;
            e.currentTarget.style.background = C.bg;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.background = C.surface;
          }}
        >
          <Avatar name={name} src={displayedSrc} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: S.xs, color: C.text, fontWeight: 700, fontSize: '0.857rem' }}>
              <Upload size={14} color={C.accent} />
              {pendingFile ? `選択中：${pendingFile.name}` : 'クリックしてファイル選択 / ドラッグ&ドロップ'}
            </div>
            <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '2px' }}>
              {pendingFile
                ? `${(pendingFile.size / 1024).toFixed(0)} KB${pendingFile.type ? ` / ${pendingFile.type}` : ''}`
                : (removeAvatar
                    ? '保存時に画像を削除します'
                    : (savedUrl ? '現在の画像が設定されています' : '画像は未設定'))}
            </div>
          </div>
        </label>

        {/* アクションボタン */}
        <div style={{ display: 'flex', gap: S.xs, marginTop: S.s, flexWrap: 'wrap' }}>
          {pendingFile && (
            <Button variant="secondary" size="sm" onClick={handleClearPending}>
              選択をキャンセル
            </Button>
          )}
          {(savedUrl || pendingFile) && !removeAvatar && (
            <Button variant="secondary" size="sm" Icon={Trash2} onClick={handleRemoveCurrent}>
              画像を削除
            </Button>
          )}
          {removeAvatar && (
            <Button variant="secondary" size="sm" onClick={() => setRemoveAvatar(false)}>
              削除を取り消す
            </Button>
          )}
        </div>
      </FormField>

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
