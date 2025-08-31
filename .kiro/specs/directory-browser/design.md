# デザイン文書

## 概要

ImageManagerアプリケーションに左ペインのディレクトリブラウザ機能を追加します。この機能により、ユーザーはディレクトリを選択し、そのディレクトリ内の画像ファイル一覧を表示し、ファイルを選択して画像を表示できるようになります。既存のファイル選択機能と統合し、より効率的な画像管理体験を提供します。

## アーキテクチャ

### 全体構成

```
App.tsx (メインコンテナ)
├── DirectoryBrowser (新規: 左ペイン)
│   ├── DirectorySelector (新規: ディレクトリ選択)
│   ├── ImageFileList (新規: 画像ファイル一覧)
│   └── CollapsiblePanel (新規: 折りたたみ機能)
├── ImageDisplay (既存: メイン表示エリア)
├── ImageInfo (既存: 画像情報パネル)
└── 既存コンポーネント群
```

### レイアウト構造

```
┌─────────────────────────────────────────────────────────┐
│ App Container                                           │
├─────────────┬───────────────────────────────────────────┤
│ Directory   │ Main Content Area                         │
│ Browser     │ ┌─────────────────────────────────────┐   │
│ (Left Pane) │ │ ImageDisplay                        │   │
│             │ │                                     │   │
│ [Dir Select]│ │                                     │   │
│ ┌─────────┐ │ │                                     │   │
│ │ File 1  │ │ │                                     │   │
│ │ File 2  │ │ │                                     │   │
│ │ File 3  │ │ │                                     │   │
│ └─────────┘ │ └─────────────────────────────────────┘   │
│ [Collapse]  │ ImageInfo (Right Panel)                   │
└─────────────┴───────────────────────────────────────────┘
```

## コンポーネントと インターフェース

### 1. DirectoryBrowser コンポーネント

**責任**: 左ペイン全体の管理と子コンポーネントの統合

```typescript
interface DirectoryBrowserProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

interface DirectoryBrowserState {
  selectedDirectory: string | null;
  imageFiles: ImageFileInfo[];
  isLoading: boolean;
  error: string | null;
}
```

**主要機能**:
- ディレクトリ選択状態の管理
- 画像ファイル一覧の管理
- 折りたたみ状態の管理
- 子コンポーネント間の連携

### 2. DirectorySelector コンポーネント

**責任**: ディレクトリ選択機能

```typescript
interface DirectorySelectorProps {
  onDirectorySelect: (directory: string) => void;
  selectedDirectory: string | null;
  disabled?: boolean;
}
```

**主要機能**:
- ディレクトリ選択ダイアログの表示
- 選択されたディレクトリパスの表示
- ディレクトリ変更の通知

### 3. ImageFileList コンポーネント

**責任**: 画像ファイル一覧の表示と選択

```typescript
interface ImageFileListProps {
  files: ImageFileInfo[];
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  sortBy: SortOption;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void;
}

interface ImageFileInfo {
  file: File;
  name: string;
  size: number;
  lastModified: Date;
  createdDate: Date;
  thumbnailUrl?: string; // 将来の拡張用
}

enum SortOption {
  NAME = 'name',
  CREATED_DATE = 'createdDate'
}

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}
```

**主要機能**:
- 画像ファイル一覧の表示
- ファイル選択状態の視覚的表示
- スクロール可能な一覧表示
- ソート機能（ファイル名、作成日の昇順・降順）
- ソート状態の視覚的表示
- ローディング・エラー状態の表示

### 4. CollapsiblePanel コンポーネント

**責任**: 汎用的な折りたたみ機能

```typescript
interface CollapsiblePanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  collapseDirection?: 'left' | 'right';
}
```

**主要機能**:
- 折りたたみ/展開アニメーション
- 折りたたみボタンの表示
- アクセシビリティ対応

### 5. DirectoryService (新規サービス)

**責任**: ディレクトリ操作とファイル検索

```typescript
interface IDirectoryService {
  selectDirectory(): Promise<string | null>;
  getImageFiles(directoryPath: string): Promise<ImageFileInfo[]>;
  watchDirectory(directoryPath: string, callback: (files: ImageFileInfo[]) => void): void;
  unwatchDirectory(directoryPath: string): void;
}
```

**主要機能**:
- ディレクトリ選択ダイアログの表示
- 指定ディレクトリ内の画像ファイル検索
- ファイル変更の監視（将来の拡張用）

## データモデル

### DirectoryBrowserState

```typescript
interface DirectoryBrowserState {
  selectedDirectory: string | null;
  imageFiles: ImageFileInfo[];
  selectedFileIndex: number | null;
  isLoading: boolean;
  error: string | null;
  isCollapsed: boolean;
  sortBy: SortOption;
  sortOrder: SortOrder;
}
```

### ImageFileInfo

```typescript
interface ImageFileInfo {
  file: File;
  name: string;
  size: number;
  lastModified: Date;
  createdDate: Date;
  path: string;
  thumbnailUrl?: string; // 将来の拡張用
}
```

### DirectoryBrowserConfig

```typescript
interface DirectoryBrowserConfig {
  maxFiles: number; // 一度に表示する最大ファイル数
  supportedFormats: string[]; // サポートする画像形式
  defaultWidth: number; // デフォルトの左ペイン幅
  minWidth: number; // 最小幅
  maxWidth: number; // 最大幅
}
```

## エラーハンドリング

### エラータイプ定義

```typescript
enum DirectoryBrowserErrorType {
  DIRECTORY_ACCESS_DENIED = 'DIRECTORY_ACCESS_DENIED',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  FILE_SCAN_FAILED = 'FILE_SCAN_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED'
}
```

### エラーハンドリング戦略

1. **ディレクトリアクセスエラー**: ユーザーフレンドリーなメッセージで権限エラーを説明
2. **ファイルスキャンエラー**: 部分的な結果を表示し、エラーファイルをスキップ
3. **ブラウザサポートエラー**: 代替手段（従来のファイル選択）を提案
4. **権限エラー**: 適切な権限設定の案内を表示

### エラー表示コンポーネント

```typescript
interface DirectoryBrowserErrorProps {
  error: DirectoryBrowserErrorType;
  message: string;
  onRetry?: () => void;
  onFallback?: () => void; // 従来のファイル選択に戻る
}
```

## テスト戦略

### 単体テスト

1. **DirectoryBrowser**: 状態管理とイベントハンドリング
2. **DirectorySelector**: ディレクトリ選択ダイアログの動作
3. **ImageFileList**: ファイル一覧表示とファイル選択
4. **CollapsiblePanel**: 折りたたみ機能とアニメーション
5. **DirectoryService**: ディレクトリ操作とファイル検索

### 統合テスト

1. **ディレクトリ選択フロー**: ディレクトリ選択からファイル一覧表示まで
2. **ファイル選択フロー**: ファイル選択から画像表示まで
3. **折りたたみ機能**: 左ペインの折りたたみと展開
4. **レスポンシブ対応**: 異なる画面サイズでの動作

### E2Eテスト

1. **完全なワークフロー**: ディレクトリ選択→ファイル選択→画像表示
2. **エラーシナリオ**: 権限エラー、ファイルアクセスエラー
3. **レスポンシブテスト**: モバイル、タブレット、デスクトップでの動作

## レスポンシブデザイン

### ブレークポイント

```css
/* モバイル: 768px以下 */
@media (max-width: 768px) {
  .directory-browser {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .directory-browser--expanded {
    transform: translateX(0);
  }
}

/* タブレット: 769px - 1024px */
@media (min-width: 769px) and (max-width: 1024px) {
  .directory-browser {
    width: 300px;
    min-width: 250px;
  }
}

/* デスクトップ: 1025px以上 */
@media (min-width: 1025px) {
  .directory-browser {
    width: 350px;
    min-width: 300px;
    max-width: 500px;
  }
}
```

### レスポンシブ動作

1. **モバイル (768px以下)**:
   - 左ペインはオーバーレイ表示
   - デフォルトで折りたたまれた状態
   - フルスクリーン表示

2. **タブレット (769px - 1024px)**:
   - 左ペインは固定表示
   - 幅は300px固定
   - 折りたたみ可能

3. **デスクトップ (1025px以上)**:
   - 左ペインは固定表示
   - 幅は350px（リサイズ可能）
   - 折りたたみ可能

## パフォーマンス考慮事項

### 最適化戦略

1. **仮想スクロール**: 大量のファイルがある場合の一覧表示最適化
2. **遅延読み込み**: ファイル情報の段階的読み込み
3. **メモ化**: ファイル一覧の不要な再計算を防止
4. **デバウンス**: ディレクトリ変更時の過度なAPI呼び出しを防止

### メモリ管理

1. **ファイルオブジェクトの適切な解放**
2. **サムネイル画像のキャッシュ管理**
3. **イベントリスナーのクリーンアップ**

## アクセシビリティ

### WCAG 2.1 AA準拠

1. **キーボードナビゲーション**: Tab、Enter、Arrow キーでの操作
2. **スクリーンリーダー対応**: 適切なARIAラベルとロール
3. **フォーカス管理**: 視覚的なフォーカスインジケーター
4. **色覚対応**: 色だけに依存しない情報伝達

### ARIA属性

```typescript
// DirectoryBrowser
<div 
  role="navigation" 
  aria-label="ディレクトリブラウザ"
  aria-expanded={!isCollapsed}
>

// ImageFileList
<ul 
  role="listbox" 
  aria-label="画像ファイル一覧"
  aria-activedescendant={selectedFileId}
>

// CollapsiblePanel
<button
  aria-expanded={!isCollapsed}
  aria-controls="directory-browser-content"
  aria-label="ディレクトリブラウザを折りたたむ"
>
```

## 既存システムとの統合

### App.tsx の変更

```typescript
// 新しい状態管理
const [directoryBrowserState, setDirectoryBrowserState] = useState<DirectoryBrowserState>({
  selectedDirectory: null,
  imageFiles: [],
  selectedFileIndex: null,
  isLoading: false,
  error: null,
  isCollapsed: false
});

// 既存のhandleFileSelectとの統合
const handleDirectoryFileSelect = (file: File) => {
  // 既存のhandleFileSelectを呼び出し
  handleFileSelect(file);
};
```

### CSS Grid レイアウト

```css
.App-main--with-directory-browser {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: "directory main info";
  height: 100vh;
}

.directory-browser {
  grid-area: directory;
}

.App-image-container {
  grid-area: main;
}

.App-image-info {
  grid-area: info;
}
```

## セキュリティ考慮事項

### ファイルアクセス制限

1. **サンドボックス化**: ブラウザのファイルアクセス制限に準拠
2. **パス検証**: ディレクトリトラバーサル攻撃の防止
3. **ファイル形式検証**: 画像ファイル以外のアクセス制限

### プライバシー保護

1. **ローカル処理**: ファイル情報の外部送信なし
2. **メモリクリーンアップ**: 機密情報の適切な削除
3. **一時ファイル管理**: 一時的なURLの適切な解放