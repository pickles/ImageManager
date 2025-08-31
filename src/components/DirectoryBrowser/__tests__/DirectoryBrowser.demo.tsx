/**
 * DirectoryBrowser デモコンポーネント
 * 開発・テスト用のビジュアル確認コンポーネント
 */

import React, { useState } from 'react';
import DirectoryBrowser from '../DirectoryBrowser';

const DirectoryBrowserDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // 画像のプレビューを作成
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    
    console.log('Selected file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // クリーンアップ
  React.useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      {/* DirectoryBrowser */}
      <DirectoryBrowser
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        className="demo-directory-browser"
      />

      {/* メインコンテンツエリア */}
      <div style={{ 
        flex: 1, 
        padding: '20px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#333' }}>
          DirectoryBrowser デモ
        </h1>

        {selectedFile ? (
          <div style={{ 
            textAlign: 'center',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h2 style={{ color: '#666', marginBottom: '20px' }}>
              選択されたファイル: {selectedFile.name}
            </h2>
            
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <p><strong>ファイル名:</strong> {selectedFile.name}</p>
              <p><strong>サイズ:</strong> {(selectedFile.size / 1024).toFixed(1)} KB</p>
              <p><strong>タイプ:</strong> {selectedFile.type}</p>
              <p><strong>最終更新:</strong> {new Date(selectedFile.lastModified).toLocaleString('ja-JP')}</p>
            </div>

            {selectedImage && (
              <div style={{ 
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#ffffff'
              }}>
                <img
                  src={selectedImage}
                  alt={selectedFile.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center',
            color: '#666',
            fontSize: '18px'
          }}>
            <p>左のディレクトリブラウザからディレクトリを選択し、</p>
            <p>画像ファイルを選択してください。</p>
            
            <div style={{ 
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              textAlign: 'left'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>使用方法:</h3>
              <ol style={{ color: '#666' }}>
                <li>「ディレクトリを選択」ボタンをクリック</li>
                <li>画像ファイルが含まれるフォルダを選択</li>
                <li>表示されたファイル一覧から画像を選択</li>
                <li>ソートボタンでファイル一覧を並び替え可能</li>
                <li>左上のボタンでパネルの折りたたみ/展開が可能</li>
              </ol>
              
              <h3 style={{ color: '#333' }}>対応形式:</h3>
              <p style={{ color: '#666' }}>JPEG, PNG, GIF, WebP</p>
            </div>
          </div>
        )}

        {/* 状態表示 */}
        <div style={{ 
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          パネル: {isCollapsed ? '折りたたみ' : '展開'}
        </div>
      </div>
    </div>
  );
};

export default DirectoryBrowserDemo;