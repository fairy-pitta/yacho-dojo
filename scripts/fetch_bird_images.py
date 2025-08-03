#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野鳥の学名ごとに画像リンクを取得するスクリプト
Wikimedia Commons、iNaturalist、GBIF Mediaから商用利用可能な画像を収集
"""

import csv
import requests
import time
import uuid
import re
import json
from typing import List, Dict, Optional


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
                'srlimit': 20
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
                        
            time.sleep(0.5)  # API制限対策
            
        except Exception as e:
            print(f"Wikimedia error for {scientific_name}: {e}")
            
        return images
    
    def _get_wikimedia_image_info(self, title: str) -> Optional[Dict]:
        """Wikimedia画像の詳細情報を取得（クオリティ情報と著作権情報を含む）"""
        try:
            url = 'https://commons.wikimedia.org/w/api.php'
            params = {
                'action': 'query',
                'format': 'json',
                'titles': title,
                'prop': 'imageinfo',
                'iiprop': 'url|extmetadata|size|mime'
            }
            
            response = self.session.get(url, params=params)
            data = response.json()
            
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if 'imageinfo' in page_data:
                    info = page_data['imageinfo'][0]
                    metadata = info.get('extmetadata', {})
                    
                    # ライセンス確認
                    license_info = metadata.get('LicenseName', {})
                    license_name = license_info.get('value', '')
                    
                    # 商用利用可能なライセンスのみ
                    commercial_licenses = [
                        'CC0', 'CC BY', 'CC BY-SA', 'Public domain'
                    ]
                    
                    if any(lic in license_name for lic in commercial_licenses):
                        artist = metadata.get('Artist', {}).get('value', '')
                        # HTMLタグを除去
                        artist = re.sub(r'<[^>]+>', '', artist)
                        
                        # 著作権情報の詳細取得
                        attribution_data = metadata.get('Attribution', {})
                        attribution = attribution_data.get('value', '')
                        attribution = re.sub(r'<[^>]+>', '', attribution)
                        
                        credit = metadata.get('Credit', {}).get('value', '')
                        credit = re.sub(r'<[^>]+>', '', credit)
                        
                        # 画像クオリティ情報
                        width = info.get('width', 0)
                        height = info.get('height', 0)
                        size = info.get('size', 0)  # バイト単位
                        mime_type = info.get('mime', '')
                        
                        # 画像品質スコア計算（解像度ベース）
                        quality_score = self._calculate_quality_score(
                            width, height, size)
                        
                        return {
                            'image_url': info.get('url', ''),
                            'source': 'Wikimedia Commons',
                            'license': license_name,
                            'photographer': artist,
                            'attribution': attribution,
                            'credit': credit,
                            'width': width,
                            'height': height,
                            'file_size': size,
                            'mime_type': mime_type,
                            'quality_score': quality_score,
                            'is_active': True
                        }
                        
        except Exception as e:
            print(f"Error getting Wikimedia image info: {e}")
            
        return None
    
    def _calculate_quality_score(self, width: int, height: int,
                                 file_size: int) -> int:
        """画像品質スコアを計算（1-10のスケール）"""
        # 解像度による基本スコア
        pixel_count = width * height
        if pixel_count >= 2000000:  # 2MP以上
            resolution_score = 10
        elif pixel_count >= 1000000:  # 1MP以上
            resolution_score = 8
        elif pixel_count >= 500000:  # 0.5MP以上
            resolution_score = 6
        elif pixel_count >= 200000:  # 0.2MP以上
            resolution_score = 4
        else:
            resolution_score = 2
        
        # ファイルサイズによる調整（圧縮品質の指標）
        if file_size > 0 and pixel_count > 0:
            bytes_per_pixel = file_size / pixel_count
            if bytes_per_pixel > 3:  # 高品質
                size_bonus = 0
            elif bytes_per_pixel > 1.5:  # 中品質
                size_bonus = -1
            else:  # 低品質（過度な圧縮）
                size_bonus = -2
        else:
            size_bonus = 0
        
        return max(1, min(10, resolution_score + size_bonus))
    
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
                'per_page': 30,
                'order': 'desc',
                'order_by': 'created_at'
            }
            
            response = self.session.get(search_url, params=params)
            data = response.json()
            
            if 'results' in data:
                for obs in data['results']:
                    if 'photos' in obs:
                        for photo in obs['photos']:
                            license_code = photo.get('license_code', '')
                            if license_code in ['cc0', 'cc-by', 'cc-by-sa']:
                                # 画像の詳細情報を取得
                                original_url = photo.get('url', '').replace(
                                    'square', 'original')
                                
                                # iNaturalistの画像サイズ情報
                                width = photo.get('original_dimensions', {})\
                                    .get('width', 0)
                                height = photo.get('original_dimensions', {})\
                                    .get('height', 0)
                                
                                # ファイルサイズは推定（iNaturalistでは直接取得不可）
                                estimated_size = (width * height * 3
                                                  if width and height else 0)
                                
                                quality_score = self._calculate_quality_score(
                                    width, height, estimated_size)
                                
                                # ユーザー情報
                                user_info = obs.get('user', {})
                                photographer = user_info.get('name') or \
                                    user_info.get('login', '')
                                
                                # 著作権表示用の情報
                                attribution = f"© {photographer} (iNaturalist)"
                                
                                images.append({
                                    'image_url': original_url,
                                    'source': 'iNaturalist',
                                    'license': license_code.upper().replace(
                                        '-', ' '),
                                    'photographer': photographer,
                                    'attribution': attribution,
                                    'credit': (f"iNaturalist observation by "
                                               f"{photographer}"),
                                    'width': width,
                                    'height': height,
                                    'file_size': estimated_size,
                                    'mime_type': 'image/jpeg',
                                    'quality_score': quality_score,
                                    'is_active': True
                                })
                                
            time.sleep(0.5)  # API制限対策
            
        except Exception as e:
            print(f"iNaturalist error for {scientific_name}: {e}")
            
        return images
    
    def fetch_gbif_images(self, scientific_name: str) -> List[Dict]:
        """GBIF Mediaから画像を取得"""
        images = []
        try:
            # まず種のtaxonKeyを取得
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
                    'limit': 20
                }
                
                response = self.session.get(media_url, params=params)
                data = response.json()
                
                if 'results' in data:
                    for record in data['results']:
                        if 'media' in record:
                            for media in record['media']:
                                license_info = media.get('license', '')
                                # 商用利用可能なライセンス
                                commercial_lic = [
                                    'cc0', 'cc by', 'public domain'
                                ]
                                if any(lic in license_info.lower()
                                       for lic in commercial_lic):
                                    # 画像の詳細情報を取得
                                    image_url = media.get('identifier', '')
                                    rights_holder = media.get('rightsHolder', '')
                                    creator = media.get('creator', '')
                                    
                                    # 撮影者情報（creatorまたはrightsHolder）
                                    photographer = creator or rights_holder
                                    
                                    # GBIFでは画像サイズ情報が限定的
                                    # デフォルト値を設定
                                    width = 1024  # 推定値
                                    height = 768   # 推定値
                                    estimated_size = width * height * 3
                                    
                                    quality_score = self._calculate_quality_score(
                                        width, height, estimated_size)
                                    
                                    # 著作権表示用の情報
                                    attribution = (f"© {photographer} (GBIF)"
                                                   if photographer else "© GBIF")
                                    
                                    images.append({
                                        'image_url': image_url,
                                        'source': 'GBIF Media',
                                        'license': license_info,
                                        'photographer': photographer,
                                        'attribution': attribution,
                                        'credit': (f"GBIF specimen image by "
                                                   f"{photographer}"
                                                   if photographer
                                                   else "GBIF specimen image"),
                                        'width': width,
                                        'height': height,
                                        'file_size': estimated_size,
                                        'mime_type': 'image/jpeg',
                                        'quality_score': quality_score,
                                        'is_active': True
                                    })
                                    
            time.sleep(0.5)  # API制限対策
            
        except Exception as e:
            print(f"GBIF error for {scientific_name}: {e}")
            
        return images
    
    def fetch_all_images(self, scientific_name: str, 
                         bird_id: str) -> List[Dict]:
        """全ソースから画像を取得"""
        all_images = []
        
        print(f"Fetching images for {scientific_name}...")
        
        # Wikimedia Commons
        wikimedia_images = self.fetch_wikimedia_images(scientific_name)
        all_images.extend(wikimedia_images)
        
        # iNaturalist
        inaturalist_images = self.fetch_inaturalist_images(scientific_name)
        all_images.extend(inaturalist_images)
        
        # GBIF Media
        gbif_images = self.fetch_gbif_images(scientific_name)
        all_images.extend(gbif_images)
        
        # bird_idとUUIDを追加
        for image in all_images:
            image['id'] = str(uuid.uuid4())
            image['bird_id'] = bird_id
            image['created_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        print(
            f"Found {len(all_images)} images for {scientific_name}"
        )
        return all_images


def main():
    # 野鳥データを読み込み
    birds_file = '/Users/wao_singapore/yacho-dojo/data/birds_data.csv'
    output_file = '/Users/wao_singapore/yacho-dojo/data/bird_images.csv'
    mapping_file = '/Users/wao_singapore/yacho-dojo/data/bird_id_mapping.json'
    
    fetcher = BirdImageFetcher()
    all_images = []
    
    # bird_id マッピングを読み込み
    with open(mapping_file, 'r', encoding='utf-8') as f:
        bird_mapping = json.load(f)
    
    # CSVから野鳥データを読み込み
    with open(birds_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        birds = list(reader)
    
    # 各野鳥の画像を取得（全690種）
    for i, bird in enumerate(birds):
        scientific_name = bird['scientific_name']
        
        # 実際のbird_idを取得
        if scientific_name in bird_mapping:
            bird_id = bird_mapping[scientific_name]['id']
        else:
            print(f"Warning: {scientific_name} のbird_idが見つかりません")
            continue
        
        images = fetcher.fetch_all_images(scientific_name, bird_id)
        all_images.extend(images)
        
        # 進捗表示
        progress_msg = f"Progress: {i+1}/{len(birds)}"
        print(progress_msg)
        
        # 10種ごとに中間保存（長時間処理のため）
        if (i + 1) % 10 == 0:
            print(f"中間保存: {len(all_images)}件の画像データを処理済み")
        
        # API制限対策
        time.sleep(1)
    
    # CSVファイルに出力
    if all_images:
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
        
        print(f"\n完了: {len(all_images)}件の画像データをCSVに出力しました")
        print(f"出力ファイル: {output_file}")
    else:
        print("画像データが見つかりませんでした")


if __name__ == '__main__':
    main()