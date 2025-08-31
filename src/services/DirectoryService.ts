/**
 * DirectoryService - ディレクトリ操作とファイル検索を担当するサービス
 * 要件1.3, 2.1, 2.2, 2.3に対応
 */

import { ImageFileInfo, DirectoryBrowserErrorType } from '../components/DirectoryBrowser/types';

// File System Access API の型定義（TypeScriptで未定義の場合）
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

// DirectoryService インターフェース
export interface IDirectoryService {
  /**
   * ディレクトリ選択ダイアログを表示
   * @returns 選択されたディレクトリパス、キャンセルされた場合はnull
   */
  selectDirectory(): Promise<string | null>;

  /**
   * 指定ディレクトリ内の画像ファイルを取得
   * @param directoryHandle ディレクトリハンドル
   * @returns 画像ファイル情報の配列
   */
  getImageFiles(directoryHandle: FileSystemDirectoryHandle): Promise<ImageFileInfo[]>;

  /**
   * ディレクトリの変更を監視（将来の拡張用）
   * @param directoryPath 監視するディレクトリパス
   * @param callback ファイル変更時のコールバック
   */
  watchDirectory(directoryPath: string, callback: (files: ImageFileInfo[]) => void): void;

  /**
   * ディレクトリ監視を停止（将来の拡張用）
   * @param directoryPath 監視を停止するディレクトリパス
   */
  unwatchDirectory(directoryPath: string): void;

  /**
   * File System Access API がサポートされているかチェック
   * @returns サポートされている場合はtrue
   */
  isSupported(): boolean;
}

// DirectoryService エラークラス
export class DirectoryServiceError extends Error {
  constructor(
    public readonly type: DirectoryBrowserErrorType,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DirectoryServiceError';
  }
}

// DirectoryService の実装
export class DirectoryService implements IDirectoryService {
  private readonly _supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly _supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  private _directoryHandle: FileSystemDirectoryHandle | null = null;

  /**
   * File System Access API がサポートされているかチェック
   */
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * ディレクトリ選択ダイアログを表示
   */
  async selectDirectory(): Promise<string | null> {
    try {
      // File System Access API のサポートチェック
      if (!this.isSupported()) {
        throw new DirectoryServiceError(
          DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED,
          'お使いのブラウザはディレクトリ選択機能をサポートしていません。Chrome、Edge、またはOpera の最新版をご利用ください。'
        );
      }

      // ディレクトリ選択ダイアログを表示
      this._directoryHandle = await window.showDirectoryPicker!();
      
      return this._directoryHandle.name;
    } catch (error) {
      // DirectoryServiceError はそのまま再スロー
      if (error instanceof DirectoryServiceError) {
        throw error;
      }

      // ユーザーがキャンセルした場合
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      // 権限エラー
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new DirectoryServiceError(
          DirectoryBrowserErrorType.PERMISSION_DENIED,
          'ディレクトリへのアクセス権限が拒否されました。ブラウザの設定を確認してください。',
          error
        );
      }

      // その他のエラー
      throw new DirectoryServiceError(
        DirectoryBrowserErrorType.DIRECTORY_ACCESS_DENIED,
        'ディレクトリの選択中にエラーが発生しました。',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 指定ディレクトリ内の画像ファイルを取得
   */
  async getImageFiles(directoryHandle: FileSystemDirectoryHandle): Promise<ImageFileInfo[]> {
    try {
      const imageFiles: ImageFileInfo[] = [];

      // ディレクトリ内のファイルを再帰的に検索
      await this._scanDirectory(directoryHandle, imageFiles);

      // デフォルトソート: 作成日降順（要件2.5）
      imageFiles.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());

      return imageFiles;
    } catch (error) {
      throw new DirectoryServiceError(
        DirectoryBrowserErrorType.FILE_SCAN_FAILED,
        'ディレクトリ内のファイル検索中にエラーが発生しました。',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * ディレクトリを再帰的にスキャンして画像ファイルを収集
   */
  private async _scanDirectory(
    directoryHandle: FileSystemDirectoryHandle,
    imageFiles: ImageFileInfo[],
    basePath: string = ''
  ): Promise<void> {
    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        const currentPath = basePath ? `${basePath}/${name}` : name;

        if (handle.kind === 'file') {
          // ファイルの場合、画像ファイルかチェック
          if (this._isImageFile(name)) {
            try {
              const file = await handle.getFile();
              
              // 画像ファイル情報を作成
              const imageFileInfo: ImageFileInfo = {
                file,
                name: file.name,
                size: file.size,
                lastModified: new Date(file.lastModified),
                createdDate: new Date(file.lastModified), // File APIでは作成日は取得できないため、更新日を使用
                path: currentPath,
                thumbnailUrl: undefined // 将来の拡張用
              };

              imageFiles.push(imageFileInfo);
            } catch (fileError) {
              // 個別ファイルのエラーはスキップして続行
              console.warn(`ファイル ${currentPath} の読み込みに失敗しました:`, fileError);
            }
          }
        } else if (handle.kind === 'directory') {
          // ディレクトリの場合、再帰的にスキャン
          await this._scanDirectory(handle, imageFiles, currentPath);
        }
      }
    } catch (error) {
      // ルートディレクトリのアクセスエラーは致命的なので再スロー
      if (basePath === '') {
        throw error;
      }
      // サブディレクトリのエラーはログに記録して続行
      console.warn(`ディレクトリ ${basePath} のスキャンに失敗しました:`, error);
    }
  }

  /**
   * ファイル名から画像ファイルかどうかを判定
   */
  private _isImageFile(fileName: string): boolean {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return this._supportedExtensions.includes(extension);
  }

  /**
   * 現在選択されているディレクトリハンドルを取得
   */
  getCurrentDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this._directoryHandle;
  }

  /**
   * ディレクトリの変更を監視（将来の拡張用）
   */
  watchDirectory(_directoryPath: string, _callback: (files: ImageFileInfo[]) => void): void {
    // File System Access API では現在ディレクトリ監視機能は提供されていない
    // 将来的にはPolling や他の手法で実装予定
    throw new DirectoryServiceError(
      DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED,
      'ディレクトリ監視機能は現在サポートされていません。'
    );
  }

  /**
   * ディレクトリ監視を停止（将来の拡張用）
   */
  unwatchDirectory(_directoryPath: string): void {
    // 将来の拡張用
    throw new DirectoryServiceError(
      DirectoryBrowserErrorType.BROWSER_NOT_SUPPORTED,
      'ディレクトリ監視機能は現在サポートされていません。'
    );
  }
}