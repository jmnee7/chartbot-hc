#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

# 벅스 차트 직접 테스트
url = "https://music.bugs.co.kr/chart"
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

print("=== 벅스 차트 직접 테스트 ===")
response = requests.get(url, headers=headers, timeout=10)
print(f"Status: {response.status_code}")

soup = BeautifulSoup(response.text, "html.parser")

# 여러 셀렉터 테스트
elements = soup.select("table tbody tr")
print(f"table tbody tr: {len(elements)}개")

if elements:
    for i, elem in enumerate(elements[:5]):
        # 순위
        rank_elem = elem.select_one(".ranking strong")
        rank = rank_elem.text.strip() if rank_elem else "없음"
        
        # 제목
        title_elem = elem.select_one("p.title a")
        title = title_elem.text.strip() if title_elem else "없음"
        
        # 아티스트
        artist_elem = elem.select_one("p.artist a")
        artist = artist_elem.text.strip() if artist_elem else "없음"
        
        print(f"{i+1}. 순위:{rank} 제목:{title} 아티스트:{artist}")
        
        if "CRZY" in title:
            print(f"🎯 CRZY 발견! {rank}위")
