/**
 * DirectoryService - ディレクトリ操作とファイル検索を担当するサービス
 * 要件1.3, 2.1, 2.2, 2.3に対応
 */

import { ImageFileInfo } from '../components/DirectoryBrowser/types';

// DirectoryService インターフェース
export interface IDirectoryService {
  /**
   * ディレクトリ選択ダイアログを表示
   * @returns 選択されたディレクトリパス、キャンセルされた場合はnull
   */
  selectDirectory(): Promise<string | null>;

  /**
   * 指定ディレクトリ内の画像ファイルを取得
   * @param directoryPath ディレクトリパス
   * @returns 画像ファイル情報の配列
   */
  getImageFiles(directoryPath: string): Promise<ImageFileInfo[]>;

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
}

// DirectoryService の基本実装（後のタスクで詳細実装）
export class DirectoryService implements IDirectoryService {
  private readonly _supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  async selectDirectory(): Promise<string | null> {
    // File System Access API を使用した実装（後のタスクで実装）
    throw new Error('Not implemented yet');
  }

  async getImageFiles(_directoryPath: string): Promise<ImageFileInfo[]> {
    // ディレクトリ内の画像ファイル検索実装（後のタスクで実装）
    throw new Error('Not implemented yet');
  }

  watchDirectory(_directoryPath: string, _callback: (files: ImageFileInfo[]) => void): void {
    // ディレクトリ監視実装（将来の拡張用）
    throw new Error('Not implemented yet');
  }

  unwatchDirectory(_directoryPath: string): void {
    // ディレクトリ監視停止実装（将来の拡張用）
    throw new Error('Not implemented yet');
  }
}