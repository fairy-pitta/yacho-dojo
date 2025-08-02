# 野鳥データ充実化スクリプト

野鳥データ（birds.json）の不足している情報をWikipediaから自動取得して補完するPythonスクリプトです。

## 機能

- Wikipediaから野鳥の分類学的情報（目、科、英名など）を自動取得
- 日本語版と英語版Wikipediaの両方を検索
- バッチ処理による大量データの安全な処理
- レート制限対応（Wikipedia APIへの負荷軽減）

## 必要な環境

- Python 3.7+
- requests ライブラリ

## セットアップ

```bash
# 仮想環境の作成
python3 -m venv venv

# 仮想環境のアクティベート
source venv/bin/activate

# 必要なライブラリのインストール
pip install requests
```

## 使用方法

### 1. 少数データでのテスト実行

```bash
# 最初の5件のデータを処理
source venv/bin/activate
python scripts/enrich_bird_data.py --max 5
```

### 2. 範囲を指定した処理

```bash
# 10番目から20件のデータを処理
python scripts/enrich_bird_data.py --start 10 --max 20
```

### 3. バッチ処理（推奨）

```bash
# 50件ずつバッチ処理で全データを処理
python scripts/batch_enrich.py --batch-size 50

# 100番目から開始して30件ずつ処理
python scripts/batch_enrich.py --start 100 --batch-size 30
```

## オプション

### enrich_bird_data.py

- `--input, -i`: 入力ファイル（デフォルト: data/birds.json）
- `--output, -o`: 出力ファイル（デフォルト: data/birds_enriched.json）
- `--start, -s`: 開始インデックス（デフォルト: 0）
- `--max, -m`: 最大処理数

### batch_enrich.py

- `--input, -i`: 入力ファイル（デフォルト: data/birds.json）
- `--batch-size, -b`: バッチサイズ（デフォルト: 50）
- `--start, -s`: 開始インデックス（デフォルト: 0）

## 出力ファイル

- **enrich_bird_data.py**: `data/birds_enriched.json`
- **batch_enrich.py**: `data/birds_final.json`

## 処理される情報

以下の情報がWikipediaから自動取得されます：

- `order`: 目（例: カモ目）
- `family`: 科（例: カモ科）
- `english_name`: 英名（例: Mallard）

## 注意事項

1. **レート制限**: Wikipedia APIへの負荷を避けるため、リクエスト間に1秒の間隔を設けています
2. **データ品質**: 自動取得のため、一部の情報が不正確な場合があります
3. **処理時間**: 大量データの処理には時間がかかります（690件で約12-15分）
4. **ネットワーク**: インターネット接続が必要です

## トラブルシューティング

### ModuleNotFoundError: No module named 'requests'

```bash
source venv/bin/activate
pip install requests
```

### Wikipedia検索でエラーが発生する場合

- ネットワーク接続を確認
- しばらく時間をおいてから再実行
- バッチサイズを小さくして実行

### 処理が途中で止まる場合

```bash
# 途中から再開（例: 100番目から）
python scripts/batch_enrich.py --start 100
```

## 例

### 処理前のデータ

```json
{
  "id": 1,
  "japanese_name": "リュウキュウガモ",
  "english_name": "",
  "scientific_name": "Dendrocygna javanica",
  "family": "",
  "order": "",
  "habitat": "",
  "size": "",
  "description": "種番号: 1, 著者: (Horsfield, 1821)"
}
```

### 処理後のデータ

```json
{
  "id": 1,
  "japanese_name": "リュウキュウガモ",
  "english_name": "",
  "scientific_name": "Dendrocygna javanica",
  "family": "カモ目カモ科",
  "order": "カモ目",
  "habitat": "",
  "size": "",
  "description": "種番号: 1, 著者: (Horsfield, 1821)"
}
```