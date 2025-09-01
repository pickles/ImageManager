/**
 * 画像ディレクトリの設定（サンプル）
 * 
 * このファイルをコピーして directories.ts として保存し、
 * 実際の環境に合わせてパスを変更してください。
 */

export interface DirectoryConfig {
  /** 候補ディレクトリのリスト（優先順位順） */
  candidateDirs: string[];
  /** サポートされる画像拡張子 */
  supportedExtensions: string[];
  /** MIMEタイプのマッピング */
  mimeTypes: Record<string, string>;
}

/**
 * デフォルトのディレクトリ設定（サンプル）
 * 
 * 実際の使用時は以下のパスを環境に合わせて変更してください：
 * - Windows: 'C:\\Users\\YourName\\Pictures\\' 
 * - macOS: '/Users/YourName/Pictures/'
 * - Linux: '/home/YourName/Pictures/'
 */
export const defaultDirectoryConfig: DirectoryConfig = {
  candidateDirs: [
    // 実際のパスに変更してください
    'C:\\path\\to\\your\\images\\',
    './test-data/images/',
    './public/images/'
  ],
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  mimeTypes: {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }
};

/**
 * 環境変数から設定を読み込む
 * 
 * 環境変数 IMAGE_DIRS を設定することで、
 * コードを変更せずにディレクトリを指定できます。
 * 
 * 例: IMAGE_DIRS="C:\MyImages;D:\Photos;./test-data/images"
 */
export function loadDirectoryConfig(): DirectoryConfig {
  // 環境変数 IMAGE_DIRS が設定されている場合はそれを使用
  const envDirs = process.env.IMAGE_DIRS?.split(';') || [];
  
  return {
    ...defaultDirectoryConfig,
    candidateDirs: envDirs.length > 0 ? envDirs : defaultDirectoryConfig.candidateDirs
  };
}