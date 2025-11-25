# 1. サービス概要書

## 1.1 サービス名（仮）

* サービス名（仮）
  **INSTANT ADDRESS JP**
* キャッチコピー
  **TYPE ADDRESS, SEE ENGLISH INSTANTLY.**

## 1.2 サービス概要

**INSTANT ADDRESS JP** は、日本の住所を英語表記にリアルタイム変換するWebサービスです。

* 郵便番号と建物名などを入力すると、
  入力と同時に英語住所が更新される
* 住所マスタは日本郵便公式CSVを1日1回GitHub Actionsで取得・加工し、
  静的JSONとしてVercelから配信
* ランタイムで外部APIを叩かず、静的データのみで高速に動作

UIはスマートフォン最適化された**Brutalist Minimalism**スタイルで、

* モノクロ
* 太いサンセリフ
* 角丸無し
* 露出したグリッドライン
* stickyなヘッダー・フッター

を特徴とする。

## 1.3 背景・課題

* 国際郵便、海外EC、海外サインアップなど、英語住所が必要な場面は多い
* 既存サービスは

    * 変換トリガが「ボタン押下」前提
    * パフォーマンスが微妙
    * UIがコーポレート寄りで、ツール感が薄い
* 日本郵便APIは高品質だが、固定IPやレート制限など運用上の制約がある

そこで

* データは**毎日バッチで取り込んで静的化**
* フロントは**リアルタイム変換特化**
* UIは**無機質なツール感を前面に出したBrutalistデザイン**

というサービスを提供する。

## 1.4 提供価値

* ユーザー

    * 郵便番号と建物名を打つだけで英語住所を即時取得
    * 海外フォーム向けのフィールド分割表示とワンクリックコピー
    * 最低限のスタイルで情報だけが前面に出る無駄のないUI

* 運営・開発

    * ランタイムで日本郵便APIにアクセスしないため、運用が軽く壊れにくい
    * GitHub Actions + Vercel + 静的JSONで構成がシンプル
    * zodにより入力・API両方のエラーを早期に検出

## 1.5 ターゲット

* 個人: 海外通販利用者、国際郵便をよく使う人
* 事業者: 海外発送EC、バックオフィス担当
* 開発者: 社内ツールから叩く簡易住所変換のUIを探している人

## 1.6 コア機能

1. 郵便番号による住所自動補完
2. 建物名・部屋番号・電話番号を含めた英語住所生成
3. 1行形式とフィールド分割形式の英語住所表示
4. リアルタイム変換（入力と同時に画面反映）
5. Brutalist MinimalismなモバイルUI

## 1.7 デザインコンセプト

* キーワード
  Mobile UI, Brutalist Minimalism. Raw, stark, unpolished.
  Monochromatic (black, white, grey). Massive, bold, unstyled sans-serif typography (Impact, Anton系).
  Hard edges, no rounded corners. Exposed grid lines, system default UI elements, aggressive hierarchy, sticky elements.

* 具体方針

    * 背景: #ffffff
    * 文字: #000000、階層に応じて #111/#333
    * 枠線: 1px solid #000000
    * フォント: `system-ui` をベースに、見出しのみ Impact/Anton系を指定
    * 角丸: `border-radius: 0` 固定
    * 影: 原則なし
    * レイアウト: 明確なグリッド、要素間に1pxの区切り線
    * sticky:

        * 上部: サービス名とモード切替
        * 下部: 変換結果とコピー操作

---

# 2. 仕様書

## 2.1 技術要件

* Framework: Next.js 14 (App Router)
* Language: TypeScript
* UI: shadcn/ui + Tailwind CSS
* Validation: zod
* Deploy: Vercel
* Data Source:

    * 日本郵便公式「住所の郵便番号」CSV
    * 同「住所の郵便番号（ローマ字）」CSV
* データ更新:

    * GitHub Actionsで1日1回CSVをダウンロードし、JSONに変換

## 2.2 機能仕様

### 2.2.1 住所変換フロー

1. ユーザーが郵便番号を入力

    * 3桁入力時に該当prefix JSONをロード
    * 7桁に達した時点で完全一致レコードを取得
2. 都道府県・市区町村・町域の日本語・英語を内部状態にセット
3. 建物名・部屋番号・電話番号の入力に応じて英語住所をリアルタイム計算
4. 1行形式および分割形式で結果を表示
5. 各形式ごとにコピー操作を提供

### 2.2.2 画面仕様（モバイル前提）

**画面: `/` トップ**

1. 固定ヘッダー（sticky top）

    * 左: サービス名 `INSTANT ADDRESS JP`（極太大文字、Impact系）
    * 右: 現在時刻 or `VERSION YYYYMMDD` のテキスト
    * 下部に1pxの区切り線

2. メインエリア

    * セクション1: INPUT GRID

        * 行1: ラベルバー

            * `"INPUT"` `"ADDRESS"` `"JP"` のようなティッカー風のラベルを大文字・密なトラッキングで表示
        * 行2: 郵便番号入力

            * shadcn Inputだが、クラスで角丸削除・背景白・枠線黒
            * ラベルは上部左揃え、極太小さめ大文字 `ZIP`
            * プレースホルダは半角数字例のみ
        * 行3: 建物名・部屋番号入力

            * ラベル `BUILDING / ROOM`
        * 行4: 電話番号入力（任意）

            * ラベル `PHONE (OPTIONAL)`

    * セクション2: JP ADDRESS VIEW

        * ラベル `JP ADDRESS`
        * 都道府県・市区町村・町域を3行で表示
        * 各行は左にカテゴリ名（PREF / CITY / TOWN）、右に値

3. 固定フッター（sticky bottom）

    * 上段: 英語住所1行表示

        * テキストエリア風だが、枠線付きdivで代替可能
        * 右端に `[COPY]` ボタン
    * 下段: 分割フィールド

        * Line1, Line2, CITY, STATE, ZIP, COUNTRY をグリッドで表示
        * 各セルにコピーアイコンまたはテキスト `[COPY]`
    * 全体に太めの境界線を引き、画面下部に貼り付き

### 2.2.3 バリデーション仕様（zod）

**フロントフォームスキーマ**

```ts
const AddressFormSchema = z.object({
    mode: z.literal("zipcode"),

    zip: z
        .string()
        .min(3, "3桁以上入力してください")
        .max(8, "8文字以内で入力してください")
        .transform((v) => v.replace(/\D/g, ""))
        .refine(
            (v) => v.length >= 3 && v.length <= 7,
            "郵便番号は3〜7桁の数字で入力してください"
        ),

    building: z
        .string()
        .max(100, "100文字以内で入力してください")
        .optional()
        .or(z.literal("")),

    phone: z
        .string()
        .optional()
        .or(z.literal(""))
        .transform((v) => v.replace(/\D/g, ""))
        .refine(
            (v) => v.length === 0 || (v.length >= 8 && v.length <= 11),
            "電話番号は8〜11桁の数字で入力してください"
        ),
});
```

* バリデーションタイミング

    * `mode` `zip`: onChange & onBlur
    * `building` `phone`: onBlur中心、onChangeではエラーメッセージを控えめに

**API入力スキーマ**

```ts
const PostalLookupQuerySchema = z.object({
    zip: z
        .string()
        .transform((v) => v.replace(/\D/g, ""))
        .refine((v) => v.length === 7, "zip must be 7 digits"),
});
```

### 2.2.4 非機能仕様

* レイテンシ

    * prefix JSONがキャッシュ済みの状態では、英語住所更新はDOM描画のみ
    * 未キャッシュprefixに対する初回fetchも100〜200ms以内を目標
* 可用性

    * GitHub Actionsが失敗しても、前回コミット済みのJSONで動作する
* スケーラビリティ

    * 静的ファイル配信 + Vercelのオートスケールに依存

---

# 3. 設計書

## 3.1 全体アーキテクチャ

1. GitHub Actionsバッチ

    * 日本郵便公式サイトから郵便番号CSV・ローマ字CSVを取得
    * Nodeスクリプトでパースし、`public/postal/prefix-XXX.json` に変換
    * mainブランチにコミット
2. Next.jsアプリ（Vercel）

    * フロント: Brutalist UIでフォームと結果表示
    * API Route: `/api/postal`（必要なら）
    * 静的JSON: `public/postal/*.json` として配信

## 3.2 データフロー

1. 日本郵便CSV → GitHub Actions

    * スケジュール: 毎日JST深夜
    * 手順:

        1. CSV ZIPファイルをダウンロード
        2. 解凍・文字コード変換
        3. 住所の郵便番号CSVとローマ字CSVをjoin
        4. 郵便番号7桁をキーにしたオブジェクトを生成
        5. 先頭3桁でグルーピングしてprefix JSONを生成

2. prefix JSON → Next.js

    * ビルド時に `public/postal` 配下としてデプロイ
    * ランタイムではフロント側から `fetch('/postal/prefix-100.json')` でアクセス

3. フロント

    * 郵便番号入力 watch → prefixロード → メモリキャッシュ
    * 7桁確定時にオブジェクトから1レコード取得
    * building・phoneと組み合わせて英語住所計算

## 3.3 データ設計

### 3.3.1 prefix JSONスキーマ

ファイル: `public/postal/prefix-XYZ.json`

```json
{
  "1000001": {
    "prefectureJa": "東京都",
    "cityJa": "千代田区",
    "townJa": "千代田",
    "prefectureEn": "TOKYO",
    "cityEn": "CHIYODA-KU",
    "townEn": "CHIYODA"
  },
  "1000002": {
    "prefectureJa": "東京都",
    "cityJa": "千代田区",
    "townJa": "皇居外苑",
    "prefectureEn": "TOKYO",
    "cityEn": "CHIYODA-KU",
    "townEn": "KOKYO GAIEN"
  }
}
```

* 英語表記は初期から大文字にしておくとBrutalistな雰囲気と合う
* 将来、Camel Case版を追加する場合は別フィールドを追加

### 3.3.2 内部型定義（概念）

```ts
type PostalEntry = {
    prefectureJa: string;
    cityJa: string;
    townJa: string;
    prefectureEn: string;
    cityEn: string;
    townEn: string;
};

type PostalPrefixMap = Record<string, PostalEntry>;
```

## 3.4 Next.js アプリ設計

### 3.4.1 ディレクトリ構成案

```text
app/
  layout.tsx
  page.tsx
  api/
    postal/
      route.ts        // 必要ならサーバー経由でJSONを返す

src/
  components/
    address-form.tsx
    address-preview.tsx
    layout-shell.tsx  // stickyヘッダー・フッター含むラッパー
  lib/
    compose-address.ts
    phone.ts
    postal-cache.ts   // prefix JSONのクライアントキャッシュ
  schemas/
    form.ts
    api.ts

public/
  postal/
    prefix-100.json
    prefix-101.json
    ...
```

### 3.4.2 コンポーネント概要

* `<LayoutShell>`

    * 全画面共通レイアウト
    * stickyヘッダー・stickyフッターを持つ
    * 背景白、テキスト黒、1px borderでグリッド分割

* `<AddressForm>`

    * React Hook Form + zodResolverを使用
    * zipフィールドをwatchし、prefixロードをトリガ
    * prefix JSONとzip7桁から`selectedAddress`を決定して上位に渡す

* `<AddressPreview>`

    * props: `baseAddress`, `building`, `phone`
    * `composeAddress`で1行/分割/phoneの各形式を生成し表示
    * Brutalistなグリッドレイアウトで各フィールドを表示

## 3.5 UI設計詳細（Brutalist Minimalism反映）

### 3.5.1 カラーパレット

* `--bg`: #ffffff
* `--fg-primary`: #000000
* `--fg-secondary`: #333333
* `--border`: #000000
* 状態色（エラーなど）も基本はモノクロの濃淡で表現
  必要であればアクセントに1色だけ（例えば赤 #ff0000）を使用するが、初期はモノクロで統一

### 3.5.2 タイポグラフィ

* ベースフォント
  `font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;`
* 見出し
  `font-family: "Impact", "Anton", system-ui, sans-serif;`
* 文字スタイル

    * ラベルや見出しはすべて大文字
    * トラッキングはやや広め
    * 行間は詰め気味

### 3.5.3 レイアウト・コンポーネントスタイル

* 角丸

    * `rounded-none` を徹底
* 影

    * `shadow-none`
* Input / Button

    * `border border-black`
    * `bg-white`
    * `text-black`
    * `focus`時は枠線を太くする程度で、色は変えない
* グリッド

    * メイン領域を`grid`で構成し、セクションを上下に積む
    * 各セクション間は1pxのボーダー

### 3.5.4 sticky要素

* ヘッダー

    * `position: sticky; top: 0; z-index` 高め
    * 背景白、下に 2px border 黒
* フッター

    * `position: sticky; bottom: 0; z-index` 高め
    * 英語住所結果を常に画面下部に表示
    * スクロールしても結果が常に見える

## 3.6 英語住所組み立てロジック

### 3.6.1 入力

* `baseAddress: { zip, prefectureEn, cityEn, townEn }`
* `building: string`
* `phone: string`（数字のみ）

### 3.6.2 出力

* `singleLine`
* `line1`
* `line2`
* `city`
* `state`
* `zip`
* `country`
* `phoneIntl`（`+81`形式、任意）

### 3.6.3 ルール

* zipは `NNN-NNNN` に整形
* buildingがある場合

    * `line1 = building`
* townのブロック番号は当面CSVから取得せず、ユーザーに任せる
  （将来、別カラムを導入する余地を残す）
* line2は `"{TOWN}, {CITY}, {PREF}"`
  すべて大文字
* countryは常に `JAPAN`
* phoneがある場合

    * 先頭0を削除して `+81-<残り>` に変換

---

この3本をベースにすれば、すぐに実装フェーズに入れるはずです。

* まずは

    * GitHub ActionsでCSV → prefix JSONを作るスクリプト
    * `public/postal` を参照する簡単な `/api/postal` と `page.tsx`
* その後

    * BrutalistなUI調整
    * リアルタイム変換の細かいUX

