"""
음악 차트 크롤러 기본 클래스
"""

from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from utils import make_request, validate_song_data, clean_text, safe_int


class BaseCrawler(ABC):
    """
    모든 음악 서비스 크롤러의 기본 클래스
    """
    
    def __init__(self, service_name):
        """
        BaseCrawler 초기화
        
        Args:
            service_name (str): 서비스 이름
        """
        self.service_name = service_name
        self.chart_data = []
    
    @abstractmethod
    def get_chart_url(self, chart_type="top_100"):
        """
        차트 URL을 반환하는 추상 메서드
        
        Args:
            chart_type (str): 차트 유형
            
        Returns:
            str: 차트 URL
        """
        pass
    
    @abstractmethod
    def parse_song_data(self, song_element):
        """
        노래 데이터를 파싱하는 추상 메서드
        
        Args:
            song_element: BeautifulSoup 요소
            
        Returns:
            dict: 파싱된 노래 데이터
        """
        pass
    
    @abstractmethod
    def get_song_elements(self, soup):
        """
        노래 요소들을 추출하는 추상 메서드
        
        Args:
            soup: BeautifulSoup 객체
            
        Returns:
            list: 노래 요소들의 리스트
        """
        pass
    
    def crawl_chart(self, chart_type="top_100"):
        """
        차트를 크롤링하는 메인 메서드
        
        Args:
            chart_type (str): 차트 유형
            
        Returns:
            list: 크롤링된 차트 데이터
        """
        try:
            url = self.get_chart_url(chart_type)
            response = make_request(url)
            
            if not response:
                print(f"Error: Failed to fetch {self.service_name} chart")
                return []
            
            soup = BeautifulSoup(response.text, "html.parser")
            song_elements = self.get_song_elements(soup)
            
            chart_data = []
            for song_element in song_elements:
                try:
                    song_data = self.parse_song_data(song_element)
                    if song_data and validate_song_data(song_data):
                        chart_data.append(song_data)
                except Exception as e:
                    print(f"Error parsing song data from {self.service_name}: {e}")
                    continue
            
            self.chart_data = chart_data
            return chart_data
            
        except Exception as e:
            print(f"Error crawling {self.service_name} chart: {e}")
            return []
    
    def get_chart_data(self):
        """
        현재 차트 데이터를 반환하는 메서드
        
        Returns:
            list: 현재 차트 데이터
        """
        return self.chart_data
    
    def clear_chart_data(self):
        """
        차트 데이터를 초기화하는 메서드
        """
        self.chart_data = []
    
    def get_service_name(self):
        """
        서비스 이름을 반환하는 메서드
        
        Returns:
            str: 서비스 이름
        """
        return self.service_name 