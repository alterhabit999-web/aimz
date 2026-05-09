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
} from '../api';
import {
  pickImageFile,
  processImageToDataUri,
  validateImageFile,
  AVATAR_MAX_FILE_BYTES,
} from '../utils/avatarImage';
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

  // 初回のみ全画面ローディング、以降はバックグラウンド更新（ProfileEditor の
  // unmount を防ぐため）。ファイル選択中にフォーカスイベントで reload しても
  // 編集中の state が消えないようにする（v18 の重要修正）。
  const initialLoadRef = useRef(true);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    if (initialLoadRef.current) setLoading(true);
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
      initialLoadRef.current = false;
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
// プロフィール編集（v18：base64 data URI + 動的 input picker 方式）
// ============================================================
function ProfileEditor({ profile, onSaved }) {
  const [name, setName]                 = useState(profile.full_name || '');
  // 永続化済みのアバター（URL でも data URI でも可）
  const [savedSrc, setSavedSrc]         = useState(profile.avatar_url || '');
  // 未保存の data URI（プレビュー兼保存対象）
  const [pendingDataUri, setPendingDataUri] = useState(null);
  // 削除フラグ：保存時に DB を null にする
  const [removeAvatar, setRemoveAvatar] = useState(false);
  // ファイル選択直後のリサイズ中
  const [processing, setProcessing]     = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // 診断用：画面上に表示するイベントログ
  const [diagLog, setDiagLog] = useState([]);
  const pushDiag = (msg) => {
    const line = `${new Date().toLocaleTimeString()} ${msg}`;
    console.log('[avatar]', line);
    setDiagLog(prev => [...prev, line].slice(-30));
  };

  // 親の profile が変わったら追随（reload 後）
  useEffect(() => {
    setName(profile.full_name || '');
    setSavedSrc(profile.avatar_url || '');
    setPendingDataUri(null);
    setRemoveAvatar(false);
  }, [profile.id, profile.full_name, profile.avatar_url]);

  const dirty =
    name !== (profile.full_name || '') ||
    !!pendingDataUri ||
    removeAvatar;

  // 共通：File を受けてリサイズ→data URI 化→state にセット
  const ingestFile = async (file) => {
    pushDiag(`ingestFile name=${file?.name} size=${file?.size} type=${file?.type}`);
    setError('');
    if (!file) {
      pushDiag('ingestFile: file is null, abort');
      return;
    }
    const v = validateImageFile(file);
    if (!v.ok) {
      pushDiag(`validation FAILED: ${v.error}`);
      setError(v.error);
      return;
    }
    pushDiag('validation OK, processing...');
    setProcessing(true);
    try {
      const dataUri = await processImageToDataUri(file);
      pushDiag(`dataUri produced, length=${dataUri.length}`);
      setPendingDataUri(dataUri);
      setRemoveAvatar(false);
    } catch (err) {
      pushDiag(`process ERROR: ${err?.message || err}`);
      console.error('[avatar] processImageToDataUri error:', err);
      setError(err?.message || '画像の処理に失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  // ─── 「画像を選択」ボタン：動的 <input> 生成 → .click() ───
  // この関数はユーザーのクリックハンドラの直接の同期処理として呼ばれること
  const handlePickClick = async () => {
    pushDiag('handlePickClick: button clicked');
    try {
      const file = await pickImageFile();
      pushDiag(`pickImageFile resolved: file=${file ? file.name : 'null'}`);
      if (file) await ingestFile(file);
    } catch (err) {
      pushDiag(`handlePickClick ERROR: ${err?.message || err}`);
      console.error('[avatar] handlePickClick error:', err);
      setError('ファイル選択でエラーが発生しました');
    }
  };

  // ─── ドラッグ&ドロップ ───
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const fileList = e.dataTransfer?.files;
    pushDiag(`onDrop fired, files.length=${fileList?.length ?? 'undefined'}`);
    const file = fileList?.[0];
    if (file) ingestFile(file);
  };
  const onDragEnter = (e) => {
    e.preventDefault();
    pushDiag('onDragEnter');
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    pushDiag('onDragLeave');
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClearPending = () => {
    setPendingDataUri(null);
  };

  const handleRemoveCurrent = () => {
    setPendingDataUri(null);
    setRemoveAvatar(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setError('');
    setSaving(true);
    try {
      let nextSrc = savedSrc || null;
      if (pendingDataUri) nextSrc = pendingDataUri;
      if (removeAvatar)   nextSrc = null;

      await updateProfile(profile.id, {
        full_name: name.trim(),
        avatar_url: nextSrc,
      });

      setPendingDataUri(null);
      setRemoveAvatar(false);

      await onSaved?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 表示用：保留中の data URI > 削除フラグなら未設定 > 既存 DB
  const displayedSrc = pendingDataUri
    ? pendingDataUri
    : (removeAvatar ? null : (savedSrc || null));

  const statusLine = pendingDataUri
    ? `新しい画像を選択中（保存で確定）`
    : (removeAvatar
        ? '保存時に画像を削除します'
        : (savedSrc ? '現在の画像が設定されています' : '画像は未設定'));

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

      <FormField
        label="プロフィール画像"
        hint={`PNG / JPG（最大 ${(AVATAR_MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB）。256×256 に自動リサイズして保存`}
      >
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.m,
            padding: S.m,
            border: `1px dashed ${C.border}`,
            borderRadius: '8px',
            background: C.surface,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <Avatar name={name} src={displayedSrc} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: S.xs, color: C.text, fontWeight: 700, fontSize: '0.857rem' }}>
              <Upload size={14} color={C.accent} />
              {processing ? '処理中…' : 'ボタンから選択 または ここにドラッグ&ドロップ'}
            </div>
            <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '2px' }}>
              {statusLine}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div style={{ display: 'flex', gap: S.xs, marginTop: S.s, flexWrap: 'wrap' }}>
          <Button
            type="button"
            size="sm"
            Icon={Upload}
            onClick={handlePickClick}
            disabled={processing || saving}
          >
            画像を選択
          </Button>
          {pendingDataUri && (
            <Button type="button" variant="secondary" size="sm" onClick={handleClearPending} disabled={saving}>
              選択をキャンセル
            </Button>
          )}
          {(savedSrc || pendingDataUri) && !removeAvatar && (
            <Button type="button" variant="secondary" size="sm" Icon={Trash2} onClick={handleRemoveCurrent} disabled={saving}>
              画像を削除
            </Button>
          )}
          {removeAvatar && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setRemoveAvatar(false)} disabled={saving}>
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

      {/* 一時的な診断ログパネル（v18 デバッグ用、原因特定後に撤去） */}
      <details open style={{
        marginTop: S.m,
        padding: S.s,
        background: '#fffbea',
        border: '1px dashed #ffcc17',
        borderRadius: '6px',
        fontSize: '0.75rem',
      }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#7a5a00' }}>
          🐛 アバター診断ログ（{diagLog.length} 件）
        </summary>
        <div style={{
          marginTop: '6px',
          padding: '6px',
          background: '#fff',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          maxHeight: '200px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {diagLog.length === 0
            ? '（まだイベントがありません）'
            : diagLog.map((line, i) => <div key={i}>{line}</div>)}
        </div>
        <button
          type="button"
          onClick={() => setDiagLog([])}
          style={{ marginTop: '4px', fontSize: '0.7rem', padding: '2px 8px' }}
        >
          ログをクリア
        </button>
      </details>

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
