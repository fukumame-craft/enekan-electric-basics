# 電気の基礎 頻出トレーニング

エネルギー管理士［電気分野］の課目Ⅱ「電気の基礎」に特化した、外部API・CDN不要のPWAです。公式過去問の本文は収録せず、2018～2025年度の出題傾向から抽出した解法パターンを使って、独自問題をランダム生成します。

## 収録内容

- 46種類の問題生成パターン
- 電気・電子理論 18、自動制御 13、電気計測 11、情報処理 4
- 頻出問題、分野別、苦手指定、誤答復習、10問・20問模擬テスト
- 数値・単位・許容誤差判定、選択式判定
- ヒント、公式、問題文での見分け方、8段階の途中式・解説
- localStorageによる完全ローカル履歴、分野別・パターン別集計、CSV出力
- 公式・解法・語呂一覧、ユーザー独自語呂の登録
- Service Workerによるオフライン起動

## フォルダ構成

- `index.html`：画面構造
- `style.css`：レスポンシブUI
- `app.js`：画面、採点、履歴、模試、CSV出力
- `questions.js`：問題データとランダム生成ロジック
- `manifest.json`：PWA設定
- `service-worker.js`：アプリシェルのキャッシュと旧キャッシュ削除
- `icons/`：PWAアイコン
- `analysis.md` / `analysis.csv`：過去問分析
- `question-patterns.csv`：実装問題一覧
- `validate.js` / `browser-tests.html` / `test-results.json`：検証

## ローカル起動

Service Workerは `file://` では動かないため、簡易Webサーバーを使います。

### Windows（Python導入済み）

1. このフォルダでPowerShellを開く
2. `python -m http.server 8000` を実行
3. ブラウザで `http://localhost:8000/` を開く
4. 一度すべて表示した後、ネットワークを切って再読み込みし、オフライン動作を確認する

終了はPowerShellで `Ctrl + C` です。

## GitHub Pages公開

1. ZIPを展開し、中のファイル一式をGitHubリポジトリのルートへ配置する
2. GitHubのリポジトリで **Settings → Pages** を開く
3. **Build and deployment** を `Deploy from a branch` にする
4. Branchを `main`、Folderを `/(root)` にして保存する
5. 表示されたPages URLを一度オンラインで開く
6. 2回目以降は、読み込み済み端末ならオフラインでも起動・出題・採点できる

サブディレクトリ公開に対応するため、参照パスはすべて相対パスです。更新時は `service-worker.js` の `CACHE_VERSION` を変更すると、activate時に旧キャッシュが削除されます。

## テスト

### Node.js自動検証

`node validate.js`

各46パターンを100回、合計4,600問生成し、次を検証します。

- 正解値が有限で、NaN・Infinityではない
- 正解値と許容範囲内の値が受理される
- 明確に外れた値が拒否される
- 選択肢に正解が含まれる
- 選択肢が重複しない
- 正解表示と8段階解説の答えが一致する

### Service Worker検証

`node validate-service-worker.js`

必須アセットの事前キャッシュ、旧キャッシュ削除、即時更新、キャッシュ優先応答、ネットワーク応答を模擬検証します。

### ブラウザ検証

サーバー起動後に `browser-tests.html` を開き、「各パターンを100回検証」を押します。

## データ保存と注意

履歴はブラウザのlocalStorageに保存されます。ブラウザデータを削除すると履歴も消えます。端末間同期は行いません。公式過去問は省エネルギーセンターの利用条件に従い、問題本文・図・選択肢を本アプリへ複製していません。
