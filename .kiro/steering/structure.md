# プロジェクト構造

## ルートディレクトリ構成
```
ImageManager/
├── src/                    # ソースコード
│   ├── components/         # UIコンポーネント
│   ├── services/          # ビジネスロジック層
│   ├── types/             # TypeScript型定義
│   ├── utils/             # ユーティリティ関数
│   ├── test/              # テスト設定
│   ├── assets/            # 静的アセット
│   ├── App.tsx            # メインアプリケーションコンポーネント
│   ├── main.tsx           # エントリーポイント
│   └── index.css          # グローバルスタイル
├── .kiro/                 # Kiro設定とSpec
│   ├── steering/          # ステアリングファイル
│   └── specs/             # 機能仕様書
├── dist/                  # ビルド出力（生成される）
├── node_modules/          # 依存関係（生成される）
├── package.json           # プロジェクト設定
├── tsconfig.json          # TypeScript設定
├── vite.config.ts         # Vite設定
└── index.html             # HTMLテンプレート
```

## ソースコード構成
- **components/**: 機能別に整理された再利用可能なUIコンポーネント（FileSelector, ImageDisplay, ImageInfo等）
- **services/**: ビジネスロジック層（FileService, ImageService, MetadataService）
- **types/**: TypeScriptインターフェースと型定義（image.ts, services.ts, components.ts）
- **utils/**: 共通操作のためのヘルパー関数とユーティリティ
- **assets/**: 静的リソース（アイコン、デフォルト画像等）
- **test/**: テスト設定とテストユーティリティ

## 命名規則
- コンポーネントファイルとクラスにはPascalCaseを使用
- 関数と変数にはcamelCaseを使用
- 適切な場合はファイル名にkebab-caseを使用
- 目的を明確に示す説明的な名前を使用

## ファイル構成の原則
- 関連する機能をまとめてグループ化
- コンポーネントは集中的で単一目的に保つ
- ビジネスロジックをUIコンポーネントから分離
- データモデルとプレゼンテーションの明確な分離を維持
- クリーンなインポートのためにindexファイルを使用

## 設定
- **Vite設定**: vite.config.ts（開発サーバー、ビルド設定）
- **TypeScript設定**: tsconfig.json（型チェック、コンパイル設定）
- **テスト設定**: src/test/setup.ts（Vitestテスト環境設定）
- **ESLint設定**: .eslintrc（コード品質設定）
- **環境変数**: 必要に応じて.env.localファイルで管理