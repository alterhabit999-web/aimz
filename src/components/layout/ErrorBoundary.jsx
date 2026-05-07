import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { C, S } from '../../styles/tokens';

/**
 * ErrorBoundary — 子コンポーネントの予期せぬクラッシュを捕捉して
 * 白画面の代わりにエラー UI を表示する。
 *
 * 主な配置：AppShell の <main>（各ページの外側）/ ProfilePage 内のエディタ等。
 *
 * 注：React の ErrorBoundary は class component でしか作れない仕様。
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  reload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: S.l,
      }}>
        <div style={{
          background: C.surface,
          border: `1px solid ${C.danger}`,
          borderRadius: '8px',
          padding: S.l,
          boxShadow: C.shadow1,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: S.s,
            color: C.danger,
            fontWeight: 700,
            marginBottom: S.s,
          }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: '1rem' }}>画面の表示中に問題が発生しました</span>
          </div>

          <p style={{ color: C.textSub, fontSize: '0.857rem', marginBottom: S.m }}>
            ページを再読み込みすると改善する場合があります。問題が続く場合は、
            ブラウザのコンソールに表示されるエラーメッセージを管理者にお伝えください。
          </p>

          <details style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: '6px',
            padding: S.s,
            marginBottom: S.m,
            fontSize: '0.75rem',
            color: C.textSub,
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: C.text }}>
              エラー詳細
            </summary>
            <pre style={{
              marginTop: S.xs,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}>
              {String(error?.message || error)}
              {error?.stack ? '\n\n' + error.stack : ''}
            </pre>
          </details>

          <div style={{ display: 'flex', gap: S.s, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.reload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                background: C.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.857rem',
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
            >
              <RefreshCw size={14} />
              ページを再読み込み
            </button>
            <button
              type="button"
              onClick={() => { this.reset(); window.location.assign('/'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                background: 'transparent',
                color: C.textSub,
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.857rem',
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
            >
              <Home size={14} />
              トップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }
}
