#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
birds_enriched.jsonからCSVファイルを生成するスクリプト
"""

import json
import csv


def generate_birds_csv():
    # JSONファイルのパス
    json_file_path = (
        '/Users/wao_singapore/yacho-dojo/data/birds_enriched.json'
    )
    output_file_path = (
        '/Users/wao_singapore/yacho-dojo/data/birds_data.csv'
    )
    
    # JSONファイルを読み込み
    with open(json_file_path, 'r', encoding='utf-8') as f:
        birds_data = json.load(f)
    
    # CSVファイルに書き込み
    with open(output_file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        
        # ヘッダー行を書き込み
        writer.writerow([
            'japanese_name', 'scientific_name', 'family', 'order'
        ])
        
        # 各野鳥データを書き込み
        for bird in birds_data:
            writer.writerow([
                bird['japanese_name'],
                bird['scientific_name'],
                bird['family'],
                bird['order']
            ])
    
    print(f"完了: {len(birds_data)}種の野鳥データをCSVに変換しました")
    print(f"出力ファイル: {output_file_path}")


if __name__ == '__main__':
    generate_birds_csv()