/**
 * DirectoryBrowser統合テスト（Playwright）
 * 実際のブラウザでDirectoryBrowserコンポーネントの表示を確認
 */

import { test, expect } from '@playwright/test';

test.describe('DirectoryBrowser Integration', () => {
  test.beforeEach(async ({ page }) => {
    // 開発サーバーにアクセス
    await page.goto('http://localhost:5173');
  });

  test('DirectoryBrowserコンポーネントが表示される', async ({ page }) => {
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // DirectoryBrowserコンポーネントが存在するかチェック
    const directoryBrowser = page.locator('[data-testid="directory-browser"]');
    
    // コンポーネントが存在しない場合、ページの構造を確認
    const pageContent = await page.content();
    console.log('Page HTML:', pageContent);

    // メインレイアウトの確認
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();
    
    const mainClasses = await mainElement.getAttribute('class');
    console.log('Main element classes:', mainClasses);

    // DirectoryBrowserが含まれるdivを探す
    const directoryBrowserDiv = page.locator('.App-directory-browser');
    const isDirectoryBrowserDivVisible = await directoryBrowserDiv.isVisible();
    console.log('Directory browser div visible:', isDirectoryBrowserDivVisible);

    if (isDirectoryBrowserDivVisible) {
      const directoryBrowserContent = await directoryBrowserDiv.innerHTML();
      console.log('Directory browser div content:', directoryBrowserContent);
    }

    // DirectoryBrowserコンポーネントが表示されることを確認
    await expect(directoryBrowser).toBeVisible();
  });

  test('ディレクトリ選択ボタンが表示される', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ディレクトリ選択ボタンを探す
    const directoryButton = page.locator('button:has-text("ディレクトリを選択")');
    
    // ボタンが存在しない場合、ページ内のすべてのボタンを確認
    const allButtons = await page.locator('button').all();
    console.log('All buttons on page:');
    for (const button of allButtons) {
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`- Button: "${text}", Visible: ${isVisible}`);
    }

    // ディレクトリ選択ボタンが表示されることを確認
    await expect(directoryButton).toBeVisible();
  });

  test('CSS Gridレイアウトが適用されている', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const mainElement = page.locator('main');
    
    // CSS Gridレイアウトのクラスが適用されているか確認
    await expect(mainElement).toHaveClass(/App-main--with-directory-browser/);
    
    // CSS Grid プロパティが適用されているか確認
    const displayStyle = await mainElement.evaluate(el => 
      window.getComputedStyle(el).display
    );
    console.log('Main element display style:', displayStyle);
    
    const gridTemplateColumns = await mainElement.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    console.log('Grid template columns:', gridTemplateColumns);
  });

  test('コンソールエラーをチェック', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    // コンソールメッセージを収集
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // ページエラーを収集
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // コンソールメッセージを出力
    console.log('Console messages:', consoleMessages);
    
    // エラーがある場合は出力
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }

    // 重大なエラーがないことを確認（警告は許可）
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('ReactDOMTestUtils.act')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('DirectoryBrowserコンポーネントの内部構造を確認', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // DirectoryBrowserの各子コンポーネントを確認
    const directorySelector = page.locator('.directory-selector');
    const imageFileList = page.locator('.image-file-list');
    const collapsiblePanel = page.locator('.collapsible-panel');

    // 各コンポーネントの存在を確認
    const selectorExists = await directorySelector.count();
    const fileListExists = await imageFileList.count();
    const panelExists = await collapsiblePanel.count();

    console.log('DirectorySelector exists:', selectorExists > 0);
    console.log('ImageFileList exists:', fileListExists > 0);
    console.log('CollapsiblePanel exists:', panelExists > 0);

    // ページ内のすべてのクラス名を確認
    const allElements = await page.locator('*').all();
    const classNames = new Set<string>();
    
    for (const element of allElements.slice(0, 50)) { // 最初の50要素のみチェック
      const className = await element.getAttribute('class');
      if (className) {
        className.split(' ').forEach(cls => classNames.add(cls));
      }
    }
    
    console.log('Classes found on page:', Array.from(classNames).sort());
  });
});