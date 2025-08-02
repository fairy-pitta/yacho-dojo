#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
バッチ処理で野鳥データを充実化するスクリプト

大量のデータを安全に処理するため、バッチサイズを指定して
段階的に処理を行います。
"""

import json
import os
import sys
from enrich_bird_data import BirdDataEnricher


def merge_enriched_data(original_file: str, enriched_files: list,
                        output_file: str):
    """複数の充実化されたファイルを元のデータとマージ"""
    print(f"元データを読み込み中: {original_file}")
    with open(original_file, 'r', encoding='utf-8') as f:
        original_data = json.load(f)
    
    # IDをキーとした辞書を作成
    merged_data = {bird['id']: bird for bird in original_data}
    
    # 充実化されたデータをマージ
    for enriched_file in enriched_files:
        if os.path.exists(enriched_file):
            print(f"充実化データを読み込み中: {enriched_file}")
            with open(enriched_file, 'r', encoding='utf-8') as f:
                enriched_data = json.load(f)
            
            for bird in enriched_data:
                bird_id = bird['id']
                if bird_id in merged_data:
                    # 空でない値のみを更新
                    for key, value in bird.items():
                        if value and value != '':
                            merged_data[bird_id][key] = value
    
    # リストに変換（IDでソート）
    result = list(merged_data.values())
    result.sort(key=lambda x: x['id'])
    
    # 結果を保存
    print(f"マージ結果を保存中: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"完了: {len(result)} 件のデータをマージしました")


def batch_process(input_file: str, batch_size: int = 50, start_index: int = 0):
    """バッチ処理でデータを充実化"""
    enricher = BirdDataEnricher()
    
    # 元データの総数を確認
    with open(input_file, 'r', encoding='utf-8') as f:
        total_birds = len(json.load(f))
    
    print(f"総野鳥数: {total_birds}")
    print(f"バッチサイズ: {batch_size}")
    print(f"開始インデックス: {start_index}")
    
    enriched_files = []
    current_index = start_index
    
    while current_index < total_birds:
        batch_end = min(current_index + batch_size, total_birds)
        batch_name = f"birds_enriched_batch_{current_index}_{batch_end-1}.json"
        output_file = f"data/{batch_name}"
        
        print(f"\nバッチ処理: {current_index} - {batch_end-1}")
        
        try:
            enricher.process_birds_file(
                input_file, output_file, current_index, batch_size
            )
            enriched_files.append(output_file)
            
        except Exception as e:
            print(f"バッチ処理エラー: {e}")
            print("処理を継続します...")
        
        current_index = batch_end
    
    # 全バッチファイルをマージ
    if enriched_files:
        print("\n=== バッチファイルのマージ開始 ===")
        final_output = "data/birds_final.json"
        merge_enriched_data(input_file, enriched_files, final_output)
        
        # バッチファイルを削除（オプション）
        cleanup = input("バッチファイルを削除しますか？ (y/N): ")
        if cleanup.lower() == 'y':
            for file in enriched_files:
                if os.path.exists(file):
                    os.remove(file)
                    print(f"削除: {file}")
    
    print("\n=== バッチ処理完了 ===")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='バッチ野鳥データ充実化')
    parser.add_argument('--input', '-i', default='data/birds.json',
                        help='入力ファイル')
    parser.add_argument('--batch-size', '-b', type=int, default=50,
                        help='バッチサイズ')
    parser.add_argument('--start', '-s', type=int, default=0,
                        help='開始インデックス')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"エラー: 入力ファイルが見つかりません: {args.input}")
        sys.exit(1)
    
    batch_process(args.input, args.batch_size, args.start)


if __name__ == '__main__':
    main()