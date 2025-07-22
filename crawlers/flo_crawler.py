"""
플로 차트 크롤러 (API 방식)
"""

import json
import requests
from base_crawler import BaseCrawler
from utils import clean_text, safe_int
from config import COMMON_HEADERS, REQUEST_TIMEOUT


class FloCrawler(BaseCrawler):
    """
    플로 차트 크롤러 (API 방식)
    """
    
    def __init__(self):
        super().__init__("flo")
    
    def get_chart_url(self, chart_type="top_100"):
        """
        플로 차트 API URL 반환
        
        Args:
            chart_type (str): 차트 유형 ('top_100', 'realtime')
            
        Returns:
            str: 차트 API URL
        """
        # API 엔드포인트 사용
        return "https://www.music-flo.com/api/display/v1/browser/chart/1/track/list?size=100"
    
    def crawl_chart(self, chart_type="top_100"):
        """
        플로 차트를 API로 크롤링
        
        Args:
            chart_type (str): 차트 유형
            
        Returns:
            list: 크롤링된 차트 데이터
        """
        try:
            url = self.get_chart_url(chart_type)
            response = requests.get(url, headers=COMMON_HEADERS, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            # JSON 데이터에서 트랙 리스트 추출
            if 'data' in data and 'trackList' in data['data']:
                track_list = data['data']['trackList']
                
                chart_data = []
                for idx, track in enumerate(track_list, 1):
                    try:
                        # 앨범 아트 URL 추출 (가장 큰 사이즈 사용)
                        album_art_url = ""
                        if 'album' in track and 'imgList' in track['album'] and track['album']['imgList']:
                            # 가장 큰 사이즈 이미지 사용
                            album_art_url = track['album']['imgList'][-1]['url']
                        
                        # 아티스트 이름 추출
                        artist_name = ""
                        if 'representationArtist' in track:
                            artist_name = track['representationArtist']['name']
                        
                        song_data = {
                            "rank": idx,
                            "title": clean_text(track.get('name', '')),
                            "artist": clean_text(artist_name),
                            "album": clean_text(track.get('album', {}).get('title', '')),
                            "albumArt": album_art_url,
                            "service": self.service_name
                        }
                        
                        chart_data.append(song_data)
                        
                    except Exception as e:
                        print(f"Error parsing Flo track data: {e}")
                        continue
                
                self.chart_data = chart_data
                return chart_data
            
            return []
            
        except Exception as e:
            print(f"Error crawling Flo chart: {e}")
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