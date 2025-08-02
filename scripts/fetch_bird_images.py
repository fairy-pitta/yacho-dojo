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
        """Wikimedia画像の詳細情報を取得"""
        try:
            url = 'https://commons.wikimedia.org/w/api.php'
            params = {
                'action': 'query',
                'format': 'json',
                'titles': title,
                'prop': 'imageinfo',
                'iiprop': 'url|extmetadata'
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
                        import re
                        artist = re.sub(r'<[^>]+>', '', artist)
                        
                        return {
                            'image_url': info.get('url', ''),
                            'source': 'Wikimedia Commons',
                            'license': license_name,
                            'photographer': artist,
                            'is_active': True
                        }
                        
        except Exception as e:
            print(f"Error getting Wikimedia image info: {e}")
            
        return None
    
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
                                images.append({
                                    'image_url': photo.get('url', '')
                                    .replace('square', 'original'),
                                    'source': 'iNaturalist',
                                    'license': license_code.upper()
                                    .replace('-', ' '),
                                    'photographer': obs.get('user', {})
                                    .get('login', ''),
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
                                    images.append({
                                        'image_url': media.get('identifier', ''),
                                        'source': 'GBIF Media',
                                        'license': license_info,
                                        'photographer': media.get(
                                            'rightsHolder', ''
                                        ),
                                        'is_active': True
                                    })
                                    
            time.sleep(0.5)  # API制限対策
            
        except Exception as e:
            print(f"GBIF error for {scientific_name}: {e}")
            
        return images
    
    def fetch_all_images(self, scientific_name: str, bird_id: str) -> List[Dict]:
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
    
    fetcher = BirdImageFetcher()
    all_images = []
    
    # CSVから野鳥データを読み込み
    with open(birds_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        birds = list(reader)
    
    # 各野鳥の画像を取得（最初の10種のみテスト）
    for i, bird in enumerate(birds[:10]):
        scientific_name = bird['scientific_name']
        bird_id = str(uuid.uuid4())  # 仮のbird_id
        
        images = fetcher.fetch_all_images(scientific_name, bird_id)
        all_images.extend(images)
        
        # 進捗表示
        progress_msg = f"Progress: {i+1}/{min(10, len(birds))}"
        print(progress_msg)
        
        # API制限対策
        time.sleep(1)
    
    # CSVファイルに出力
    if all_images:
        fieldnames = [
            'id', 'bird_id', 'image_url', 'source', 'license',
            'photographer', 'is_active', 'created_at'
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