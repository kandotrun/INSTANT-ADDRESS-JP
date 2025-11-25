# Repository Guidelines

## プロジェクト構成

- Next.js 15 App Router + TypeScript。Mobile first Brutalist UI。
- web/app にページと layout。server components 優先、client 必須箇所のみ。
- web/src/components に UI、web/src/lib に純粋ロジック、web/src/schemas に zod スキーマ。
- web/public/postal/ に prefix-xxx.json を 3 桁ごとに配置。例: prefix-100.json。
- tools/scripts/postal/ に CSV 取得・変換スクリプト。.github/workflows/postal.yml で毎日実行。
- tests は web/app/**/__tests__ など隣接配置を基本。

## セットアップ・開発コマンド

- Node 24 推奨。パッケージマネージャは bun で統一。
- データツール: `cd tools && bun install` / `bun run fetch-postal`。
- フロント: `cd web && bun install` / `bun dev` / `bun build` / `bun start`。
- lint/format: `cd web && bun lint`、`bun format`（biome）。
- テスト: `cd web && bun test`（追加時）。E2E は bun x playwright test を想定。

## コーディング規約

- インデント 2 spaces、セミコロンあり、strict TypeScript、any 禁止。
- React server component を優先。useEffect は必要最小限。副作用は custom hook に封じ込める。
- コンポーネントは PascalCase、ファイルは kebab-case。named export を基本とする。
- 文字列は template literal を用い、マジックナンバーは const に抽出。
- データ検証は zod。API/フォーム共通スキーマを src/schemas に配置。
- UI トーン: モノクロ、太字サンセリフ、角丸なし、1px ボーダー、sticky header/footer。

## テスト方針

- 単体は lib の純関数を優先。describe/it 命名は「対象」「期待」を日本語で短く。
- カバレッジ目標 line 80% 以上。重要ロジックは snapshot ではなく値比較を使用。
- E2E は主要入力フローとコピー操作をカバー。CI で headless 実行。

## データ更新ワークフロー

- scripts/postal/fetch-postal.ts で 日本郵便 CSV を取得し UTF-8 変換。
- prefix JSON を 3 桁単位で public/postal へ出力し、main へコミット。
- GitHub Actions は 毎日 JST 深夜に実行。失敗時は前回成果物を維持。

## コミット & PR

- Conventional Commits を採用。例: feat: add postal prefix fetcher。
- 1 コミット 1 意図。大きい変更は feature/xxxx ブランチを作成。
- PR には概要、テスト結果、スクリーンショット（UI 変更時）、関連 issue リンクを記載。
- PR/issue の参照・作成は gh コマンドを使用。例: gh pr create、gh issue view 123。
- main への直 push 禁止。レビューは最低 1 名。CI green を必須。

## セキュリティ・設定

- 環境変数は .env.local に置き gitignore。Vercel 秘匿値は Dashboard で管理。
- 外部 API を叩かない設計だが、ビルド時の fetch にはタイムアウトとリトライを設定。
