import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageFileList } from '../ImageFileList';
import { ImageFileInfo, SortOption, SortOrder } from '../types';

// モックデータの作成
const createMockFile = (name: string, size: number, lastModified: number): File => {
  const file = new File([''], name, { 
    type: 'image/jpeg',
    lastModified 
  });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const createMockImageFileInfo = (
  name: string, 
  size: number, 
  createdDate: Date,
  lastModified?: Date
): ImageFileInfo => ({
  file: createMockFile(name, size, createdDate.getTime()),
  name,
  size,
  lastModified: lastModified || createdDate,
  createdDate,
  path: `/mock/path/${name}`,
});

const mockFiles: ImageFileInfo[] = [
  createMockImageFileInfo('image1.jpg', 1024000, new Date('2023-01-01T10:00:00')),
  createMockImageFileInfo('image2.png', 2048000, new Date('2023-01-02T11:00:00')),
  createMockImageFileInfo('image3.gif', 512000, new Date('2023-01-03T12:00:00')),
];

describe('ImageFileList', () => {
  const defaultProps = {
    files: mockFiles,
    selectedFile: null,
    onFileSelect: vi.fn(),
    isLoading: false,
    error: null,
    sortBy: SortOption.CREATED_DATE,
    sortOrder: SortOrder.DESC,
    onSortChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示機能', () => {
    it('ファイル一覧が正しく表示される（要件2.2）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('image2.png')).toBeInTheDocument();
      expect(screen.getByText('image3.gif')).toBeInTheDocument();
    });

    it('ファイル名と作成日が表示される（要件2.4）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      // ファイル名の表示確認
      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      
      // 作成日の表示確認（日本語フォーマット）
      expect(screen.getByText('2023/01/01 10:00')).toBeInTheDocument();
      expect(screen.getByText('2023/01/02 11:00')).toBeInTheDocument();
      expect(screen.getByText('2023/01/03 12:00')).toBeInTheDocument();
    });

    it('ファイルサイズが適切にフォーマットされて表示される', () => {
      render(<ImageFileList {...defaultProps} />);
      
      expect(screen.getByText('1000 KB')).toBeInTheDocument(); // 1024000 bytes
      expect(screen.getByText('2 MB')).toBeInTheDocument(); // 2048000 bytes
      expect(screen.getByText('500 KB')).toBeInTheDocument(); // 512000 bytes
    });
  });

  describe('ソート機能', () => {
    it('ソートヘッダーが表示される（要件6.1）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /ファイル名でソート/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /作成日でソート/ })).toBeInTheDocument();
    });

    it('ファイル名ソートボタンをクリックすると昇順ソートが実行される（要件6.2）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const nameButton = screen.getByRole('button', { name: /ファイル名でソート/ });
      fireEvent.click(nameButton);
      
      expect(defaultProps.onSortChange).toHaveBeenCalledWith(SortOption.NAME, SortOrder.ASC);
    });

    it('同じソートオプションを再度クリックすると順序が反転される（要件6.3）', () => {
      const props = {
        ...defaultProps,
        sortBy: SortOption.NAME,
        sortOrder: SortOrder.ASC,
      };
      
      render(<ImageFileList {...props} />);
      
      const nameButton = screen.getByRole('button', { name: /ファイル名でソート/ });
      fireEvent.click(nameButton);
      
      expect(defaultProps.onSortChange).toHaveBeenCalledWith(SortOption.NAME, SortOrder.DESC);
    });

    it('作成日ソートボタンをクリックすると昇順ソートが実行される（要件6.4）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const dateButton = screen.getByRole('button', { name: /作成日でソート/ });
      fireEvent.click(dateButton);
      
      expect(defaultProps.onSortChange).toHaveBeenCalledWith(SortOption.CREATED_DATE, SortOrder.ASC);
    });

    it('アクティブなソートボタンが視覚的に表示される（要件6.6）', () => {
      const props = {
        ...defaultProps,
        sortBy: SortOption.NAME,
        sortOrder: SortOrder.ASC,
      };
      
      render(<ImageFileList {...props} />);
      
      const nameButton = screen.getByRole('button', { name: /ファイル名でソート/ });
      expect(nameButton).toHaveClass('image-file-list__sort-button--active');
    });

    it('ソート状態のアイコンが正しく表示される（要件6.6）', () => {
      const props = {
        ...defaultProps,
        sortBy: SortOption.NAME,
        sortOrder: SortOrder.ASC,
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.getByRole('button', { name: /ファイル名でソート ↑/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /作成日でソート ↕️/ })).toBeInTheDocument();
    });
  });

  describe('ファイル選択機能', () => {
    it('ファイルをクリックすると選択イベントが発火される（要件3.1）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const fileItem = screen.getByText('image1.jpg').closest('li');
      fireEvent.click(fileItem!);
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0].file);
    });

    it('選択されたファイルが視覚的にハイライトされる（要件3.2）', () => {
      const props = {
        ...defaultProps,
        selectedFile: mockFiles[0].file,
      };
      
      render(<ImageFileList {...props} />);
      
      const selectedItem = screen.getByText('image1.jpg').closest('li');
      expect(selectedItem).toHaveClass('image-file-list__item--selected');
    });

    it('キーボード操作でファイルを選択できる', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const fileItem = screen.getByText('image1.jpg').closest('li');
      fireEvent.keyDown(fileItem!, { key: 'Enter' });
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0].file);
    });

    it('スペースキーでファイルを選択できる', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const fileItem = screen.getByText('image1.jpg').closest('li');
      fireEvent.keyDown(fileItem!, { key: ' ' });
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0].file);
    });
  });

  describe('スクロール可能な一覧表示', () => {
    it('一覧がスクロール可能なコンテナ内に表示される（要件2.5）', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const content = document.querySelector('.image-file-list__content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('image-file-list__content');
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスピナーとメッセージが表示される（要件2.7）', () => {
      const props = {
        ...defaultProps,
        isLoading: true,
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.getByText('ファイルを読み込み中...')).toBeInTheDocument();
      expect(document.querySelector('.image-file-list__loading-spinner')).toBeInTheDocument();
    });

    it('ローディング中はファイル一覧が表示されない', () => {
      const props = {
        ...defaultProps,
        isLoading: true,
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.queryByText('image1.jpg')).not.toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー時はエラーメッセージが表示される（要件2.7）', () => {
      const props = {
        ...defaultProps,
        error: 'ディレクトリの読み込みに失敗しました',
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.getByText('ディレクトリの読み込みに失敗しました')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('エラー時はファイル一覧が表示されない', () => {
      const props = {
        ...defaultProps,
        error: 'エラーが発生しました',
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.queryByText('image1.jpg')).not.toBeInTheDocument();
    });
  });

  describe('空状態', () => {
    it('ファイルが存在しない場合は空状態メッセージが表示される（要件2.7）', () => {
      const props = {
        ...defaultProps,
        files: [],
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.getByText('画像ファイルが見つかりません')).toBeInTheDocument();
      expect(screen.getByText('📁')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(<ImageFileList {...defaultProps} />);
      
      const list = screen.getByRole('listbox');
      expect(list).toHaveAttribute('aria-label', '画像ファイル一覧');
      
      const items = screen.getAllByRole('option');
      expect(items).toHaveLength(3);
      
      items.forEach(item => {
        expect(item).toHaveAttribute('aria-selected');
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('選択されたファイルのaria-selectedがtrueになる', () => {
      const props = {
        ...defaultProps,
        selectedFile: mockFiles[0].file,
      };
      
      render(<ImageFileList {...props} />);
      
      const selectedItem = screen.getByText('image1.jpg').closest('li');
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    });

    it('ソートボタンに適切なaria-labelが設定されている', () => {
      render(<ImageFileList {...defaultProps} />);
      
      expect(screen.getByLabelText(/ファイル名でソート/)).toBeInTheDocument();
      expect(screen.getByLabelText(/作成日でソート/)).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('非常に長いファイル名が適切に表示される', () => {
      const longNameFile = createMockImageFileInfo(
        'very-long-filename-that-should-wrap-properly-in-the-ui-component.jpg',
        1024,
        new Date('2023-01-01T10:00:00')
      );
      
      const props = {
        ...defaultProps,
        files: [longNameFile],
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.getByText(longNameFile.name)).toBeInTheDocument();
    });

    it('ファイルサイズが0の場合は"0 B"と表示される', () => {
      const zeroSizeFile = createMockImageFileInfo(
        'empty.jpg',
        0,
        new Date('2023-01-01T10:00:00')
      );
      
      const props = {
        ...defaultProps,
        files: [zeroSizeFile],
      };
      
      render(<ImageFileList {...props} />);
      
      expect(screen.getByText('0 B')).toBeInTheDocument();
    });

    it('同名ファイルが複数ある場合も正しく表示される', () => {
      const duplicateFiles = [
        createMockImageFileInfo('duplicate.jpg', 1024, new Date('2023-01-01T10:00:00')),
        createMockImageFileInfo('duplicate.jpg', 2048, new Date('2023-01-02T11:00:00')),
      ];
      
      const props = {
        ...defaultProps,
        files: duplicateFiles,
      };
      
      render(<ImageFileList {...props} />);
      
      const items = screen.getAllByText('duplicate.jpg');
      expect(items).toHaveLength(2);
    });
  });
});