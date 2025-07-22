"""
트위터 봇 모듈 - 순위 변화를 트윗으로 알림
"""

import os
import tweepy
from datetime import datetime
from typing import Dict, List, Optional


class TwitterBot:
    """
    음악 차트 순위 변화를 트위터로 알리는 봇
    """
    
    # 서비스 이름 매핑 상수 (성능 최적화)
    SERVICE_NAMES = {
        "melon_top100": "멜론 TOP100",
        "melon_hot100": "멜론 HOT100", 
        "melon": "멜론",
        "genie": "지니",
        "bugs": "벅스",
        "vibe": "바이브",
        "flo": "플로"
    }
    
    def __init__(self):
        """
        TwitterBot 초기화
        """
        self.api = None
        self.client = None
        self.setup_twitter_api()
    
    def setup_twitter_api(self):
        """
        Twitter API 설정
        """
        try:
            # 환경변수에서 API 키 가져오기
            api_key = os.getenv('TWITTER_API_KEY')
            api_secret = os.getenv('TWITTER_API_SECRET')
            access_token = os.getenv('TWITTER_ACCESS_TOKEN')
            access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
            bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
            
            if not all([api_key, api_secret, access_token, access_token_secret]):
                print("⚠️ Twitter API 키가 설정되지 않았습니다.")
                print("환경변수를 설정하거나 GitHub Secrets에 추가해주세요:")
                print("- TWITTER_API_KEY")
                print("- TWITTER_API_SECRET") 
                print("- TWITTER_ACCESS_TOKEN")
                print("- TWITTER_ACCESS_TOKEN_SECRET")
                print("- TWITTER_BEARER_TOKEN")
                return
            
            # Twitter API v1.1 (트윗 작성용)
            auth = tweepy.OAuthHandler(api_key, api_secret)
            auth.set_access_token(access_token, access_token_secret)
            self.api = tweepy.API(auth, wait_on_rate_limit=True)
            
            # Twitter API v2 (선택사항)
            if bearer_token:
                self.client = tweepy.Client(
                    bearer_token=bearer_token,
                    consumer_key=api_key,
                    consumer_secret=api_secret,
                    access_token=access_token,
                    access_token_secret=access_token_secret,
                    wait_on_rate_limit=True
                )
            
            # API 연결 테스트
            try:
                self.api.verify_credentials()
                print("✅ Twitter API 연결 성공!")
            except Exception as e:
                print(f"❌ Twitter API 연결 실패: {e}")
                self.api = None
                
        except Exception as e:
            print(f"❌ Twitter API 설정 오류: {e}")
            self.api = None
    
    def is_available(self) -> bool:
        """
        Twitter API 사용 가능 여부 확인
        
        Returns:
            bool: API 사용 가능 여부
        """
        return self.api is not None
    
    def format_rank_change_tweet(self, rank_changes: Dict, current_time: Optional[str] = None) -> List[str]:
        """
        순위 변화를 트윗 형식으로 포맷팅 (변화 없어도 현재 순위 표시)
        
        Args:
            rank_changes (Dict): 순위 변화 정보
            current_time (str): 현재 시간
            
        Returns:
            List[str]: 트윗 내용 리스트
        """
        if current_time is None:
            current_time = datetime.now().strftime("%H:%M")
        
        # 날짜 시간 포맷 (YYMMDD HH:MM)
        today = datetime.now().strftime("%y%m%d")
        formatted_time = f"{today} {current_time}"
        
        tweets = []
        
        # 모든 타겟 곡들 수집 (변화 유무 상관없이, 효율적인 처리)
        all_target_songs = {}
        
        for service_key, changes in rank_changes.items():
            for change_info in changes:
                song_key = f"{change_info.get('artist', '')} - {change_info.get('title', '')}"
                
                if song_key not in all_target_songs:
                    all_target_songs[song_key] = []
                
                all_target_songs[song_key].append({
                    'service': self.SERVICE_NAMES.get(service_key, service_key),
                    'rank': change_info.get('rank', 0),
                    'change_text': change_info.get('change_text', ''),
                    'previous_rank': change_info.get('previous_rank', 0),
                    'timestamp': change_info.get('timestamp', '')
                })
        
        # 모든 타겟 곡에 대해 트윗 생성
        for song_key, song_changes in all_target_songs.items():
            tweet_parts = [
                formatted_time,
                ""
            ]
            
            for change in song_changes:
                service = change['service']
                rank = change['rank']
                change_text = change['change_text']
                
                # 변화 텍스트에 따른 포맷팅 (효율적인 처리)
                tweet_parts.append(self._format_service_line(service, rank, change_text))
            
            tweet_content = "\n".join(tweet_parts)
            
            # 트윗 길이 제한 (280자)
            if len(tweet_content) <= 280:
                tweets.append(tweet_content)
            else:
                # 길면 줄여서 작성 (서비스별 정보 축약)
                short_tweet = [
                    formatted_time,
                    ""
                ]
                
                for change in song_changes:
                    service = change['service']
                    rank = change['rank']
                    
                    if rank is None:  # 차트아웃
                        short_tweet.append(f"{service} ❌")
                    else:
                        short_tweet.append(f"{service} {rank}위")
                
                tweets.append("\n".join(short_tweet))
        
        return tweets
    
    def _format_service_line(self, service: str, rank: Optional[int], change_text: str) -> str:
        """
        서비스별 순위 변화 라인 포맷팅 (중복 로직 제거)
        
        Args:
            service (str): 서비스 이름
            rank (Optional[int]): 현재 순위
            change_text (str): 변화 텍스트
            
        Returns:
            str: 포맷팅된 라인
        """
        if rank is None:  # 차트아웃
            return f"{service} ❌ (-)"
        elif change_text.startswith('↑'):
            change_num = change_text[1:]
            return f"{service} {rank}위 (🔺{change_num})"
        elif change_text.startswith('↓'):
            change_num = change_text[1:]
            return f"{service} {rank}위 (🔻{change_num})"
        elif change_text == "-":
            return f"{service} {rank}위 (-)"
        elif change_text == "NEW":
            return f"{service} {rank}위 (NEW)"
        else:
            return f"{service} {rank}위 ({change_text})"
    
    def is_tweet_time(self) -> bool:
        """
        트윗 가능한 시간대인지 확인 (새벽 6시 ~ 오후 10시)
        
        Returns:
            bool: 트윗 가능 시간 여부
        """
        current_hour = datetime.now().hour
        return 6 <= current_hour <= 22
    
    def tweet_rank_changes(self, rank_changes: Dict, current_time: Optional[str] = None) -> bool:
        """
        순위 변화를 트윗으로 전송 (시간대 제한 포함)
        
        Args:
            rank_changes (Dict): 순위 변화 정보
            current_time (str): 현재 시간
            
        Returns:
            bool: 전송 성공 여부
        """
        if not self.is_available():
            print("❌ Twitter API를 사용할 수 없습니다.")
            return False
        
        # 시간대 체크
        if not self.is_tweet_time():
            current_hour = datetime.now().hour
            print(f"🌙 현재 시간 {current_hour:02d}시는 트윗 금지 시간대입니다. (허용: 06시~22시)")
            return True
        
        tweets = self.format_rank_change_tweet(rank_changes, current_time)
        
        if not tweets:
            print("📊 타겟 곡이 차트에 없어서 트윗하지 않습니다.")
            return True
        
        success_count = 0
        
        for i, tweet_content in enumerate(tweets):
            try:
                # 트윗 전송
                if self.client:
                    # API v2 사용
                    response = self.client.create_tweet(text=tweet_content)
                    print(f"✅ 트윗 {i+1}/{len(tweets)} 전송 성공! (ID: {response.data['id']})")
                else:
                    # API v1.1 사용
                    status = self.api.update_status(tweet_content)
                    print(f"✅ 트윗 {i+1}/{len(tweets)} 전송 성공! (ID: {status.id})")
                
                success_count += 1
                
                # 트윗 내용 출력
                print("📝 트윗 내용:")
                print("-" * 40)
                print(tweet_content)
                print("-" * 40)
                
            except Exception as e:
                print(f"❌ 트윗 {i+1}/{len(tweets)} 전송 실패: {e}")
        
        return success_count == len(tweets)
    
    def send_test_tweet(self) -> bool:
        """
        테스트 트윗 전송
        
        Returns:
            bool: 전송 성공 여부
        """
        if not self.is_available():
            print("❌ Twitter API를 사용할 수 없습니다.")
            return False
        
        test_content = f"🤖 음악차트 봇 테스트\n📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n#테스트 #음악차트봇"
        
        try:
            if self.client:
                response = self.client.create_tweet(text=test_content)
                print(f"✅ 테스트 트윗 전송 성공! (ID: {response.data['id']})")
            else:
                status = self.api.update_status(test_content)
                print(f"✅ 테스트 트윗 전송 성공! (ID: {status.id})")
            
            print("📝 테스트 트윗 내용:")
            print("-" * 40)
            print(test_content)
            print("-" * 40)
            
            return True
            
        except Exception as e:
            print(f"❌ 테스트 트윗 전송 실패: {e}")
            return False 