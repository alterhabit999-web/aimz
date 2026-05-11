import React, { useEffect, useMemo, useRef, useState } from 'react';
import { C, S } from '../../../styles/tokens';
import Avatar from '../../ui/Avatar';
import { textareaStyle } from '../../ui/FormField';

/**
 * MentionTextarea — `@` でユーザー候補をサジェストする textarea（v19 新規）。
 *
 * Props:
 *   value, onChange(value, mentionedIds)   value = textarea の生文字列、mentionedIds = 確定したメンションのユーザー ID 配列
 *   profiles                               候補となる profile 配列（{ id, full_name, avatar_url, is_active }）
 *   placeholder, rows, disabled, onKeyDown 標準 textarea プロパティ
 *
 * 仕様：
 *   - 半角または全角の `@` を打つとサジェスト開始
 *   - `@` から半角空白 / 改行までの文字列を query として profiles をフィルタ
 *   - ↑↓ で候補移動、Enter / Tab / クリックで確定（`@<full_name>` + 半角空白を挿入）
 *   - Escape で閉じる
 *   - 確定した時点で mentionedIds 配列に push（重複 ID は省く）
 *   - 投稿側では本文に残っている `@<full_name>` を再走査して通知対象を決める
 *     （IDs だけ親に渡し、削除されたら通知も飛ばさない判定はコメント投稿側で実施）
 */
export default function MentionTextarea({
  value,
  onChange,
  profiles = [],
  placeholder,
  rows = 3,
  disabled = false,
  onKeyDown,
  textareaRef: externalRef,
}) {
  const innerRef = useRef(null);
  const textareaRef = externalRef || innerRef;
  const [caret, setCaret]               = useState(0);
  const [suggestOpen, setSuggestOpen]   = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [activeIdx, setActiveIdx]       = useState(0);

  // `@` の直前の位置を保持（確定時に置換するため）
  const mentionStartRef = useRef(-1);

  const activeProfiles = useMemo(() => {
    if (!suggestOpen) return [];
    const q = (suggestQuery || '').toLowerCase();
    const list = profiles.filter(p => p.is_active !== false);
    if (!q) return list.slice(0, 8);
    return list
      .filter(p => (p.full_name || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [profiles, suggestOpen, suggestQuery]);

  // caret 位置から「現在 @ 入力中か」を判定し、開閉と query を更新
  const updateSuggestState = (text, pos) => {
    // pos の直前文字までを見て、最後の "@" の位置を探す（直前が空白 or 行頭 or 文頭の "@"）
    let start = -1;
    for (let i = pos - 1; i >= 0; i--) {
      const ch = text[i];
      if (ch === '@' || ch === '＠') {
        const prev = i > 0 ? text[i - 1] : '';
        const isBoundary = i === 0 || /\s/.test(prev);
        if (isBoundary) start = i;
        break;
      }
      if (/\s/.test(ch)) break; // 空白に当たったらメンションではない
    }
    if (start === -1) {
      setSuggestOpen(false);
      mentionStartRef.current = -1;
      return;
    }
    // @ の次の文字列が query
    const q = text.slice(start + 1, pos);
    // クエリ内に空白があるとサジェスト終了
    if (/\s/.test(q)) {
      setSuggestOpen(false);
      mentionStartRef.current = -1;
      return;
    }
    mentionStartRef.current = start;
    setSuggestQuery(q);
    setSuggestOpen(true);
    setActiveIdx(0);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    onChange?.(newValue);
    setCaret(pos);
    updateSuggestState(newValue, pos);
  };

  const handleSelect = (profile) => {
    if (!profile) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = mentionStartRef.current;
    if (start < 0) return;

    // `@<query>` を `@<full_name> ` に置換
    const before = value.slice(0, start);
    const after  = value.slice(caret);
    const insert = `@${profile.full_name} `;
    const next   = `${before}${insert}${after}`;
    const newCaret = (before + insert).length;

    onChange?.(next, profile.id);
    setSuggestOpen(false);
    mentionStartRef.current = -1;

    // caret を挿入位置に移動
    requestAnimationFrame(() => {
      try {
        ta.focus();
        ta.setSelectionRange(newCaret, newCaret);
      } catch (_) {}
    });
  };

  const handleKeyDown = (e) => {
    if (suggestOpen && activeProfiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % activeProfiles.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + activeProfiles.length) % activeProfiles.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        // IME 変換中は通常の Enter として扱わない
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
        e.preventDefault();
        handleSelect(activeProfiles[activeIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestOpen(false);
        mentionStartRef.current = -1;
        return;
      }
    }
    onKeyDown?.(e);
  };

  // caret 変化も拾う（クリックや矢印キーで移動した時）
  const handleKeyUp = (e) => {
    const pos = e.target.selectionStart || 0;
    setCaret(pos);
    updateSuggestState(value || '', pos);
  };
  const handleClick = (e) => {
    const pos = e.target.selectionStart || 0;
    setCaret(pos);
    updateSuggestState(value || '', pos);
  };
  const handleBlur = () => {
    // 少し遅らせて閉じる（候補クリックを拾うため）
    setTimeout(() => setSuggestOpen(false), 150);
  };

  // value が外部から書き換わったら caret を末尾に同期（簡易）
  useEffect(() => {
    setCaret(textareaRef.current?.selectionStart || value.length);
  }, [value]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={textareaStyle}
      />

      {/* サジェストドロップダウン */}
      {suggestOpen && activeProfiles.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: '4px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            boxShadow: C.shadow2,
            listStyle: 'none',
            padding: '4px',
            zIndex: 50,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {activeProfiles.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: S.s,
                padding: `${S.xs} ${S.s}`,
                borderRadius: '4px',
                cursor: 'pointer',
                background: i === activeIdx ? C.accentLight : 'transparent',
              }}
            >
              <Avatar name={p.full_name} src={p.avatar_url} size={24} />
              <span style={{
                fontSize: '0.857rem',
                color: i === activeIdx ? C.accent : C.text,
                fontWeight: i === activeIdx ? 700 : 400,
              }}>
                {p.full_name}
              </span>
              {p.email && (
                <span style={{ fontSize: '0.7rem', color: C.textMuted, marginLeft: 'auto' }}>
                  {p.email}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 本文中の "@<full_name>" を抽出して、profile に該当するユーザー ID を返す。
 *   - 候補は半角空白・改行・本文末で区切られる
 *   - 候補は profile.full_name の文字列マッチ（最長一致）
 */
export function extractMentionedIds(body, profiles = []) {
  if (!body || !profiles.length) return [];
  const ids = new Set();
  // 半角 / 全角 @ どちらでも検出
  const regex = /[@＠]([^\s@＠]+)/g;
  let m;
  while ((m = regex.exec(body)) !== null) {
    const after = m[1];
    // profiles から full_name が after の先頭一致するものを探す（最長一致）
    const candidate = profiles
      .filter(p => p.is_active !== false)
      .filter(p => after.startsWith(p.full_name))
      .sort((a, b) => b.full_name.length - a.full_name.length)[0];
    if (candidate) ids.add(candidate.id);
  }
  return [...ids];
}

/**
 * 本文中の "@<full_name>" 部分をハイライト用にトークン化する。
 *   返り値：[{ type: 'text', text }, { type: 'mention', text, profile }, ...]
 */
export function renderMentionTokens(body, profiles = []) {
  if (!body) return [];
  const tokens = [];
  const activeProfiles = profiles.filter(p => p.is_active !== false);
  const sorted = [...activeProfiles].sort((a, b) => (b.full_name || '').length - (a.full_name || '').length);
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === '@' || ch === '＠') {
      // 先頭一致で最長の profile を探す
      const rest = body.slice(i + 1);
      const hit = sorted.find(p => p.full_name && rest.startsWith(p.full_name));
      if (hit) {
        tokens.push({ type: 'mention', text: `@${hit.full_name}`, profile: hit });
        i += 1 + hit.full_name.length;
        continue;
      }
    }
    // 通常テキスト：次の @ までを 1 つのテキストトークンに
    const next = body.indexOf('@', i + 1);
    const nextFull = body.indexOf('＠', i + 1);
    const cuts = [next, nextFull].filter(x => x !== -1);
    const end = cuts.length > 0 ? Math.min(...cuts) : body.length;
    tokens.push({ type: 'text', text: body.slice(i, end) });
    i = end;
  }
  return tokens;
}
