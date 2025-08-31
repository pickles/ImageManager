import React from 'react';
import './LoadingIndicator.css';

export interface LoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isVisible,
  message = '読み込み中...',
  size = 'medium'
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="loading-indicator" data-testid="loading-indicator">
      <div className={`loading-spinner loading-spinner--${size}`} data-testid="loading-spinner">
        <div className="loading-spinner__circle"></div>
      </div>
      {message && (
        <div className="loading-indicator__message" data-testid="loading-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;