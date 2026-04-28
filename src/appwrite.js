/**
 * appwrite.js — Appwrite クライアント設定
 *
 * 【用語説明】
 * Appwrite: データベース・認証・ファイル保存を提供するバックエンドサービス
 * Client:   Appwrite に接続するための基本設定（URLとプロジェクトID）
 * Account:  ログイン・ログアウト・ユーザー情報を扱う
 * Databases: データの保存・取得・更新・削除を行う
 * Storage:  ファイルのアップロード・ダウンロードを行う
 */

import { Client, Account, Databases, Storage, Teams } from 'appwrite';

// Appwrite クライアントの初期化
// .env ファイルに設定した値が自動で読み込まれます
const client = new Client()
  .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID || '');

// 各機能のインスタンスをエクスポート（他のファイルから import して使う）
export const account = new Account(client);      // 認証（ログイン・ログアウト）
export const databases = new Databases(client);  // データベース操作
export const storage = new Storage(client);      // ファイル操作
export const teams = new Teams(client);          // チーム管理

// よく使う定数（.env から読み込み）
export const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID || '';
export const STORAGE_BUCKET_ID = process.env.REACT_APP_APPWRITE_STORAGE_BUCKET_ID || '';

export default client;
