"""
YouTube 데이터 크롤러 - YouTube Data API v3 사용
"""

import os
import requests
import json
from typing import Dict, Optional
from utils import get_current_kst_iso


class YouTubeCrawler:
    """
    YouTube Data API v3를 사용하여 비디오 통계를 가져오는 크롤러
    """
    
    def __init__(self):
        """
        YouTubeCrawler 초기화
        """
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.base_url = "https://www.googleapis.com/youtube/v3/videos"
        
    def is_available(self) -> bool:
        """
        YouTube API 사용 가능 여부 확인
        
        Returns:
            bool: API 키가 설정되어 있는지 여부
        """
        return self.api_key is not None and self.api_key.strip() != ""
    
    def get_video_stats(self, video_id: str) -> Optional[Dict]:
        """
        YouTube 비디오의 통계 정보를 가져옴
        
        Args:
            video_id (str): YouTube 비디오 ID
            
        Returns:
            Dict: 비디오 통계 정보 또는 None
        """
        if not self.is_available():
            print("⚠️ YouTube API 키가 설정되지 않았습니다.")
            print("GitHub Secrets에 YOUTUBE_API_KEY를 추가해주세요.")
            return None
            
        try:
            params = {
                'part': 'statistics,snippet',
                'id': video_id,
                'key': self.api_key
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('items'):
                print(f"❌ 비디오 ID '{video_id}'를 찾을 수 없습니다.")
                return None
                
            item = data['items'][0]
            statistics = item.get('statistics', {})
            snippet = item.get('snippet', {})
            
            # 숫자 포맷팅 (콤마 추가)
            view_count = int(statistics.get('viewCount', 0))
            like_count = int(statistics.get('likeCount', 0))
            
            result = {
                'video_id': video_id,
                'title': snippet.get('title', ''),
                'view_count': view_count,
                'like_count': like_count,
                'view_count_formatted': f"{view_count:,}",
                'like_count_formatted': f"{like_count:,}",
                'last_updated': get_current_kst_iso(),
                'channel_title': snippet.get('channelTitle', ''),
                'published_at': snippet.get('publishedAt', '')
            }
            
            print(f"✅ YouTube 통계 수집 성공: 조회수 {result['view_count_formatted']}, 좋아요 {result['like_count_formatted']}")
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"❌ YouTube API 요청 실패: {e}")
            return None
        except Exception as e:
            print(f"❌ YouTube 통계 수집 오류: {e}")
            return None
    
    def save_stats_to_file(self, video_stats: Dict, output_file: str = "docs/youtube_stats.json"):
        """
        YouTube 통계를 JSON 파일로 저장
        
        Args:
            video_stats (Dict): 비디오 통계 정보
            output_file (str): 저장할 파일 경로
        """
        try:
            # 디렉토리가 없으면 생성
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(video_stats, f, ensure_ascii=False, indent=2)
                
            print(f"📊 YouTube 통계 저장 완료: {output_file}")
            
        except Exception as e:
            print(f"❌ YouTube 통계 저장 실패: {e}")


def get_youtube_stats_for_dashboard():
    """
    대시보드용 YouTube 통계 가져오기 (NCT DREAM - BTTF)
    
    Returns:
        Dict: YouTube 통계 정보
    """
    # NCT DREAM - BTTF 뮤직비디오 ID
    VIDEO_ID = "3rsBWr3JOUI"
    
    crawler = YouTubeCrawler()
    stats = crawler.get_video_stats(VIDEO_ID)
    
    if stats:
        # 파일로 저장
        crawler.save_stats_to_file(stats)
        return stats
    else:
        # API가 실패한 경우 기본값 반환 및 저장 (실시간 순위와 동일하게 "-" 표시)
        print("🔄 YouTube API 실패로 기본값 사용")
        default_stats = {
            'video_id': VIDEO_ID,
            'title': 'NCT DREAM - BTTF',
            'view_count': 0,
            'like_count': 0,
            'view_count_formatted': '-',
            'like_count_formatted': '-',
            'last_updated': get_current_kst_iso()
        }
        
        # 기본값도 파일로 저장
        crawler.save_stats_to_file(default_stats)
        return default_stats


if __name__ == "__main__":
    # 테스트용
    stats = get_youtube_stats_for_dashboard()
    print(f"YouTube 통계: {stats}") 