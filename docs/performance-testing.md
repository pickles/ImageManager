# パフォーマンステストガイド

## 概要

このドキュメントでは、ImageManagerアプリケーションのパフォーマンステストについて説明します。パフォーマンステストは、大きな画像ファイルの処理、高解像度画像の表示、メモリリークの検出、レスポンス時間の測定を行います。

## テストの種類

### 1. 大きな画像ファイルでの動作テスト

**目的**: 大容量ファイル（最大50MB）の処理性能を検証

**テスト項目**:
- 10MB画像ファイルの処理時間（1秒以内）
- 25MB画像ファイルの処理時間（2秒以内）
- 50MB画像ファイルの処理時間（3秒以内）
- 上限を超えるファイルの適切な拒否（500ms以内）
- 複数ファイルの並行処理性能

**実装場所**: `src/test/performance.test.ts`

### 2. 高解像度画像での動作テスト

**目的**: 高解像度画像（最大8K）の処理性能を検証

**テスト項目**:
- 4K解像度（3840×2160）の処理時間
- 8K解像度（7680×4320）の処理時間
- 上限を超える解像度の検出
- スケーリング計算の高速処理

**実装場所**: `src/test/performance.test.ts`

### 3. メモリリーク検出テスト

**目的**: メモリの適切な管理とリークの防止を検証

**テスト項目**:
- URL作成と解放の適切な管理
- 大量のURL操作でのメモリリーク検出
- 長時間の連続処理でのメモリ安定性
- 画像切り替え時のメモリ管理

**実装場所**: `src/test/performance.test.ts`, `src/components/__tests__/performance.test.tsx`

### 4. レスポンス時間の測定テスト

**目的**: ユーザー操作に対する応答性を検証

**テスト項目**:
- ファイルバリデーションの応答時間
- メタデータ抽出の応答時間
- 画像スケーリング計算の応答時間
- 並行処理と逐次処理の比較
- エラー処理の応答時間

**実装場所**: `src/test/performance.test.ts`, `src/components/__tests__/performance.test.tsx`

## パフォーマンス閾値

### 処理時間の閾値

| ファイルサイズ | 最大処理時間 |
|---------------|-------------|
| 1-5MB         | 500ms       |
| 5-15MB        | 1500ms      |
| 15-25MB       | 3000ms      |
| 25-50MB       | 5000ms      |

| 解像度        | 最大処理時間 |
|---------------|-------------|
| HD (1920×1080)| 200ms       |
| 2K (2560×1440)| 400ms       |
| 4K (3840×2160)| 800ms       |
| 8K (7680×4320)| 1500ms      |

### UI応答性の閾値

| 操作          | 最大応答時間 |
|---------------|-------------|
| 初期レンダリング | 100ms      |
| 状態変更      | 200ms       |
| エラー復帰    | 1000ms      |

### メモリ使用量の閾値

| 項目          | 上限        |
|---------------|-------------|
| 最大メモリ増加 | 50MB        |
| リーク検出    | 10MB        |

## テストの実行方法

### 基本的な実行

```bash
# パフォーマンステストの実行
npm run test:performance

# ウォッチモードでの実行
npm run test:performance:watch

# 特定のテストファイルのみ実行
npx vitest run src/test/performance.test.ts
```

### 詳細な実行オプション

```bash
# レポート付きで実行
npx vitest run --reporter=verbose --reporter=json --outputFile=test-results/performance.json

# 特定のテストケースのみ実行
npx vitest run -t "大きな画像ファイル"

# デバッグモードで実行
npx vitest run --inspect-brk
```

## テスト結果の分析

### レポートファイル

パフォーマンステストの実行後、以下のファイルが生成されます：

- `test-results/performance/performance-report.json`: 詳細なパフォーマンスレポート
- `test-results/performance/test-results.json`: Vitestの実行結果

### レポートの内容

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "duration": 15000,
  "memoryUsage": {
    "initial": { "heapUsed": 10485760 },
    "final": { "heapUsed": 15728640 },
    "increase": 5242880
  },
  "status": "completed",
  "warnings": [],
  "recommendations": [],
  "summary": {
    "totalDuration": "15000ms",
    "memoryIncrease": "5.00 MB",
    "status": "completed",
    "warningCount": 0,
    "recommendationCount": 0
  }
}
```

## パフォーマンス最適化のガイドライン

### 1. ファイル処理の最適化

- **並行処理の活用**: 複数ファイルの処理は`Promise.all`を使用
- **早期バリデーション**: ファイルサイズや形式の事前チェック
- **適切なエラーハンドリング**: 無効なファイルの高速拒否

### 2. メモリ管理の最適化

- **URL管理**: `createObjectURL`と`revokeObjectURL`の適切な使用
- **オブジェクトの解放**: 不要になったオブジェクトの明示的な解放
- **メモリリーク監視**: 定期的なメモリ使用量の確認

### 3. UI応答性の最適化

- **非同期処理**: 重い処理の非同期実行
- **プログレッシブ表示**: 段階的な画像表示
- **ローディング状態**: 適切なローディングインジケーター

### 4. 計算処理の最適化

- **キャッシュの活用**: 計算結果の再利用
- **効率的なアルゴリズム**: スケーリング計算の最適化
- **早期リターン**: 不要な計算の回避

## トラブルシューティング

### よくある問題

1. **テストタイムアウト**
   - 解決策: `testTimeout`の調整、テストケースの分割

2. **メモリ不足エラー**
   - 解決策: テストファイルサイズの調整、メモリ制限の確認

3. **不安定なテスト結果**
   - 解決策: 適切なモックの使用、テスト環境の統一

### デバッグ方法

```bash
# デバッグ情報付きで実行
DEBUG=* npm run test:performance

# メモリ使用量の監視
node --inspect --max-old-space-size=4096 scripts/run-performance-tests.js

# プロファイリング
npx vitest run --reporter=verbose --coverage
```

## 継続的な監視

### CI/CDでの実行

```yaml
# GitHub Actions例
- name: Run Performance Tests
  run: npm run test:performance
  
- name: Upload Performance Report
  uses: actions/upload-artifact@v2
  with:
    name: performance-report
    path: test-results/performance/
```

### パフォーマンス回帰の検出

- 定期的なパフォーマンステストの実行
- 閾値を超えた場合のアラート設定
- パフォーマンス履歴の追跡

## まとめ

パフォーマンステストは、ImageManagerアプリケーションの品質保証において重要な役割を果たします。定期的な実行と結果の分析により、パフォーマンスの回帰を早期に検出し、ユーザー体験の向上を図ることができます。