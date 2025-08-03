#!/usr/bin/env python3
"""
Supabaseのbirdsテーブルからbird_idを取得するスクリプト
"""

import os
import json
from supabase import create_client, Client

def get_bird_ids():
    """Supabaseからbirdsテーブルのデータを取得"""
    
    # Supabase設定
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("Error: Supabase環境変数が設定されていません")
        print("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です")
        return None
    
    # Supabaseクライアント作成
    supabase: Client = create_client(url, key)
    
    try:
        # birdsテーブルからデータを取得
        response = supabase.table('birds').select('id, scientific_name, japanese_name').execute()
        
        if response.data:
            print(f"取得した鳥データ: {len(response.data)}件")
            
            # scientific_name -> id のマッピングを作成
            bird_mapping = {}
            for bird in response.data:
                bird_mapping[bird['scientific_name']] = {
                    'id': bird['id'],
                    'japanese_name': bird['japanese_name']
                }
            
            # JSONファイルに保存
            output_file = '/Users/wao_singapore/yacho-dojo/data/bird_id_mapping.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(bird_mapping, f, ensure_ascii=False, indent=2)
            
            print(f"マッピングファイルを保存しました: {output_file}")
            return bird_mapping
        else:
            print("birdsテーブルにデータが見つかりませんでした")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == '__main__':
    mapping = get_bird_ids()
    if mapping:
        print("\n最初の5件:")
        for i, (scientific_name, data) in enumerate(mapping.items()):
            if i >= 5:
                break
            print(f"  {scientific_name} -> {data['id']} ({data['japanese_name']})")