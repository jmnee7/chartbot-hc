"""
멜론 차트 크롤러
"""

from base_crawler import BaseCrawler
from config import URLS
from utils import clean_text, safe_int


class MelonCrawler(BaseCrawler):
    """
    멜론 차트 크롤러
    """
    
    def __init__(self):
        super().__init__("melon")
    
    def get_chart_url(self, chart_type="top_100"):
        """
        멜론 차트 URL 반환
        
        Args:
            chart_type (str): 차트 유형 ('top_100', 'hot_100', 'realtime')
            
        Returns:
            str: 차트 URL
        """
        chart_urls = {
            "top_100": "https://www.melon.com/chart/index.htm",
            "hot_100": "https://www.melon.com/chart/hot100/index.htm",
            "realtime": "https://www.melon.com/chart/index.htm"
        }
        
        return chart_urls.get(chart_type, chart_urls["top_100"])
    
    def get_song_elements(self, soup):
        """
        노래 요소들을 추출
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            list: 노래 요소들의 리스트
        """
        return soup.select("tr[data-song-no]")
    
    def parse_song_data(self, song_element):
        """
        노래 데이터 파싱
        
        Args:
            song_element: BeautifulSoup 요소
            
        Returns:
            dict: 파싱된 노래 데이터
        """
        try:
            # 순위
            rank_element = song_element.select_one(".rank")
            rank = safe_int(rank_element.text) if rank_element else 0
            
            # 제목
            title_element = song_element.select_one(".ellipsis.rank01 a")
            title = clean_text(title_element.text) if title_element else ""
            
            # 아티스트
            artist_element = song_element.select_one(".ellipsis.rank02 a")
            artist = clean_text(artist_element.text) if artist_element else ""
            
            # 앨범
            album_element = song_element.select_one(".ellipsis.rank03 a")
            album = clean_text(album_element.text) if album_element else ""
            
            # 앨범 아트
            albumart_element = song_element.select_one("img")
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
            print(f"Error parsing Melon song data: {e}")
            return None
    
    def crawl_chart(self, chart_type="top_100"):
        """
        멜론 TOP100과 HOT100 차트를 각각 크롤링하여 별도로 반환
        
        Args:
            chart_type (str): 차트 유형 (멜론의 경우 무시하고 두 차트 모두 크롤링)
            
        Returns:
            dict: 각 차트별 크롤링된 데이터 {'top100': [...], 'hot100': [...]}
        """
        from bs4 import BeautifulSoup
        from utils import make_request, validate_song_data
        
        chart_results = {}
        
        # TOP100과 HOT100 차트 각각 크롤링
        chart_types = ["top_100", "hot_100"]
        
        for i, chart in enumerate(chart_types):
            try:
                # 차트 간 딜레이 추가 (Rate limit 방지)
                if i > 0:
                    import time
                    print(f"⏳ {chart} 차트 크롤링 전 2초 대기 중...")
                    time.sleep(2)
                
                chart_name = "TOP100" if chart == "top_100" else "HOT100"
                chart_key = "top100" if chart == "top_100" else "hot100"
                print(f"🎵 [멜론] {chart_name} 차트 크롤링 중...")
                
                url = self.get_chart_url(chart)
                response = make_request(url)
                
                if not response:
                    print(f"❌ [멜론] {chart_name} 차트 요청 실패")
                    chart_results[chart_key] = []
                    continue
                
                soup = BeautifulSoup(response.text, "html.parser")
                song_elements = self.get_song_elements(soup)
                
                chart_songs = []
                for song_element in song_elements:
                    try:
                        song_data = self.parse_song_data(song_element)
                        if song_data and validate_song_data(song_data):
                            # 어떤 차트에서 나온 곡인지 표시
                            song_data['chart_type'] = chart_name
                            chart_songs.append(song_data)
                    except Exception as e:
                        print(f"Error parsing song data from Melon {chart_name}: {e}")
                        continue
                
                chart_results[chart_key] = chart_songs
                print(f"✅ [멜론] {chart_name} 완료: {len(chart_songs)}곡")
                
            except Exception as e:
                print(f"❌ [멜론] {chart_name} 크롤링 실패: {e}")
                # Rate limit 에러인지 확인
                if "429" in str(e) or "rate limit" in str(e).lower():
                    print(f"   🚨 Rate limit 에러! 멜론 {chart_name}에서 요청 제한됨")
                chart_results[chart_key] = []
        
        # 기존 방식과 호환성을 위해 합친 결과도 저장
        all_songs = []
        seen_songs = set()
        
        for chart_key in ["top100", "hot100"]:
            for song in chart_results.get(chart_key, []):
                song_key = f"{song['artist']}_{song['title']}"
                if song_key not in seen_songs:
                    seen_songs.add(song_key)
                    all_songs.append(song)
        
        self.chart_data = all_songs
        self.chart_results = chart_results  # 각 차트별 결과 저장
        return all_songs 