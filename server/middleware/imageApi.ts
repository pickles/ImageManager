/**
 * 画像API用のViteミドルウェア
 * 開発環境でローカルディレクトリの画像ファイルを提供
 */

import { ViteDevServer } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { loadDirectoryConfig } from '../config/directories';

/**
 * 画像ディレクトリAPI用のミドルウェアを設定
 * @param server Vite開発サーバー
 */
export function setupImageApiMiddleware(server: ViteDevServer) {
  // 設定を読み込み
  const config = loadDirectoryConfig();

  /**
   * 利用可能なディレクトリを検索
   * @returns 存在するディレクトリパス、見つからない場合は空文字
   */
  function findAvailableDirectory(): string {
    for (const dir of config.candidateDirs) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }
    return '';
  }

  // 個別画像ファイルを返すAPI（より具体的なルートを先に定義）
  server.middlewares.use('/api/images/file', (req, res, next) => {
    if (req.method === 'GET') {
      const targetDir = findAvailableDirectory();

      // URLからファイル名を正確に抽出
      // Viteのミドルウェアは既に '/api/images/file' の部分を処理しているため、
      // req.url には残りの部分（ファイル名）のみが含まれる
      const url = req.url || '';
      console.log('File API Request - Processed URL:', url);

      // 先頭の '/' を除去してファイル名を取得
      const fileName = decodeURIComponent(url.startsWith('/') ? url.substring(1) : url);
      console.log('File API Request - Extracted fileName:', fileName);
      console.log('File API Request - targetDir:', targetDir);

      if (!fileName) {
        console.log('File API Error: No file name provided');
        res.statusCode = 400;
        res.end('File name required');
        return;
      }

      if (!targetDir) {
        console.log('File API Error: No valid directory found');
        res.statusCode = 404;
        res.end('No valid directory found');
        return;
      }

      const filePath = resolve(targetDir, fileName);
      console.log('File API Request - filePath:', filePath);

      // セキュリティチェック: ディレクトリトラバーサル攻撃を防ぐ
      if (!filePath.startsWith(targetDir)) {
        console.log('File API Error: Access denied for path:', filePath);
        res.statusCode = 403;
        res.end('Access denied');
        return;
      }

      try {
        if (!fs.existsSync(filePath)) {
          console.log('File API Error: File not found:', filePath);
          res.statusCode = 404;
          res.end('File not found');
          return;
        }

        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
          console.log('File API Error: Not a file:', filePath);
          res.statusCode = 404;
          res.end('Not a file');
          return;
        }

        // MIMEタイプを設定
        const ext = fileName.toLowerCase().split('.').pop();
        const contentType = config.mimeTypes[ext || ''] || 'application/octet-stream';
        console.log('File API Success: Serving file:', fileName, 'Content-Type:', contentType, 'Size:', stats.size);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      } catch (error) {
        console.log('File API Error: Failed to read file:', error);
        res.statusCode = 500;
        res.end('Failed to read file');
      }
    } else {
      next();
    }
  });

  // 画像ディレクトリのファイル一覧を返すAPI
  server.middlewares.use('/api/images', (req, res, next) => {
    if (req.method === 'GET') {
      const targetDir = findAvailableDirectory();

      console.log('List API: Checking directories:', config.candidateDirs);
      console.log('List API: Selected directory:', targetDir);

      try {
        if (!targetDir) {
          console.log('List API Error: No valid directory found');
          res.statusCode = 404;
          res.end(JSON.stringify({
            error: 'No valid directory found',
            candidates: config.candidateDirs
          }));
          return;
        }

        console.log('List API: Directory exists, reading files...');

        const files = fs.readdirSync(targetDir, { withFileTypes: true });
        const imageFiles = files
          .filter(file => file.isFile())
          .filter(file => {
            const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            return config.supportedExtensions.includes(ext);
          })
          .map(file => {
            const filePath = resolve(targetDir, file.name);
            const stats = fs.statSync(filePath);
            return {
              name: file.name,
              size: stats.size,
              lastModified: stats.mtime.getTime(),
              path: `/api/images/file/${encodeURIComponent(file.name)}`,
              url: `/api/images/file/${encodeURIComponent(file.name)}`
            };
          });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.end(JSON.stringify({
          directory: targetDir,
          files: imageFiles
        }));
      } catch (error) {
        console.log('List API Error: Failed to read directory:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to read directory' }));
      }
    } else {
      next();
    }
  });
}