#!/usr/bin/env python3
"""
벅스 크롤러 디버깅용 테스트 스크립트
"""

import requests
from bs4 import BeautifulSoup
import sys
import os

# 현재 디렉토리를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crawlers.bugs_crawler import BugsCrawler
from target_songs import TARGET_SONG

def test_bugs_crawler():
    print("=== 벅스 크롤러 디버깅 테스트 ===")
    
    crawler = BugsCrawler()
    url = crawler.get_chart_url()
    print(f"크롤링 URL: {url}")
    
    # 실제 요청 테스트
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        print("\n1. HTTP 요청 테스트...")
        response = requests.get(url, headers=headers)
        print(f"상태 코드: {response.status_code}")
        
        if response.status_code != 200:
            print("❌ HTTP 요청 실패")
            return
            
        print("✅ HTTP 요청 성공")
        
        print("\n2. HTML 파싱 테스트...")
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 현재 크롤러의 셀렉터로 요소 찾기
        elements = crawler.get_song_elements(soup)
        print(f"발견된 요소 수: {len(elements)}")
        
        if not elements:
            print("❌ 셀렉터로 요소를 찾을 수 없음")
            print("\n페이지 구조 분석...")
            
            # 다양한 셀렉터 시도
            selectors_to_try = [
                ".list.trackList.chart .track-list li",
                ".trackList li",
                ".chart li",
                ".list li",
                "li",
                "tbody tr"
            ]
            
            for sel in selectors_to_try:
                found = soup.select(sel)
                print(f"  {sel}: {len(found)}개")
                
            # 페이지 제목 확인
            title = soup.find('title')
            if title:
                print(f"\n페이지 제목: {title.text}")
                
            return
        
        print("✅ 요소 발견됨")
        
        print("\n3. 데이터 파싱 테스트...")
        target_song = TARGET_SONG  # 타겟 곡 사용
        print(f"타겟 곡: {target_song['title']} - {target_song['artist']}")
        
        found_ranks = []
        for i, element in enumerate(elements[:10]):  # 상위 10개만 확인
            try:
                data = crawler.parse_song_data(element)
                if data:
                    print(f"  {i+1}: {data.get('rank', '?')}위 - {data.get('title', '?')} - {data.get('artist', '?')}")
                    
                    # 타겟 곡 매칭 확인
                    if crawler.is_target_song(data, target_song):
                        found_ranks.append(data['rank'])
                        print(f"  🎯 타겟 곡 발견! {data['rank']}위")
                        
            except Exception as e:
                print(f"  {i+1}: 파싱 오류 - {e}")
        
        if found_ranks:
            print(f"\n✅ 타겟 곡 순위: {found_ranks}")
        else:
            print(f"\n❌ 타겟 곡을 찾을 수 없음")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_bugs_crawler()
