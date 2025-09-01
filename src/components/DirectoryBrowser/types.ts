/**
 * DirectoryBrowser関連の型定義
 * 要件1.1, 2.1, 6.1に対応
 */

// ソートオプション（要件6.1）
export enum SortOption {
  NAME = 'name',
  CREATED_DATE = 'createdDate'
}

// ソート順序（要件6.1）
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// 画像ファイル情報（要件2.1）
export interface ImageFileInfo {
  file: File;
  name: string;
  size: number;
  lastModified: Date;
  createdDate: Date;
  path: string;
  thumbnailUrl?: string; // 将来の拡張用
}

// DirectoryBrowser メインコンポーネントのProps（要件1.1）
export interface DirectoryBrowserProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

// DirectoryBrowser の内部状態（要件1.1, 2.1）
export interface DirectoryBrowserState {
  selectedDirectory: string | null;
  imageFiles: ImageFileInfo[];
  selectedFileIndex: number | null;
  isLoading: boolean;
  error: string | null;
  sortBy: SortOption;
  sortOrder: SortOrder;
}

// DirectorySelector コンポーネントのProps（要件1.1）
export interface DirectorySelectorProps {
  onDirectorySelect: (directory: string, directoryHandle: FileSystemDirectoryHandle) => void;
  selectedDirectory: string | null;
  disabled?: boolean;
}

// ImageFileList コンポーネントのProps（要件2.1, 6.1）
export interface ImageFileListProps {
  files: ImageFileInfo[];
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  sortBy: SortOption;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void;
}

// CollapsiblePanel 汎用コンポーネントのProps（要件1.1）
export interface CollapsiblePanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  collapseDirection?: 'left' | 'right';
}

// DirectoryBrowser設定（要件2.1）
export interface DirectoryBrowserConfig {
  maxFiles: number; // 一度に表示する最大ファイル数
  supportedFormats: string[]; // サポートする画像形式
  defaultWidth: number; // デフォルトの左ペイン幅
  minWidth: number; // 最小幅
  maxWidth: number; // 最大幅
}

// エラータイプ定義
export enum DirectoryBrowserErrorType {
  DIRECTORY_ACCESS_DENIED = 'DIRECTORY_ACCESS_DENIED',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  FILE_SCAN_FAILED = 'FILE_SCAN_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED'
}

// DirectoryBrowserError コンポーネントのProps
export interface DirectoryBrowserErrorProps {
  error: DirectoryBrowserErrorType;
  message: string;
  onRetry?: () => void;
  onFallback?: () => void; // 従来のファイル選択に戻る
}