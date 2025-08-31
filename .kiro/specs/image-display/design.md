# 設計書

## 概要

画像表示機能は、ユーザーが選択した画像ファイルを読み込み、適切にスケーリングして表示するコンポーネントベースのシステムです。React/TypeScriptを使用したモダンなWebアプリケーションアーキテクチャを採用し、再利用可能で保守性の高い設計を目指します。

## アーキテクチャ

### 全体構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FileSelector  │───▶│  ImageDisplay   │───▶│  ImageInfo      │
│   Component     │    │   Component     │    │   Component     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FileService    │    │  ImageService   │    │  MetadataService│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### レイヤー構成
- **プレゼンテーション層**: UIコンポーネント（FileSelector, ImageDisplay, ImageInfo）
- **サービス層**: ビジネスロジック（FileService, ImageService, MetadataService）
- **ユーティリティ層**: 共通機能（画像処理、エラーハンドリング）

## コンポーネントとインターフェース

### 1. FileSelector Component
**責務**: ファイル選択UIの提供
```typescript
interface FileSelectorProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  disabled?: boolean;
}
```

### 2. ImageDisplay Component
**責務**: 画像の表示とスケーリング
```typescript
interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  maxWidth?: number;
  maxHeight?: number;
}
```

### 3. ImageInfo Component
**責務**: 画像メタデータの表示
```typescript
interface ImageInfoProps {
  metadata: ImageMetadata | null;
}
```

### 4. FileService
**責務**: ファイル操作とバリデーション
```typescript
interface FileService {
  validateImageFile(file: File): Promise<boolean>;
  createImageUrl(file: File): string;
  revokeImageUrl(url: string): void;
}
```

### 5. ImageService
**責務**: 画像処理とスケーリング
```typescript
interface ImageService {
  calculateDisplaySize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number };
}
```

### 6. MetadataService
**責務**: 画像メタデータの抽出
```typescript
interface MetadataService {
  extractMetadata(file: File): Promise<ImageMetadata>;
}
```

## データモデル

### ImageMetadata
```typescript
interface ImageMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  width: number;
  height: number;
  lastModified: Date;
}
```

### ImageDisplayState
```typescript
interface ImageDisplayState {
  selectedFile: File | null;
  imageUrl: string | null;
  metadata: ImageMetadata | null;
  isLoading: boolean;
  error: string | null;
}
```

## エラーハンドリング

### エラータイプ
1. **ファイル形式エラー**: サポートされていない形式
2. **ファイル読み込みエラー**: ファイルが存在しない、アクセス権限なし
3. **画像処理エラー**: 破損した画像ファイル
4. **メモリエラー**: 大きすぎる画像ファイル

### エラー表示戦略
- ユーザーフレンドリーなエラーメッセージ
- エラー状態の視覚的な表示
- エラーからの回復オプション提供

## テスト戦略

### 単体テスト
- 各サービスクラスの機能テスト
- コンポーネントの描画テスト
- エラーハンドリングのテスト

### 統合テスト
- ファイル選択から画像表示までの一連の流れ
- 異なる画像形式での動作確認
- エラーケースでの動作確認

### E2Eテスト
- ユーザーの実際の操作フローのテスト
- ブラウザ間での互換性テスト

## パフォーマンス考慮事項

### 最適化戦略
1. **遅延読み込み**: 大きな画像の段階的読み込み
2. **メモリ管理**: 不要なImageURLの適切な解放
3. **キャッシュ**: 一度読み込んだ画像の再利用
4. **プログレッシブ表示**: 画像の段階的表示

### 制限事項
- 最大ファイルサイズ: 50MB
- 同時表示可能画像数: 1枚
- サポート解像度: 最大8K (7680×4320)