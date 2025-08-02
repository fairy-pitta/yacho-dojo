#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
birds_enriched.jsonから完全なINSERT文を生成するスクリプト
"""

import json


def generate_birds_insert_sql():
    # JSONファイルのパス
    json_file_path = (
        '/Users/wao_singapore/yacho-dojo/data/birds_enriched.json'
    )
    output_file_path = (
        '/Users/wao_singapore/yacho-dojo/data/birds_complete_insert.sql'
    )
    
    # JSONファイルを読み込み
    with open(json_file_path, 'r', encoding='utf-8') as f:
        birds_data = json.load(f)
    
    # SQL文の開始部分
    sql_content = "-- 野鳥データの完全なINSERT文\n"
    sql_content += (
        f"-- birds_enriched.jsonから生成された{len(birds_data)}種の野鳥データ\n\n"
    )
    sql_content += (
        'INSERT INTO birds (japanese_name, scientific_name, '
        'family, "order") VALUES\n'
    )
    
    # 各野鳥データをINSERT文に変換
    insert_values = []
    for bird in birds_data:
        japanese_name = bird['japanese_name'].replace("'", "''")
        scientific_name = bird['scientific_name'].replace("'", "''")
        family = bird['family'].replace("'", "''")
        order = bird['order'].replace("'", "''")
        
        insert_values.append(
            f"('{japanese_name}', '{scientific_name}', "
            f"'{family}', '{order}')"
        )
    
    # INSERT文を完成
    sql_content += ',\n'.join(insert_values)
    sql_content += ';\n'
    
    # SQLファイルに書き込み
    with open(output_file_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"完了: {len(birds_data)}種の野鳥データをINSERT文に変換しました")
    print(f"出力ファイル: {output_file_path}")


if __name__ == '__main__':
    generate_birds_insert_sql()