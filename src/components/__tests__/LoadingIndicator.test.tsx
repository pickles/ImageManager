import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingIndicator from '../LoadingIndicator';

describe('LoadingIndicator', () => {
  describe('表示制御', () => {
    it('isVisible=trueの時にローディングインジケーターが表示される', () => {
      render(<LoadingIndicator isVisible={true} />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('isVisible=falseの時にローディングインジケーターが表示されない', () => {
      render(<LoadingIndicator isVisible={false} />);
      
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('メッセージ表示', () => {
    it('デフォルトメッセージが表示される', () => {
      render(<LoadingIndicator isVisible={true} />);
      
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('カスタムメッセージが表示される', () => {
      const customMessage = '画像を処理中です...';
      render(<LoadingIndicator isVisible={true} message={customMessage} />);
      
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('空文字列のメッセージの時はメッセージが表示されない', () => {
      render(<LoadingIndicator isVisible={true} message="" />);
      
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
  });

  describe('サイズバリエーション', () => {
    it('デフォルトでmediumサイズが適用される', () => {
      render(<LoadingIndicator isVisible={true} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('loading-spinner--medium');
    });

    it('smallサイズが正しく適用される', () => {
      render(<LoadingIndicator isVisible={true} size="small" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('loading-spinner--small');
    });

    it('largeサイズが正しく適用される', () => {
      render(<LoadingIndicator isVisible={true} size="large" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass('loading-spinner--large');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なdata-testid属性が設定されている', () => {
      render(<LoadingIndicator isVisible={true} />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
    });

    it('メッセージテキストが読み上げ可能である', () => {
      const message = 'ファイルを読み込んでいます';
      render(<LoadingIndicator isVisible={true} message={message} />);
      
      const messageElement = screen.getByTestId('loading-message');
      expect(messageElement).toHaveTextContent(message);
    });
  });

  describe('要件5.1, 5.2の検証', () => {
    it('要件5.1: 画像の読み込み開始時にローディングインジケーターが表示される', () => {
      // 読み込み開始状態をシミュレート
      render(<LoadingIndicator isVisible={true} message="画像を読み込み中..." />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
    });

    it('要件5.2: 画像の読み込み完了時にローディングインジケーターが非表示になる', () => {
      // 読み込み完了状態をシミュレート
      render(<LoadingIndicator isVisible={false} />);
      
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});