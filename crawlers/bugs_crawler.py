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
        노래 요소들을 추출 (다양한 셀렉터 시도)
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            list: 노래 요소들의 리스트
        """
        # 여러 가능한 셀렉터들을 순서대로 시도
        selectors = [
            ".list.trackList.chart .track-list li",  # 기존 셀렉터
            ".trackList tbody tr",                   # 테이블 기반 구조
            ".list tbody tr",                        # 일반적인 테이블 구조
            "tbody tr",                              # 가장 일반적인 테이블 행
            ".chart-list li",                        # 차트 리스트
            ".track-item",                           # 트랙 아이템
            "tr.list"                                # 리스트 행
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            if elements and len(elements) > 10:  # 최소 10개 이상의 요소가 있어야 유효
                print(f"✅ 벅스 크롤러: {selector}로 {len(elements)}개 요소 발견")
                return elements
        
        print("❌ 벅스 크롤러: 유효한 셀렉터를 찾을 수 없음")
        return []
    
    def parse_song_data(self, song_element):
        """
        노래 데이터 파싱 (다양한 셀렉터 시도)
        
        Args:
            song_element: BeautifulSoup 요소
            
        Returns:
            dict: 파싱된 노래 데이터
        """
        try:
            # 순위 - 여러 셀렉터 시도
            rank = 0
            rank_selectors = [
                ".ranking .num", ".num", "td:first-child", ".rank", 
                "td.check + td", "td[class*='rank']"
            ]
            for selector in rank_selectors:
                rank_element = song_element.select_one(selector)
                if rank_element:
                    rank = safe_int(rank_element.text)
                    if rank > 0:
                        break
            
            # 제목 - 여러 셀렉터 시도
            title = ""
            title_selectors = [
                ".title a", ".title", "a[href*='track']", 
                "td.title a", ".song-title", "td:nth-child(2) a"
            ]
            for selector in title_selectors:
                title_element = song_element.select_one(selector)
                if title_element:
                    title = clean_text(title_element.text)
                    if title:
                        break
            
            # 아티스트 - 여러 셀렉터 시도
            artist = ""
            artist_selectors = [
                ".artist a", ".artist", "a[href*='artist']", 
                "td.artist a", ".song-artist", "td:nth-child(3) a"
            ]
            for selector in artist_selectors:
                artist_element = song_element.select_one(selector)
                if artist_element:
                    artist = clean_text(artist_element.text)
                    if artist:
                        break
            
            # 앨범 - 여러 셀렉터 시도
            album = ""
            album_selectors = [
                ".album", "a[href*='album']", "td.album", 
                ".song-album", "td:nth-child(4)"
            ]
            for selector in album_selectors:
                album_element = song_element.select_one(selector)
                if album_element:
                    album = clean_text(album_element.text)
                    if album:
                        break
            
            # 앨범 아트 - 여러 셀렉터 시도
            albumart = ""
            albumart_selectors = [
                ".thumbnail img", "img", "td img", ".album-art img"
            ]
            for selector in albumart_selectors:
                albumart_element = song_element.select_one(selector)
                if albumart_element:
                    albumart = albumart_element.get("src", "")
                    if albumart:
                        break
            
            if rank > 0 and title and artist:
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