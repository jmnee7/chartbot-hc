"""
트위터 봇 모듈 - 순위 변화를 트윗으로 알림
"""

import os
import tweepy
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from utils import get_current_timestamp, get_current_kst_timestamp_short, get_current_kst_iso


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
    
    def __init__(self, last_tweet_file="docs/last_tweet_timestamp.json"):
        """
        TwitterBot 초기화
        """
        self.api = None
        self.client = None
        self.last_tweet_file = last_tweet_file
        self.setup_twitter_api()

    def _get_last_tweet_timestamp(self) -> Optional[str]:
        """
        마지막 트윗 전송 시간을 파일에서 로드
        """
        if os.path.exists(self.last_tweet_file):
            try:
                with open(self.last_tweet_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('last_tweet_timestamp')
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading last tweet timestamp: {e}")
        return None

    def _save_last_tweet_timestamp(self, timestamp: str):
        """
        마지막 트윗 전송 시간을 파일에 저장
        """
        os.makedirs(os.path.dirname(self.last_tweet_file), exist_ok=True)
        try:
            with open(self.last_tweet_file, 'w', encoding='utf-8') as f:
                json.dump({'last_tweet_timestamp': timestamp}, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Error saving last tweet timestamp: {e}")
    
    def setup_twitter_api(self):
        """
        Twitter API 설정 (OAuth 1.0a 우선, Bearer Token 보조)
        """
        try:
            # 환경변수에서 API 키 가져오기
            api_key = os.getenv('TWITTER_API_KEY')
            api_secret = os.getenv('TWITTER_API_SECRET')
            access_token = os.getenv('TWITTER_ACCESS_TOKEN')
            access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
            bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
            
            # OAuth 1.0a 필수 키 확인
            if not all([api_key, api_secret, access_token, access_token_secret]):
                print("⚠️ Twitter OAuth 1.0a 키가 설정되지 않았습니다.")
                print("GitHub Secrets에 다음을 추가해주세요:")
                print("- TWITTER_API_KEY")
                print("- TWITTER_API_SECRET") 
                print("- TWITTER_ACCESS_TOKEN")
                print("- TWITTER_ACCESS_TOKEN_SECRET")
                print("\n💡 Bearer Token은 선택사항입니다 (TWITTER_BEARER_TOKEN)")
                return
            
            # Twitter API v1.1 (OAuth 1.0a - 만료 없음, 안정적)
            auth = tweepy.OAuthHandler(api_key, api_secret)
            auth.set_access_token(access_token, access_token_secret)
            self.api = tweepy.API(auth, wait_on_rate_limit=True)
            
            # Twitter API v2 (Bearer Token - 선택사항, 만료 있음)
            if bearer_token:
                try:
                    self.client = tweepy.Client(
                        bearer_token=bearer_token,
                        consumer_key=api_key,
                        consumer_secret=api_secret,
                        access_token=access_token,
                        access_token_secret=access_token_secret,
                        wait_on_rate_limit=True
                    )
                    print("✅ Twitter API v2 (Bearer Token) 설정 완료")
                except Exception as e:
                    print(f"⚠️ Bearer Token 설정 실패 (API v1.1만 사용): {e}")
                    self.client = None
            else:
                print("ℹ️ Bearer Token이 없어서 API v1.1만 사용합니다")
                self.client = None
            
            # API 연결 테스트 (OAuth 1.0a)
            try:
                user = self.api.verify_credentials()
                print(f"✅ Twitter API v1.1 연결 성공! (@{user.screen_name})")
            except Exception as e:
                print(f"❌ Twitter API v1.1 연결 실패: {e}")
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
        # KST 현재 시간 (utils 함수 사용)
        kst_iso = get_current_kst_iso()
        now_kst = datetime.fromisoformat(kst_iso)

        if current_time is None:
            # 정각으로 강제 조정 (예: 11:32 -> 11:00)
            current_time = now_kst.replace(minute=0, second=0, microsecond=0).strftime("%H:%M")
        
        # 날짜 시간 포맷 (YYMMDD HH:00) - 정각으로 표시
        today = now_kst.strftime("%y%m%d")
        formatted_time = f"{today} {current_time}"
        
        tweets = []

        # 유튜브 조회수 한 줄 텍스트 준비 (있으면 포함)
        youtube_line = self._get_youtube_view_line()

        # 트윗 제목 프리픽스: 현재 크롤링 중인 곡명 사용 (기본값 없음)
        title_prefix = self._extract_title_from_changes(rank_changes)
        
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
            tweet_parts = [f"{title_prefix} | {formatted_time}", ""]
            
            for change in song_changes:
                service = change['service']
                rank = change['rank']
                change_text = change['change_text']
                
                # 변화 텍스트에 따른 포맷팅 (효율적인 처리)
                tweet_parts.append(self._format_service_line(service, rank, change_text))
            
            # 하단에 유튜브 조회수 및 해시태그 추가
            tweet_parts.append("")
            if youtube_line:
                tweet_parts.append(youtube_line)
            tweet_parts.append("")
            tweet_parts.append("#HAECHAN #해찬")
            tweet_parts.append("#CRZY #HAECHAN_CRZY")
            
            tweet_content = "\n".join(tweet_parts)
            
            # 트윗 길이 제한 (280자)
            if len(tweet_content) <= 280:
                tweets.append(tweet_content)
            else:
                # 길면 줄여서 작성 (서비스별 정보 축약)
                short_tweet = [f"{title_prefix} | {formatted_time}", ""]
                
                for change in song_changes:
                    service = change['service']
                    rank = change['rank']
                    
                    if rank is None:  # 차트아웃
                        short_tweet.append(f"{service} ❌")
                    else:
                        short_tweet.append(f"{service} {rank}위")
                
                # 하단에 유튜브/해시태그 추가
                short_tweet.append("")
                if youtube_line:
                    short_tweet.append(youtube_line)
                short_tweet.append("")
                short_tweet.append("#HAECHAN #해찬")
                short_tweet.append("#CRZY #HAECHAN_CRZY")
                tweets.append("\n".join(short_tweet))
        
        return tweets

    def _extract_title_from_changes(self, rank_changes: Dict) -> Optional[str]:
        """
        rank_changes 구조에서 현재 대상 곡 제목을 추출
        Returns: 곡명 문자열 또는 None
        """
        try:
            for service_key, changes in (rank_changes or {}).items():
                if changes and isinstance(changes, list):
                    first = changes[0]
                    title = first.get('title') if isinstance(first, dict) else None
                    if title:
                        return title
        except Exception:
            pass
        return None

    def _get_youtube_view_line(self) -> Optional[str]:
        """
        docs/youtube_stats.json에서 최신 조회수를 읽어 트윗용 한 줄을 생성
        Returns: '🎬 뮤비 조회수 123,456' 형태의 문자열 또는 None
        """
        stats_path = os.path.join('docs', 'youtube_stats.json')
        try:
            if not os.path.exists(stats_path):
                return None
            with open(stats_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            # 우선 형식화된 값 사용, 없으면 숫자를 포맷팅
            formatted = data.get('view_count_formatted')
            if not formatted:
                count = data.get('view_count')
                if isinstance(count, int):
                    formatted = f"{count:,}"
                elif isinstance(count, str) and count.isdigit():
                    formatted = f"{int(count):,}"
            if formatted:
                return f"🎬 뮤비 조회수 {formatted}"
            return None
        except Exception:
            return None
    
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
        트윗 허용 시간대인지 확인 (KST 기준)
        - 시작 시각: 2025-09-08 21:00 KST 이후 (9시부터)
        - 동작 시간대: 매일 09:00 ~ 익일 01:59 (포함)
        """
        try:
            now_kst = datetime.fromisoformat(get_current_kst_iso())
            # 1) 날짜 조건: 2025-09-08 21:00 이후 (9시부터)
            allow_from = datetime(2025, 9, 8, 21, 0, 0)
            if now_kst < allow_from:
                return False
            # 2) 시간대 조건: 09:00~23:59 또는 00:00~01:59
            hour = now_kst.hour
            in_window = (hour >= 9) or (hour <= 1)
            return in_window
        except Exception:
            # 시간 계산 실패 시 보수적으로 전송을 막지 않음
            return True

    def tweet_rank_changes(self, rank_changes: Dict, current_time: Optional[str] = None) -> bool:
        """
        순위 변화를 트윗으로 전송 (시간대 및 중복 트윗 방지 포함)
        
        Args:
            rank_changes (Dict): 순위 변화 정보
            current_time (str): 현재 시간
            
        Returns:
            bool: 전송 성공 여부
        """
        if not self.is_available():
            print("❌ Twitter API를 사용할 수 없습니다.")
            return False

        # KST 현재 시간 (정각으로 맞춤, utils 함수 사용)
        current_hour_str = get_current_kst_timestamp_short()  # KST 정각 형식 (2025-07-24 22:00)
        now_kst = datetime.fromisoformat(get_current_kst_iso())

        # 허용 시작 시각 및 시간대 체크 (이전에는 전송하지 않음)
        if not self.is_tweet_time():
            print("⏸️ 현재는 트윗 허용 시간이 아닙니다. (기준: 2025-09-08 21:00 이후, 매일 09:00~01:59)")
            return True

        # 같은 시간대에 이미 트윗을 보냈는지 확인
        last_tweet_timestamp = self._get_last_tweet_timestamp()
        if last_tweet_timestamp == current_hour_str:
            print(f"ℹ️ {current_hour_str}에 이미 트윗을 보냈습니다. 중복 트윗을 건너뜁니다.")
            return True

        # 트윗 내용도 정각 시간으로 표시하기 위해 None 전달 (자동 정각 계산)
        tweets = self.format_rank_change_tweet(rank_changes, None)

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

        if success_count > 0: # 하나라도 성공하면 시간 저장
            self._save_last_tweet_timestamp(current_hour_str)

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
        
        # KST 현재 시간 (utils 함수 사용)
        now_kst = datetime.fromisoformat(get_current_kst_iso())
        test_content = f"🤖 음악차트 봇 테스트\n📅 {now_kst.strftime('%Y-%m-%d %H:%M')}\n\n#테스트 #음악차트봇"
        
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