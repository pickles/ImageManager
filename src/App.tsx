import { useState } from 'react';
import './App.css';
import { FileSelector } from './components';

/**
 * メインアプリケーションコンポーネント
 * FileSelectorコンポーネントのデモ
 */
function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    console.log('Selected file:', file);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Image Manager</h1>
        <p>画像表示機能 - FileSelectorコンポーネント</p>
      </header>
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <FileSelector onFileSelect={handleFileSelect} />
        
        {selectedFile && (
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>選択されたファイル:</h3>
            <p><strong>名前:</strong> {selectedFile.name}</p>
            <p><strong>サイズ:</strong> {Math.round(selectedFile.size / 1024)} KB</p>
            <p><strong>タイプ:</strong> {selectedFile.type}</p>
            <p><strong>最終更新:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;