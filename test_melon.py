#!/usr/bin/env python3
"""
멜론 크롤러 테스트 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawlers.melon_crawler import MelonCrawler
from target_songs import is_target_song

def test_melon_crawler():
    """멜론 크롤러 테스트"""
    print("멜론 크롤러 테스트 시작...")
    
    crawler = MelonCrawler()
    
    # TOP100 차트 크롤링
    print("\n=== TOP100 차트 크롤링 ===")
    top100_data = crawler.crawl_chart("top_100")
    
    # 타겟 곡 찾기
    target_found = False
    for song in top100_data:
        if is_target_song(song.get('artist', ''), song.get('title', '')):
            print(f"✅ TOP100에서 타겟 곡 발견: {song}")
            target_found = True
            break
    
    if not target_found:
        print("❌ TOP100에서 타겟 곡을 찾을 수 없습니다.")
        # 상위 10곡 출력
        print("\n상위 10곡:")
        for i, song in enumerate(top100_data[:10]):
            print(f"{i+1}. {song.get('artist', 'Unknown')} - {song.get('title', 'Unknown')} ({song.get('rank', 'N/A')}위)")
    
    # HOT100 차트 크롤링
    print("\n=== HOT100 차트 크롤링 ===")
    hot100_data = crawler.crawl_chart("hot_100")
    
    # 타겟 곡 찾기
    target_found = False
    for song in hot100_data:
        if is_target_song(song.get('artist', ''), song.get('title', '')):
            print(f"✅ HOT100에서 타겟 곡 발견: {song}")
            target_found = True
            break
    
    if not target_found:
        print("❌ HOT100에서 타겟 곡을 찾을 수 없습니다.")
        # 상위 10곡 출력
        print("\n상위 10곡:")
        for i, song in enumerate(hot100_data[:10]):
            print(f"{i+1}. {song.get('artist', 'Unknown')} - {song.get('title', 'Unknown')} ({song.get('rank', 'N/A')}위)")

if __name__ == "__main__":
    test_melon_crawler() 