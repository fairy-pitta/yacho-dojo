#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野鳥データ充実化スクリプト

birds.jsonの不足している情報（family, order, english_name等）を
Wikipediaから取得して補完します。
"""

import json
import time
import requests
from typing import Dict, Optional
import re


class BirdDataEnricher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': ('BirdDataEnricher/1.0 '
                           '(https://github.com/example/yacho-dojo)')
        })
        self.delay = 1  # Wikipedia APIへのリクエスト間隔（秒）
    
    def search_wikipedia(self, query: str, lang: str = 'ja') -> Optional[str]:
        """Wikipedia検索を実行し、最初の記事のタイトルを返す"""
        try:
            url = f'https://{lang}.wikipedia.org/w/api.php'
            params = {
                'action': 'query',
                'format': 'json',
                'list': 'search',
                'srsearch': query,
                'srlimit': 1
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('query', {}).get('search'):
                return data['query']['search'][0]['title']
            return None
            
        except Exception as e:
            print(f"Wikipedia検索エラー ({query}): {e}")
            return None
    
    def get_wikipedia_page_info(self, title: str,
                                lang: str = 'ja') -> Optional[Dict]:
        """Wikipediaページの情報を取得（wikitextも含む）"""
        try:
            url = f'https://{lang}.wikipedia.org/w/api.php'
            params = {
                'action': 'query',
                'format': 'json',
                'prop': 'extracts|revisions',
                'titles': title,
                'exintro': True,
                'explaintext': True,
                'exsectionformat': 'plain',
                'rvprop': 'content',
                'rvslots': 'main'
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            pages = data.get('query', {}).get('pages', {})
            if pages:
                page_id = list(pages.keys())[0]
                if page_id != '-1':  # ページが存在する場合
                    page_data = pages[page_id]
                    # wikitextも取得
                    if 'revisions' in page_data and page_data['revisions']:
                        revision = page_data['revisions'][0]['slots']['main']
                        wikitext = revision['*']
                        page_data['wikitext'] = wikitext
                    return page_data
            return None
            
        except Exception as e:
            print(f"Wikipediaページ取得エラー ({title}): {e}")
            return None
    
    def extract_taxonomy_info(self, text: str,
                              wikitext: str = '') -> Dict[str, str]:
        """テキストとwikitextから分類学的情報を抽出"""
        info = {}
        
        # デバッグ用：テキストの一部を表示（必要に応じてコメントアウト）
        # print(f"  → 抽出対象テキスト（最初の500文字）: {text[:500]}...")
        # if wikitext:
        #     print(f"  → wikitext（最初の500文字）: {wikitext[:500]}...")
        
        # wikitextから分類ボックス（Taxobox）の情報を抽出
        if wikitext:
            self._extract_from_wikitext(wikitext, info)
        
        # 通常のテキストからも抽出を試行
        if not info.get('order') or not info.get('family'):
            self._extract_from_plain_text(text, info)
        
        return info
    
    def _extract_from_wikitext(self, wikitext: str, info: Dict[str, str]):
        """wikitextから分類情報を抽出"""
        # Taxoboxや生物分類表から抽出
        taxobox_patterns = [
            r'\|\s*目\s*=\s*([^\|\n]+)',
            r'\|\s*ordo\s*=\s*([^\|\n]+)',
            r'\|\s*order\s*=\s*([^\|\n]+)',
            r'\|\s*科\s*=\s*([^\|\n]+)',
            r'\|\s*familia\s*=\s*([^\|\n]+)',
            r'\|\s*family\s*=\s*([^\|\n]+)',
        ]
        
        for pattern in taxobox_patterns:
            matches = re.findall(pattern, wikitext, re.IGNORECASE)
            for match in matches:
                value = match.strip()
                if ('目' in pattern.lower() or 'order' in pattern.lower() or
                        'ordo' in pattern.lower()):
                    if value and not info.get('order'):
                        # カタカナの目を抽出
                        order_match = re.search(r'([\u30A0-\u30FF]+目)', value)
                        if order_match:
                            info['order'] = order_match.group(1)
                            print(f"  → wikitext から目を抽出: {info['order']}")
                elif ('科' in pattern.lower() or 'family' in pattern.lower() or
                      'familia' in pattern.lower()):
                    if value and not info.get('family'):
                        # カタカナの科を抽出
                        family_match = re.search(r'([\u30A0-\u30FF]+科)', value)
                        if family_match:
                            info['family'] = family_match.group(1)
                            print(f"  → wikitext から科を抽出: {info['family']}")
    
    def _extract_from_plain_text(self, text: str, info: Dict[str, str]):
        """通常のテキストから分類情報を抽出"""
        # 分類表形式での目（Order）の抽出
        # 例: "目 : スズメ目 Passeriformes" または "目：スズメ目"
        if not info.get('order'):
            order_patterns = [
                r'目\s*[：:]\s*([\u30A0-\u30FF]+目)\s*[A-Za-z]*',  # カタカナ+目
                r'目\s*[：:]\s*([\u30A0-\u30FF\u3040-\u309F]+目)',  # ひらがな・カタカナ+目
                r'Order[：:]\s*([A-Za-z]+)\s*(?:[,\n]|科)',
                r'(?:^|\n)([\u30A0-\u30FF]+目)(?:\s|$)',  # 行頭のカタカナ+目
                r'([\u30A0-\u30FF]+目)[\u30A0-\u30FF]+科',  # 「カモ目カモ科」形式
            ]
            
            for pattern in order_patterns:
                matches = re.findall(pattern, text, re.MULTILINE)
                for match in matches:
                    order = match.strip()
                    # カタカナで終わる目のみを抽出（例：スズメ目、カモ目）
                    if (order and order.endswith('目') and
                            len(order) >= 3 and len(order) <= 10 and
                            re.match(r'^[\u30A0-\u30FF]+目$', order)):
                        info['order'] = order
                        print(f"  → テキストから目を抽出: {order}")
                        break
                if 'order' in info:
                    break
        
        # 分類表形式での科（Family）の抽出
        # 例: "科 : ムクドリ科 Sturnidae" または "科：ムクドリ科"
        if not info.get('family'):
            family_patterns = [
                r'科\s*[：:]\s*([\u30A0-\u30FF]+科)\s*[A-Za-z]*',  # カタカナ+科
                r'科\s*[：:]\s*([\u30A0-\u30FF\u3040-\u309F]+科)',  # ひらがな・カタカナ+科
                r'Family[：:]\s*([A-Za-z]+)\s*(?:[,\n]|属)',
                r'(?:^|\n)([\u30A0-\u30FF]+科)(?:\s|$)',  # 行頭のカタカナ+科
                r'[\u30A0-\u30FF]+目([\u30A0-\u30FF]+科)',  # 「カモ目カモ科」形式
            ]
            
            for pattern in family_patterns:
                matches = re.findall(pattern, text, re.MULTILINE)
                for match in matches:
                    family = match.strip()
                    # カタカナで終わる科のみを抽出（例：ムクドリ科、カモ科）
                    if (family and family.endswith('科') and
                            len(family) >= 3 and len(family) <= 15 and
                            re.match(r'^[\u30A0-\u30FF]+科$', family)):
                        info['family'] = family
                        print(f"  → テキストから科を抽出: {family}")
                        break
                if 'family' in info:
                    break
        
        # 英名の抽出
        english_patterns = [
            r'英名[：:]\s*([A-Za-z\s]+?)(?:[、,\n])',
            r'English[：:]\s*([A-Za-z\s]+?)(?:[、,\n])'
        ]
        
        for pattern in english_patterns:
            match = re.search(pattern, text)
            if match:
                english_name = match.group(1).strip()
                if english_name and len(english_name) < 100:
                    info['english_name'] = english_name
                    break
        
        return info
    
    def enrich_bird_data(self, bird: Dict) -> Dict:
        """単一の野鳥データを充実化"""
        japanese_name = bird.get('japanese_name', '')
        scientific_name = bird.get('scientific_name', '')
        
        print(f"処理中: {japanese_name} ({scientific_name})")
        
        # 既に情報が揃っている場合はスキップ
        if (bird.get('family') and bird.get('order') and
                bird.get('english_name') and
                bird.get('family') != '' and bird.get('order') != ''):
            print("  → スキップ（情報が揃っています）")
            return bird
        
        enriched_bird = bird.copy()
        
        # 日本語名で検索
        if japanese_name:
            title = self.search_wikipedia(japanese_name, 'ja')
            if title:
                page_info = self.get_wikipedia_page_info(title, 'ja')
                if page_info and page_info.get('extract'):
                    wikitext = page_info.get('wikitext', '')
                    taxonomy_info = self.extract_taxonomy_info(
                        page_info['extract'], wikitext)
                    
                    # 不足している情報を補完
                    for key, value in taxonomy_info.items():
                        if (not enriched_bird.get(key) or
                                enriched_bird.get(key) == ''):
                            enriched_bird[key] = value
                            print(f"  → {key}: {value}")
                    
                    if not taxonomy_info:
                        print("  → 分類情報が抽出できませんでした")
        
        # 学名でも検索（日本語で情報が見つからない場合）
        if (scientific_name and
                (not enriched_bird.get('family') or
                 not enriched_bird.get('order'))):
            time.sleep(self.delay)  # レート制限対策
            
            title = self.search_wikipedia(scientific_name, 'en')
            if title:
                page_info = self.get_wikipedia_page_info(title, 'en')
                if page_info and page_info.get('extract'):
                    wikitext = page_info.get('wikitext', '')
                    taxonomy_info = self.extract_taxonomy_info(
                        page_info['extract'], wikitext)
                    
                    # 不足している情報を補完
                    for key, value in taxonomy_info.items():
                        if (not enriched_bird.get(key) or
                                enriched_bird.get(key) == ''):
                            enriched_bird[key] = value
                            print(f"  → {key}: {value} (from EN)")
        
        time.sleep(self.delay)  # レート制限対策
        return enriched_bird
    
    def process_birds_file(self, input_file: str, output_file: str,
                           start_index: int = 0, max_birds: int = None):
        """birds.jsonファイルを処理"""
        print(f"野鳥データファイルを読み込み中: {input_file}")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            birds_data = json.load(f)
        
        total_birds = len(birds_data)
        print(f"総野鳥数: {total_birds}")
        
        if max_birds:
            end_index = min(start_index + max_birds, total_birds)
        else:
            end_index = total_birds
        
        print(f"処理範囲: {start_index} - {end_index-1}")
        
        enriched_birds = []
        
        for i in range(start_index, end_index):
            bird = birds_data[i]
            try:
                enriched_bird = self.enrich_bird_data(bird)
                enriched_birds.append(enriched_bird)
                
                # 進捗表示
                if (i - start_index + 1) % 10 == 0:
                    progress = i - start_index + 1
                    total = end_index - start_index
                    print(f"進捗: {progress}/{total} 完了")
                    
            except Exception as e:
                bird_id = bird.get('id', 'unknown')
                print(f"エラー (ID: {bird_id}): {e}")
                enriched_birds.append(bird)  # エラーの場合は元データを保持
        
        # 結果を保存
        print(f"結果を保存中: {output_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(enriched_birds, f, ensure_ascii=False, indent=2)
        
        count = len(enriched_birds)
        print(f"完了: {count} 件の野鳥データを処理しました")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='野鳥データ充実化スクリプト')
    parser.add_argument('--input', '-i', default='data/birds.json',
                        help='入力ファイル')
    parser.add_argument('--output', '-o', default='data/birds_enriched.json',
                        help='出力ファイル')
    parser.add_argument('--start', '-s', type=int, default=0,
                        help='開始インデックス')
    parser.add_argument('--max', '-m', type=int, help='最大処理数')
    
    args = parser.parse_args()
    
    enricher = BirdDataEnricher()
    enricher.process_birds_file(args.input, args.output, args.start, args.max)


if __name__ == '__main__':
    main()