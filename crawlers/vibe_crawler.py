"""
바이브 차트 크롤러 (XML API 방식)
"""

import xml.etree.ElementTree as ET
import requests
from base_crawler import BaseCrawler
from utils import clean_text, safe_int
from config import COMMON_HEADERS, REQUEST_TIMEOUT


class VibeCrawler(BaseCrawler):
    """
    바이브 차트 크롤러 (XML API 방식)
    """
    
    def __init__(self):
        super().__init__("vibe")
    
    def get_chart_url(self, chart_type="top_100"):
        """
        바이브 차트 API URL 반환
        
        Args:
            chart_type (str): 차트 유형 ('top_100', 'realtime')
            
        Returns:
            str: 차트 API URL
        """
        # API 엔드포인트 사용
        return "https://apis.naver.com/vibeWeb/musicapiweb/vibe/v1/chart/track/total?start=1&display=100"
    
    def crawl_chart(self, chart_type="top_100"):
        """
        바이브 차트를 XML API로 크롤링
        
        Args:
            chart_type (str): 차트 유형
            
        Returns:
            list: 크롤링된 차트 데이터
        """
        try:
            url = self.get_chart_url(chart_type)
            
            # 바이브 API는 특별한 헤더가 필요할 수 있음
            headers = COMMON_HEADERS.copy()
            headers['Referer'] = 'https://vibe.naver.com/'
            
            response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            # XML 파싱
            root = ET.fromstring(response.text)
            
            # XML에서 트랙 데이터 추출
            tracks = root.findall('.//track')
            
            chart_data = []
            for idx, track in enumerate(tracks, 1):
                try:
                    # 트랙 정보 추출
                    track_title = track.find('trackTitle')
                    track_id = track.find('trackId')
                    
                    # 앨범 정보 추출
                    album = track.find('album')
                    album_title = album.find('albumTitle') if album is not None else None
                    image_url = album.find('imageUrl') if album is not None else None
                    
                    # 아티스트 정보 추출
                    artists = track.findall('.//artist')
                    artist_name = ""
                    if artists:
                        artist_name_elem = artists[0].find('artistName')
                        if artist_name_elem is not None:
                            artist_name = artist_name_elem.text
                    
                    song_data = {
                        "rank": idx,
                        "title": clean_text(track_title.text if track_title is not None else ""),
                        "artist": clean_text(artist_name if artist_name else ""),
                        "album": clean_text(album_title.text if album_title is not None else ""),
                        "albumArt": image_url.text if image_url is not None else "",
                        "service": self.service_name
                    }
                    
                    chart_data.append(song_data)
                    
                except Exception as e:
                    print(f"Error parsing Vibe track data: {e}")
                    continue
            
            self.chart_data = chart_data
            return chart_data
            
        except Exception as e:
            print(f"Error crawling Vibe chart: {e}")
            return []
    
    def get_song_elements(self, soup):
        """
        API 방식이므로 사용하지 않음
        """
        return []
    
    def parse_song_data(self, song_element):
        """
        API 방식이므로 사용하지 않음
        """
        return None 