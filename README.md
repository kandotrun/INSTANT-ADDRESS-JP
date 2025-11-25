# INSTANT ADDRESS JP

日本の住所を英語表記へリアルタイム変換するモバイル特化のWebアプリケーションです。郵便番号データは日本郵便公式CSVを毎日取得し、静的JSONとして配信します。

## 特徴
- Next.js 15 (App Router) / TypeScript を前提に設計
- 住所マスタは GitHub Actions で日次更新し、ランタイムは静的JSONのみ参照
- zod でデータを検証し、不正なエントリを除外

## ディレクトリ構成
- `web/` : Next.js 15 フロントエンド（bun 使用）
  - `app/` App Router ページ
  - `src/components/` UI コンポーネント
  - `src/lib/`, `src/schemas/` 変換ロジックとスキーマ
  - `public/postal/` 3桁プレフィックス単位の住所JSON（生成物）
- `tools/` : データ取得・自動化スクリプト
  - `scripts/postal/fetch-postal.ts` : 郵便番号CSV→JSON変換
  - `bun.lock`, `package.json`, `tsconfig.json` : ツール用設定
- `PLAN.md`, `AGENTS.md` : 企画・運用ガイド

## セットアップ
前提: Node 24 以上、bun 1.3 以上。

```bash
cd tools && bun install
cd ../web && bun install
```

## 主要コマンド
- データ更新: `cd tools && bun run fetch-postal`
- フロント開発: `cd web && bun dev`
- ビルド: `cd web && bun build`
- フォーマット: `cd web && bun format`（`bun x biome format ..` を実行）

## データ更新フロー
- `.github/workflows/postal.yml` が毎日 00:30 JST に実行し、`bun run fetch-postal` で生成したJSONを自動コミットします。
- 手動更新したい場合は `bun run fetch-postal` をローカルで実行し、変更を確認してコミットしてください。

## 公開API（静的JSON）
- ベースURL: 本番 `https://<デプロイドメイン>` / ローカル `http://localhost:3000`
- エンドポイント: `GET /postal/prefix-{PPP}.json`
  - `{PPP}` は郵便番号の先頭3桁（例: `prefix-100.json`）。
  - レスポンススキーマ:
    ```json
    {
      "1008111": {
        "prefectureJa": "東京都",
        "cityJa": "千代田区",
        "townJa": "千代田",
        "prefectureEn": "TOKYO TO",
        "cityEn": "CHIYODA KU",
        "townEn": "CHIYODA"
      },
      "...": { "...": "..." }
    }
    ```
- 取得手順
  1. 郵便番号7桁の先頭3桁を抜き出す。
  2. `GET /postal/prefix-{PPP}.json` を取得。
  3. 返ってきたオブジェクトからキー `{zip7}` を参照する。
- コード例（ブラウザ/Next.js）
  ```ts
  const fetchPostal = async (zip7: string) => {
    const prefix = zip7.slice(0, 3);
    const res = await fetch(`/postal/prefix-${prefix}.json`);
    if (!res.ok) throw new Error("not found");
    const data = (await res.json()) as Record<string, any>;
    return data[zip7];
  };
  ```
- curl例
  ```bash
  curl -s http://localhost:3000/postal/prefix-100.json | jq ' ."1008111" '
  ```
- CORS: 静的ファイルのため通常は同一オリジン利用。外部利用時はデプロイ先で `Access-Control-Allow-Origin` を適宜設定してください。
- キャッシュ推奨: 日次更新のため `Cache-Control: max-age=86400` 程度が目安。
- エラー: prefixが無いとき 404、キーが無いときは `null` 扱いになるのでクライアントで判定してください。

## 開発メモ
- パッケージマネージャは bun で統一します。
- フロント実装時は server components 優先、`useEffect` は必要最小限に抑えます。
- any 型は禁止。スキーマは `src/schemas`（予定）に集約し再利用してください。
