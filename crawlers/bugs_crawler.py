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
        노래 요소들을 추출 (새로운 구조에 맞게 변경)
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            list: 노래 요소들의 리스트
        """
        return soup.select(".list.trackList.chart .track-list li")
    
    def parse_song_data(self, song_element):
        """
        노래 데이터 파싱 (새로운 구조에 맞게 변경)
        
        Args:
            song_element: BeautifulSoup 요소
            
        Returns:
            dict: 파싱된 노래 데이터
        """
        try:
            # 순위
            rank_element = song_element.select_one(".ranking .num")
            rank = safe_int(rank_element.text) if rank_element else 0
            
            # 제목
            title_element = song_element.select_one(".title a")
            title = clean_text(title_element.text) if title_element else ""
            
            # 아티스트
            artist_element = song_element.select_one(".artist a")
            artist = clean_text(artist_element.text) if artist_element else ""
            
            # 앨범
            album_element = song_element.select_one(".album")
            album = clean_text(album_element.text) if album_element else ""
            
            # 앨범 아트
            albumart_element = song_element.select_one(".thumbnail img")
            albumart = albumart_element.get("src") if albumart_element else ""
            
            return {
                "rank": rank,
                "title": title,
                "artist": artist,
                "album": album,
                "albumArt": albumart,
                "service": self.service_name
            }
            
        except Exception as e:
            print(f"Error parsing Bugs song data: {e}")
            return None 