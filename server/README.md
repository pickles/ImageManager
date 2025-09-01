# サーバー設定

このディレクトリには、開発環境用のサーバー設定とミドルウェアが含まれています。

## 構成

```
server/
├── middleware/
│   └── imageApi.ts      # 画像API用ミドルウェア
├── config/
│   └── directories.ts   # ディレクトリ設定
└── README.md           # このファイル
```

## 画像APIミドルウェア

### 機能

- **ファイル一覧API**: `/api/images` - 指定ディレクトリ内の画像ファイル一覧を返す
- **個別ファイルAPI**: `/api/images/file/{filename}` - 指定された画像ファイルを返す

### 設定

`server/config/directories.ts` で以下の設定が可能です：

- **candidateDirs**: 検索対象のディレクトリ（優先順位順）
- **supportedExtensions**: サポートする画像拡張子
- **mimeTypes**: ファイル拡張子とMIMEタイプのマッピング

### 環境変数

- **IMAGE_DIRS**: セミコロン区切りでディレクトリパスを指定（例: `D:\images;./test-data/images`）

## セットアップ

### 初回セットアップ

```bash
# 設定ファイルを作成
npm run setup

# 設定ファイルを編集（実際の画像ディレクトリパスに変更）
# server/config/directories.ts を開いて candidateDirs を編集
```

## 使用方法

### 開発環境

```bash
npm run dev
```

### カスタムディレクトリの設定

**方法1: 環境変数を使用（推奨）**

```bash
IMAGE_DIRS="D:\my-images;./custom-images" npm run dev
```

**方法2: 設定ファイルを編集**

`server/config/directories.ts` の `defaultDirectoryConfig.candidateDirs` を編集。

## セキュリティ

- ディレクトリトラバーサル攻撃を防ぐためのパス検証
- 指定されたディレクトリ外のファイルへのアクセスを制限
- サポートされる画像形式のみを提供

## 本番環境

このミドルウェアは開発環境専用です。本番環境では適切な静的ファイルサーバーまたはCDNを使用してください。