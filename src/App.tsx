import { useState, useEffect } from 'react';
import './App.css';
import { FileSelector, ImageDisplay, ImageInfo } from './components';
import { SUPPORTED_IMAGE_FORMATS, ImageMetadata } from './types/image';

/**
 * メインアプリケーションコンポーネント
 * 画像選択と表示機能の統合
 */
function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsLoading(true);

    // ファイル形式の検証
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
      setError(`サポートされていないファイル形式です: ${file.type}`);
      setIsLoading(false);
      return;
    }

    // 画像URLの作成
    try {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
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
        setMetadata(imageMetadata);
        setIsLoading(false);
        console.log('Selected file:', file, 'Metadata:', imageMetadata);
      };
      img.onerror = () => {
        setError('画像の読み込みに失敗しました');
        setIsLoading(false);
      };
      img.src = url;
    } catch (err) {
      setError('画像の読み込みに失敗しました');
      setIsLoading(false);
      console.error('Error creating image URL:', err);
    }
  };

  // クリーンアップ: コンポーネントがアンマウントされる際にURLを解放
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Image Manager</h1>
        <p>画像表示機能 - ファイル選択と画像表示</p>
      </header>
      <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <FileSelector onFileSelect={handleFileSelect} />
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <ImageDisplay 
              imageUrl={imageUrl}
              isLoading={isLoading}
              error={error}
              maxWidth={900}
              maxHeight={700}
              alt={selectedFile ? selectedFile.name : undefined}
            />
          </div>
          
          <div style={{ minWidth: '300px' }}>
            <ImageInfo metadata={metadata} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;