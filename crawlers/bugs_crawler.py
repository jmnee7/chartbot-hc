"""
벅스 차트 크롤러
"""

from base_crawler import BaseCrawler
from config import URLS
from utils import clean_text, safe_int


class BugsCrawler(BaseCrawler):
    """
    벅스 차트 크롤러
    """
    
    def __init__(self):
        super().__init__("bugs")
    
    def get_chart_url(self, chart_type="top_100"):
        """
        벅스 차트 URL 반환
        
        Args:
            chart_type (str): 차트 유형 ('top_100', 'realtime')
            
        Returns:
            str: 차트 URL
        """
        chart_urls = {
            "top_100": "https://music.bugs.co.kr/chart",
            "realtime": "https://music.bugs.co.kr/chart"
        }
        
        return chart_urls.get(chart_type, chart_urls["top_100"])
    
    def get_song_elements(self, soup):
        """
        노래 요소들을 추출 (실제 벅스 구조에 맞게 수정)
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            list: 노래 요소들의 리스트
        """
        # 벅스는 tbody tr 구조 사용
        elements = soup.select("tbody tr")
        if elements and len(elements) >= 50:  # 차트는 보통 100개
            print(f"✅ 벅스 크롤러: tbody tr로 {len(elements)}개 요소 발견")
            return elements
        
        print("❌ 벅스 크롤러: tbody tr 요소를 찾을 수 없음")
        return []
    
    def parse_song_data(self, song_element):
        """
        노래 데이터 파싱 (벅스 실제 구조에 맞게 수정)
        
        Args:
            song_element: BeautifulSoup 요소 (tbody tr)
            
        Returns:
            dict: 파싱된 노래 데이터
        """
        try:
            tds = song_element.select("td")
            if len(tds) < 5:
                return None
            
            # 순위 - TD[1]의 div.ranking strong에서 추출
            rank = 0
            rank_element = song_element.select_one("td div.ranking strong")
            if rank_element:
                rank_text = rank_element.get_text(strip=True)
                rank = safe_int(rank_text)
            
            # 제목 - javascript:; 링크의 title 속성에서 추출
            title = ""
            title_link = song_element.select_one("a[href='javascript:;'][title]")
            if title_link:
                title = clean_text(title_link.get("title", ""))
            
            # 아티스트 - 아티스트 링크에서 텍스트 추출
            artist = ""
            artist_link = song_element.select_one("a[href*='artist']")
            if artist_link:
                artist = clean_text(artist_link.get_text(strip=True))
            
            # 앨범 - 앨범 링크에서 텍스트 추출
            album = ""
            album_link = song_element.select_one("a[href*='album'][title]")
            if album_link:
                album = clean_text(album_link.get("title", ""))
            
            # 앨범 아트 - 이미지가 있다면 추출
            albumart = ""
            img_element = song_element.select_one("img")
            if img_element:
                albumart = img_element.get("src", "")
            
            if rank > 0 and title and artist:  # 최소 조건: 순위, 제목, 아티스트
                return {
                    "rank": rank,
                    "title": title,
                    "artist": artist,
                    "album": album,
                    "albumArt": albumart,
                    "service": self.service_name
                }
            
            return None
            
        except Exception as e:
            print(f"Error parsing Bugs song data: {e}")
            return None 