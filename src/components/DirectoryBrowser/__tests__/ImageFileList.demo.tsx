import React, { useState } from 'react';
import { ImageFileList } from '../ImageFileList';
import { ImageFileInfo, SortOption, SortOrder } from '../types';

// Demo component to test ImageFileList visually
export const ImageFileListDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.CREATED_DATE);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demo
  const mockFiles: ImageFileInfo[] = [
    {
      file: new File([''], 'vacation-photo-1.jpg', { type: 'image/jpeg' }),
      name: 'vacation-photo-1.jpg',
      size: 2048000,
      lastModified: new Date('2023-12-01T10:30:00'),
      createdDate: new Date('2023-12-01T10:30:00'),
      path: '/demo/vacation-photo-1.jpg'
    },
    {
      file: new File([''], 'family-portrait.png', { type: 'image/png' }),
      name: 'family-portrait.png',
      size: 5120000,
      lastModified: new Date('2023-11-15T14:20:00'),
      createdDate: new Date('2023-11-15T14:20:00'),
      path: '/demo/family-portrait.png'
    },
    {
      file: new File([''], 'sunset-landscape.jpg', { type: 'image/jpeg' }),
      name: 'sunset-landscape.jpg',
      size: 3072000,
      lastModified: new Date('2023-12-05T18:45:00'),
      createdDate: new Date('2023-12-05T18:45:00'),
      path: '/demo/sunset-landscape.jpg'
    },
    {
      file: new File([''], 'pet-cat.gif', { type: 'image/gif' }),
      name: 'pet-cat.gif',
      size: 1024000,
      lastModified: new Date('2023-11-20T09:15:00'),
      createdDate: new Date('2023-11-20T09:15:00'),
      path: '/demo/pet-cat.gif'
    }
  ];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    console.log('Selected file:', file.name);
  };

  const handleSortChange = (newSortBy: SortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    console.log('Sort changed:', newSortBy, newSortOrder);
  };

  const toggleLoading = () => {
    setIsLoading(!isLoading);
  };

  const toggleError = () => {
    setError(error ? null : 'ディレクトリの読み込みに失敗しました');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', height: '600px' }}>
      <h2>ImageFileList Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={toggleLoading} style={{ marginRight: '10px' }}>
          {isLoading ? 'Stop Loading' : 'Show Loading'}
        </button>
        <button onClick={toggleError}>
          {error ? 'Clear Error' : 'Show Error'}
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', height: '500px' }}>
        <ImageFileList
          files={mockFiles}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </div>

      {selectedFile && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <strong>Selected:</strong> {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default ImageFileListDemo;