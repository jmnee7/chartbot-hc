"""
지니 차트 크롤러 (전체 200곡)
"""

from base_crawler import BaseCrawler
from config import URLS
from utils import clean_text, safe_int, make_request
from bs4 import BeautifulSoup


class GenieCrawler(BaseCrawler):
    """
    지니 차트 크롤러 (전체 200곡)
    """
    
    def __init__(self):
        super().__init__("genie")
    
    def get_chart_url(self, chart_type="top_100"):
        """
        지니 차트 URL 반환
        
        Args:
            chart_type (str): 차트 유형 ('top_100', 'realtime')
            
        Returns:
            str: 차트 URL
        """
        chart_urls = {
            "top_100": "https://www.genie.co.kr/chart/top200",
            "realtime": "https://www.genie.co.kr/chart/realtime"
        }
        
        return chart_urls.get(chart_type, chart_urls["top_100"])
    
    def crawl_chart(self, chart_type="top_100"):
        """
        지니 차트를 페이지별로 크롤링 (전체 200곡)
        
        Args:
            chart_type (str): 차트 유형
            
        Returns:
            list: 크롤링된 차트 데이터
        """
        try:
            base_url = self.get_chart_url(chart_type)
            all_chart_data = []
            
            # Top100의 경우 2개 페이지만 크롤링 (총 100곡)
            if chart_type == "top_100":
                pages = [1, 2]  # pg=1,2 (총 100곡)
            else:
                pages = [1]  # 실시간 차트는 1페이지만
            
            for page in pages:
                try:
                    # 페이지별 URL 생성
                    if page == 1:
                        url = base_url
                    else:
                        url = f"{base_url}?pg={page}"
                    
                    print(f"Crawling Genie page {page}: {url}")
                    
                    response = make_request(url)
                    if not response:
                        print(f"Failed to fetch Genie page {page}")
                        continue
                    
                    soup = BeautifulSoup(response.text, "html.parser")
                    song_elements = self.get_song_elements(soup)
                    
                    page_data = []
                    for song_element in song_elements:
                        try:
                            song_data = self.parse_song_data(song_element)
                            if song_data and self.validate_song_data_basic(song_data):
                                page_data.append(song_data)
                        except Exception as e:
                            print(f"Error parsing song data from Genie page {page}: {e}")
                            continue
                    
                    all_chart_data.extend(page_data)
                    print(f"Successfully crawled {len(page_data)} songs from Genie page {page}")
                    
                except Exception as e:
                    print(f"Error crawling Genie page {page}: {e}")
                    continue
            
            self.chart_data = all_chart_data
            return all_chart_data
            
        except Exception as e:
            print(f"Error crawling Genie chart: {e}")
            return []
    
    def validate_song_data_basic(self, song_data):
        """
        기본적인 노래 데이터 검증 (rank, title, artist가 있으면 OK)
        
        Args:
            song_data (dict): 노래 데이터
            
        Returns:
            bool: 유효한 데이터인지 여부
        """
        return (song_data.get('rank', 0) > 0 and 
                song_data.get('title', '').strip() != '' and 
                song_data.get('artist', '').strip() != '')
    
    def get_song_elements(self, soup):
        """
        노래 요소들을 추출
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            list: 노래 요소들의 리스트
        """
        return soup.select("tr.list")
    
    def parse_song_data(self, song_element):
        """
        노래 데이터 파싱
        
        Args:
            song_element: BeautifulSoup 요소
            
        Returns:
            dict: 파싱된 노래 데이터
        """
        try:
            # 순위 (공백과 기타 텍스트 제거)
            rank_element = song_element.select_one("td.number")
            if rank_element:
                rank_text = rank_element.text.strip().split()[0]  # 첫 번째 단어만 가져오기
                rank = safe_int(rank_text)
            else:
                rank = 0
            
            # 제목
            title_element = song_element.select_one("td.info a.title")
            title = clean_text(title_element.text) if title_element else ""
            
            # 아티스트
            artist_element = song_element.select_one("td.info a.artist")
            artist = clean_text(artist_element.text) if artist_element else ""
            
            # 앨범
            album_element = song_element.select_one("td.info a.albumtitle")
            album = clean_text(album_element.text) if album_element else ""
            
            # 앨범 아트
            albumart_element = song_element.select_one("a.cover img")
            albumart = albumart_element.get("src") if albumart_element else ""
            
            # 앨범 아트 URL이 상대경로인 경우 절대경로로 변환
            if albumart and albumart.startswith("//"):
                albumart = "https:" + albumart
            
            return {
                "rank": rank,
                "title": title,
                "artist": artist,
                "album": album,
                "albumArt": albumart,
                "service": self.service_name
            }
            
        except Exception as e:
            print(f"Error parsing Genie song data: {e}")
            return None 