import { useState, useEffect } from 'react';
import './App.css';
import { FileSelector, ImageDisplay } from './components';
import { SUPPORTED_IMAGE_FORMATS } from './types/image';

/**
 * メインアプリケーションコンポーネント
 * 画像選択と表示機能の統合
 */
function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setIsLoading(false);
      console.log('Selected file:', file);
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
        
        <div style={{ marginBottom: '2rem' }}>
          <ImageDisplay 
            imageUrl={imageUrl}
            isLoading={isLoading}
            error={error}
            maxWidth={900}
            maxHeight={700}
            alt={selectedFile ? selectedFile.name : undefined}
          />
        </div>
        
        {selectedFile && (
          <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h3>ファイル情報:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>名前:</strong> {selectedFile.name}
              </div>
              <div>
                <strong>サイズ:</strong> {Math.round(selectedFile.size / 1024)} KB
              </div>
              <div>
                <strong>タイプ:</strong> {selectedFile.type}
              </div>
              <div>
                <strong>最終更新:</strong> {new Date(selectedFile.lastModified).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;