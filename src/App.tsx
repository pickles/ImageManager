import { useState, useEffect } from 'react';
import './App.css';
import { 
  FileSelector, 
  ImageDisplay, 
  ImageInfo, 
  LoadingIndicator, 
  ErrorDisplay 
} from './components';
import { SUPPORTED_IMAGE_FORMATS, ImageMetadata, ImageDisplayState } from './types/image';

/**
 * メインアプリケーションコンポーネント
 * 全UIコンポーネントの統合と基本的な状態管理を実装
 * 要件 1.1, 5.1, 5.2 に対応
 */
function App() {
  // ImageDisplayState型に基づく状態管理
  const [appState, setAppState] = useState<ImageDisplayState>({
    selectedFile: null,
    imageUrl: null,
    metadata: null,
    isLoading: false,
    error: null
  });

  // ウィンドウサイズ変更を追跡するための状態
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 右ペインの折りたたみ状態
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false);

  // ドラッグオーバー状態
  const [isDragOver, setIsDragOver] = useState(false);

  // 個別の状態も保持（既存のコンポーネントとの互換性のため）
  const { selectedFile, imageUrl, metadata, isLoading, error } = appState;

  /**
   * ファイル選択時のハンドラー
   * 要件 1.1, 5.1, 5.2 に対応
   */
  const handleFileSelect = (file: File) => {
    // 状態をリセットしてローディング開始
    setAppState(prev => ({
      ...prev,
      selectedFile: file,
      error: null,
      isLoading: true,
      imageUrl: null,
      metadata: null
    }));

    // ファイル形式の検証
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
      setAppState(prev => ({
        ...prev,
        error: `サポートされていないファイル形式です: ${file.type}`,
        isLoading: false
      }));
      return;
    }

    // 画像URLの作成
    try {
      const url = URL.createObjectURL(file);
      
      // 画像メタデータの作成（モックデータとして実装）
      const img = new Image();
      img.onload = () => {
        const imageMetadata: ImageMetadata = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          width: img.width,
          height: img.height,
          lastModified: new Date(file.lastModified)
        };
        
        setAppState(prev => ({
          ...prev,
          imageUrl: url,
          metadata: imageMetadata,
          isLoading: false
        }));
        
        console.log('Selected file:', file, 'Metadata:', imageMetadata);
      };
      
      img.onerror = () => {
        setAppState(prev => ({
          ...prev,
          error: '画像の読み込みに失敗しました',
          isLoading: false
        }));
        URL.revokeObjectURL(url); // エラー時はURLを解放
      };
      
      img.src = url;
    } catch (err) {
      setAppState(prev => ({
        ...prev,
        error: '画像の読み込みに失敗しました',
        isLoading: false
      }));
      console.error('Error creating image URL:', err);
    }
  };

  /**
   * エラーをクリアするハンドラー
   */
  const handleErrorClear = () => {
    setAppState(prev => ({
      ...prev,
      error: null
    }));
  };

  /**
   * 再試行ハンドラー
   */
  const handleRetry = () => {
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  /**
   * ドラッグオーバーハンドラー
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  /**
   * ドラッグリーブハンドラー
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ドラッグがアプリケーション外に出た場合のみドラッグオーバー状態を解除
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  /**
   * ドロップハンドラー
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // 既存の画像URLをクリーンアップ
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      handleFileSelect(imageFile);
    }
  };

  // ウィンドウリサイズイベントの監視（デバウンス付き）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // 前のタイマーをクリア
      clearTimeout(timeoutId);
      
      // 100ms後にサイズを更新（デバウンス）
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 100);
    };

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', handleResize);

    // クリーンアップ関数でイベントリスナーとタイマーを削除
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // クリーンアップ: コンポーネントがアンマウントされる際にURLを解放
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // ウィンドウサイズに基づく画像の最大サイズを計算（windowSizeに依存）
  const getImageMaxSize = () => {
    const { width: windowWidth, height: windowHeight } = windowSize;
    
    // サイドバーとパディングを考慮した計算
    // 折りたたまれている場合はサイドバー幅を0にする
    const sidebarWidth = (windowWidth > 1024 && !isInfoPanelCollapsed) ? 400 : 0;
    const padding = windowWidth > 768 ? 32 : 16; // パディング（border含む）
    const infoHeight = (windowWidth <= 1024 && !isInfoPanelCollapsed) ? 300 : 0; // モバイルでは情報セクションの高さを考慮
    
    const maxWidth = windowWidth - sidebarWidth - padding;
    const maxHeight = windowHeight - infoHeight - padding;
    
    return {
      maxWidth: Math.max(300, Math.floor(maxWidth)),
      maxHeight: Math.max(200, Math.floor(maxHeight))
    };
  };

  const { maxWidth: imageMaxWidth, maxHeight: imageMaxHeight } = getImageMaxSize();

  return (
    <div 
      className={`App ${isDragOver ? 'App--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ドラッグオーバー時のオーバーレイ */}
      {isDragOver && (
        <div className="App-drag-overlay">
          <div className="App-drag-message">
            <div className="App-drag-icon">📁</div>
            <h2>画像ファイルをドロップしてください</h2>
            <p>JPEG, PNG, GIF, WebP形式に対応</p>
          </div>
        </div>
      )}

      {/* 画像が選択されていない場合：ファイル選択画面 */}
      {!selectedFile && !isLoading && (
        <main className="App-main App-main--file-selector">
          <div className="App-file-selector-container">
            <FileSelector 
              onFileSelect={handleFileSelect}
              disabled={isLoading}
            />
          </div>
        </main>
      )}

      {/* ローディング状態 */}
      {isLoading && (
        <main className="App-main App-main--loading">
          <div className="App-loading-container">
            <LoadingIndicator
              isVisible={isLoading}
              message="画像を読み込み中..."
              size="large"
            />
          </div>
        </main>
      )}

      {/* エラー状態 */}
      {error && (
        <main className="App-main App-main--error">
          <div className="App-error-container">
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onClear={handleErrorClear}
              showRetry={!!selectedFile}
            />
          </div>
        </main>
      )}

      {/* 画像が選択されている場合：画像表示画面 */}
      {selectedFile && imageUrl && !isLoading && !error && (
        <main className="App-main App-main--image-view">
          <div className={`App-image-container ${isInfoPanelCollapsed ? 'App-image-container--collapsed' : ''}`}>
            <div className="App-image-display">
              <ImageDisplay 
                imageUrl={imageUrl}
                isLoading={isLoading}
                error={error}
                maxWidth={imageMaxWidth}
                maxHeight={imageMaxHeight}
                alt={selectedFile.name}
              />
              
              {/* 折りたたみトグルボタン */}
              <button 
                className={`App-info-toggle ${isInfoPanelCollapsed ? 'App-info-toggle--collapsed' : ''}`}
                onClick={() => setIsInfoPanelCollapsed(!isInfoPanelCollapsed)}
                aria-expanded={!isInfoPanelCollapsed}
                aria-controls="image-info-panel"
                title={isInfoPanelCollapsed ? '画像情報を表示' : '画像情報を非表示'}
              >
                <span className="App-info-toggle-icon">
                  {isInfoPanelCollapsed ? '◀' : '▶'}
                </span>
              </button>
            </div>
            
            {!isInfoPanelCollapsed && (
              <div className="App-image-info" id="image-info-panel">
                <ImageInfo metadata={metadata} />
                <button 
                  className="App-new-image-button"
                  onClick={() => setAppState({
                    selectedFile: null,
                    imageUrl: null,
                    metadata: null,
                    isLoading: false,
                    error: null
                  })}
                >
                  新しい画像を選択
                </button>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;