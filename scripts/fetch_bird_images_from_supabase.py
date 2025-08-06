#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabaseのbirdsテーブルから鳥の情報を取得して、
そのIDに合わせてbird_imagesデータを作成するスクリプト
"""

import csv
import requests
import time
import uuid
import os
from typing import List, Dict, Optional
from supabase import create_client, Client
from dotenv import load_dotenv


class BirdImageFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'BirdImageFetcher/1.0 (yacho-dojo)'
        })
        
    def fetch_wikimedia_images(self, scientific_name: str) -> List[Dict]:
        """Wikimedia Commonsから画像を取得"""
        images = []
        try:
            # Wikimedia Commons API
            search_url = 'https://commons.wikimedia.org/w/api.php'
            params = {
                'action': 'query',
                'format': 'json',
                'list': 'search',
                'srsearch': f'filetype:bitmap {scientific_name}',
                'srnamespace': 6,  # File namespace
                'srlimit': 50
            }
            
            response = self.session.get(search_url, params=params)
            data = response.json()
            
            if 'query' in data and 'search' in data['query']:
                for item in data['query']['search']:
                    title = item['title']
                    # 画像詳細を取得
                    image_info = self._get_wikimedia_image_info(title)
                    if image_info:
                        images.append(image_info)
                        
            time.sleep(0.3)  # API制限対策
            
        except Exception as e:
            print(f"Wikimedia画像取得エラー ({scientific_name}): {e}")
            
        return images
        
    def _get_wikimedia_image_info(self, title: str) -> Optional[Dict]:
        """Wikimedia画像の詳細情報を取得"""
        try:
            info_url = 'https://commons.wikimedia.org/w/api.php'
            params = {
                'action': 'query',
                'format': 'json',
                'titles': title,
                'prop': 'imageinfo',
                'iiprop': 'url|size|mime|user|extmetadata'
            }
            
            response = self.session.get(info_url, params=params)
            data = response.json()
            
            if 'query' in data and 'pages' in data['query']:
                for page_id, page in data['query']['pages'].items():
                    if 'imageinfo' in page:
                        info = page['imageinfo'][0]
                        
                        # ライセンス情報を確認
                        license_info = self._extract_license_info(info.get('extmetadata', {}))
                        if not license_info['is_commercial_use_allowed']:
                            continue
                            
                        # 画像サイズチェック（最小200x200）
                        width = info.get('width', 0)
                        height = info.get('height', 0)
                        if width < 200 or height < 200:
                            continue
                            
                        return {
                            'id': str(uuid.uuid4()),
                            'image_url': info.get('url', ''),
                            'source': 'Wikimedia Commons',
                            'license': license_info['license'],
                            'photographer': info.get('user', ''),
                            'attribution': license_info['attribution'],
                            'credit': license_info['credit'],
                            'width': width,
                            'height': height,
                            'file_size': info.get('size', 0),
                            'mime_type': info.get('mime', ''),
                            'quality_score': self._calculate_quality_score(
                                width, height, info.get('size', 0)
                            ),
                            'is_active': True,
                            'created_at': '2024-01-01T00:00:00Z'
                        }
                        
        except Exception as e:
            print(f"Wikimedia画像詳細取得エラー ({title}): {e}")
            
        return None
        
    def _extract_license_info(self, extmetadata: Dict) -> Dict:
        """ライセンス情報を抽出"""
        license_info = {
            'license': 'Unknown',
            'attribution': '',
            'credit': '',
            'is_commercial_use_allowed': False
        }
        
        # 商用利用可能なライセンスリスト
        commercial_licenses = [
            'cc-by-sa', 'cc-by', 'cc0', 'public domain',
            'cc-by-2.0', 'cc-by-3.0', 'cc-by-4.0',
            'cc-by-sa-2.0', 'cc-by-sa-3.0', 'cc-by-sa-4.0'
        ]
        
        if 'LicenseShortName' in extmetadata:
            license_name = extmetadata['LicenseShortName']['value'].lower()
            license_info['license'] = extmetadata['LicenseShortName']['value']
            license_info['is_commercial_use_allowed'] = any(
                cl in license_name for cl in commercial_licenses
            )
            
        if 'Attribution' in extmetadata:
            license_info['attribution'] = extmetadata['Attribution']['value']
            
        if 'Credit' in extmetadata:
            license_info['credit'] = extmetadata['Credit']['value']
            
        return license_info
        
    def _calculate_quality_score(self, width: int, height: int,
                                 file_size: int) -> int:
        """画像品質スコアを計算（1-100）"""
        score = 50  # ベーススコア
        
        # 解像度による加点
        min_dimension = min(width, height)
        if min_dimension >= 1000:
            score += 30
        elif min_dimension >= 500:
            score += 20
        elif min_dimension >= 300:
            score += 10
        
        # ファイルサイズによる調整
        if file_size > 1000000:  # 1MB以上
            score += 10
        elif file_size > 500000:  # 500KB以上
            score += 5
        
        # アスペクト比チェック
        if width > 0 and height > 0:
            aspect_ratio = max(width, height) / min(width, height)
            if aspect_ratio > 3:  # 極端な縦横比は減点
                score -= 20
                
        return max(1, min(100, score))
        
    def fetch_inaturalist_images(self, scientific_name: str) -> List[Dict]:
        """iNaturalistから画像を取得"""
        images = []
        try:
            # iNaturalist API
            search_url = 'https://api.inaturalist.org/v1/observations'
            params = {
                'taxon_name': scientific_name,
                'photos': 'true',
                'license': 'cc0,cc-by,cc-by-sa',  # 商用利用可能なライセンス
                'per_page': 100,
                'order': 'desc',
                'order_by': 'created_at'
            }
            
            response = self.session.get(search_url, params=params)
            data = response.json()
            
            if 'results' in data:
                for obs in data['results']:
                    if 'photos' in obs:
                        for photo in obs['photos']:
                            # 商用利用可能なライセンスのみ
                            license_code = photo.get('license_code', '')
                            if not self._is_commercial_license(license_code):
                                continue
                                
                            # 高解像度画像URLを取得
                            image_url = photo.get('url', '').replace(
                                'square', 'original'
                            )
                            
                            images.append({
                                'id': str(uuid.uuid4()),
                                'image_url': image_url,
                                'source': 'iNaturalist',
                                'license': license_code or 'CC-BY-NC',
                                'photographer': photo.get('attribution', ''),
                                'attribution': photo.get('attribution', ''),
                                'credit': (
                                    f"iNaturalist user: "
                                    f"{photo.get('attribution', 'Unknown')}"
                                ),
                                'width': 0,  # iNaturalistでは詳細サイズ不明
                                'height': 0,
                                'file_size': 0,
                                'mime_type': 'image/jpeg',
                                'quality_score': 70,  # iNaturalistの標準品質
                                'is_active': True,
                                'created_at': '2024-01-01T00:00:00Z'
                            })
                            
            time.sleep(1)  # API制限対策
            
        except Exception as e:
            print(f"iNaturalist画像取得エラー ({scientific_name}): {e}")
            
        return images
        
    def _is_commercial_license(self, license_code: str) -> bool:
        """商用利用可能なライセンスかチェック"""
        if not license_code:
            return False
        commercial_licenses = [
            'cc-by', 'cc-by-sa', 'cc0',
            'cc-by-2.0', 'cc-by-3.0', 'cc-by-4.0',
            'cc-by-sa-2.0', 'cc-by-sa-3.0', 'cc-by-sa-4.0'
        ]
        return license_code.lower() in commercial_licenses
        
    def fetch_gbif_images(self, scientific_name: str) -> List[Dict]:
        """GBIF Mediaから画像を取得"""
        images = []
        try:
            # GBIF Species API
            species_url = 'https://api.gbif.org/v1/species/match'
            params = {'name': scientific_name}
            
            response = self.session.get(species_url, params=params)
            species_data = response.json()
            
            if 'usageKey' in species_data:
                taxon_key = species_data['usageKey']
                
                # メディアデータを取得
                media_url = 'https://api.gbif.org/v1/occurrence/search'
                params = {
                    'taxonKey': taxon_key,
                    'mediaType': 'StillImage',
                    'limit': 100
                }
                
                response = self.session.get(media_url, params=params)
                data = response.json()
                
                if 'results' in data:
                    for record in data['results']:
                        if 'media' in record:
                            for media in record['media']:
                                license_info = media.get('license', '')
                                # 商用利用可能なライセンス
                                if any(lic in license_info.lower() 
                                       for lic in ['cc0', 'cc by', 
                                                   'public domain']):
                                    images.append({
                                        'id': str(uuid.uuid4()),
                                        'image_url': media.get('identifier', ''),
                                        'source': 'GBIF Media',
                                        'license': license_info,
                                        'photographer': media.get(
                                            'rightsHolder', ''),
                                        'attribution': media.get(
                                            'rightsHolder', ''),
                                        'credit': (
                                            f"GBIF: "
                                            f"{media.get('rightsHolder', 'Unknown')}"
                                        ),
                                        'width': 0,
                                        'height': 0,
                                        'file_size': 0,
                                        'mime_type': 'image/jpeg',
                                        'quality_score': 60,
                                        'is_active': True,
                                        'created_at': '2024-01-01T00:00:00Z'
                                    })
                            
            time.sleep(0.3)  # API制限対策
            
        except Exception as e:
            print(f"GBIF画像取得エラー ({scientific_name}): {e}")
            
        return images
        
    def _is_gbif_commercial_license(self, license_url: str) -> bool:
        """GBIF商用利用可能ライセンスチェック"""
        commercial_patterns = [
            'creativecommons.org/licenses/by/',
            'creativecommons.org/licenses/by-sa/',
            'creativecommons.org/publicdomain/zero/'
        ]
        return any(
            pattern in license_url.lower() for pattern in commercial_patterns
        )
        
    def _extract_gbif_license(self, license_url: str) -> str:
        """GBIFライセンスURLからライセンス名を抽出"""
        if 'by-sa' in license_url.lower():
            return 'CC BY-SA'
        elif 'by/' in license_url.lower():
            return 'CC BY'
        elif 'zero' in license_url.lower():
            return 'CC0'
        else:
            return 'Unknown'
            
    def fetch_all_images(self, scientific_name: str, 
                         bird_id: str) -> List[Dict]:
        """全ソースから画像を取得"""
        all_images = []
        
        # Wikimedia Commons
        wikimedia_images = self.fetch_wikimedia_images(scientific_name)
        for img in wikimedia_images:
            img['bird_id'] = bird_id
        all_images.extend(wikimedia_images)
        
        # iNaturalist
        inaturalist_images = self.fetch_inaturalist_images(scientific_name)
        for img in inaturalist_images:
            img['bird_id'] = bird_id
        all_images.extend(inaturalist_images)
        
        # GBIF
        gbif_images = self.fetch_gbif_images(scientific_name)
        for img in gbif_images:
            img['bird_id'] = bird_id
        all_images.extend(gbif_images)
        
        # 品質スコア順にソート
        all_images.sort(key=lambda x: x['quality_score'], reverse=True)
        return all_images


def main():
    # .env.localファイルから環境変数を読み込み
    load_dotenv('.env.local')
    
    # Supabase接続設定
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    # SERVICE_ROLE_KEYがない場合はANON_KEYを使用（読み取り専用）
    supabase_key = (
        os.getenv('SUPABASE_SERVICE_ROLE_KEY') or
        os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    )
    
    if not supabase_url or not supabase_key:
        print("エラー: Supabase環境変数が設定されていません")
        print(
            "NEXT_PUBLIC_SUPABASE_URL と "
            "SUPABASE_ANON_KEY を確認してください"
        )
        return
    
    # Supabaseクライアント作成
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # 出力ファイル設定
    output_file = (
        '/Users/wao_singapore/yacho-dojo/data/bird_images_from_supabase.csv'
    )
    
    fetcher = BirdImageFetcher()
    all_images = []
    
    try:
        # Supabaseからbirdsテーブルのデータを取得
        print("Supabaseからbirdsテーブルのデータを取得中...")
        response = supabase.table('birds').select(
            'id, japanese_name, scientific_name'
        ).execute()
        birds = response.data
        
        print(f"取得した鳥の種類数: {len(birds)}")
        
        # 各野鳥の画像を取得
        for i, bird in enumerate(birds):
            bird_id = bird['id']
            scientific_name = bird['scientific_name']
            japanese_name = bird['japanese_name']
            
            print(
                f"Progress: {i+1}/{len(birds)} - {japanese_name} "
                f"({scientific_name})"
            )
            
            images = fetcher.fetch_all_images(scientific_name, bird_id)
            all_images.extend(images)
            
            print(f"  取得画像数: {len(images)}")
            
            # 10種ごとに中間保存（長時間処理のため）
            if (i + 1) % 10 == 0:
                print(f"中間保存: {len(all_images)}件の画像データを処理済み")
            
            # API制限対策
            time.sleep(1)
        
        # bird_imagesテーブルに挿入
        if all_images:
            print(f"\nbird_imagesテーブルに{len(all_images)}件の画像データを挿入中...")
            
            # バッチ挿入のため、データを準備
            insert_data = []
            for img in all_images:
                # created_atフィールドを削除（Supabaseが自動生成）
                img_data = {
                    k: v for k, v in img.items() if k != 'created_at'
                }
                insert_data.append(img_data)
            
            try:
                # Supabaseにバッチ挿入
                response = supabase.table('bird_images').insert(insert_data).execute()
                print(
                    f"成功: {len(response.data)}件の画像データを"
                    f"bird_imagesテーブルに挿入しました"
                )
                
                # CSVファイルにも出力（バックアップ用）
                fieldnames = [
                    'id', 'bird_id', 'image_url', 'source', 'license',
                    'photographer', 'attribution', 'credit', 'width', 'height',
                    'file_size', 'mime_type', 'quality_score', 'is_active'
                ]
                
                with open(output_file, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(insert_data)
                
                print(f"バックアップCSVファイルも作成: {output_file}")
                
            except Exception as e:
                print(f"データベース挿入エラー: {e}")
                print("CSVファイルのみ出力します...")
                
                # エラー時はCSVのみ出力
                fieldnames = [
                    'id', 'bird_id', 'image_url', 'source', 'license',
                    'photographer', 'attribution', 'credit', 'width', 'height',
                    'file_size', 'mime_type', 'quality_score', 'is_active',
                    'created_at'
                ]
                
                with open(output_file, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(all_images)
                
                print(f"CSVファイル出力完了: {output_file}")
        else:
            print("画像データが見つかりませんでした")
            
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()