"""
음악 차트 크롤러 공통 유틸리티 함수
"""

import requests
import time
from config import COMMON_HEADERS, REQUEST_TIMEOUT, MAX_RETRIES, RETRY_DELAY


def make_request(url, headers=None, max_retries=MAX_RETRIES):
    """
    HTTP 요청을 보내고 응답을 반환하는 함수
    
    Args:
        url (str): 요청할 URL
        headers (dict): 요청 헤더 (기본값: COMMON_HEADERS)
        max_retries (int): 최대 재시도 횟수
        
    Returns:
        requests.Response: HTTP 응답 객체
    """
    if headers is None:
        headers = COMMON_HEADERS
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise e
            print(f"요청 실패 (시도 {attempt + 1}/{max_retries}): {e}")
            time.sleep(RETRY_DELAY)
    
    return None


def validate_song_data(song_data):
    """
    노래 데이터의 유효성을 검증하는 함수
    
    Args:
        song_data (dict): 노래 데이터
        
    Returns:
        bool: 유효한 데이터인지 여부
    """
    required_fields = ['rank', 'title', 'artist', 'album', 'albumArt']
    
    for field in required_fields:
        if field not in song_data or not song_data[field]:
            return False
    
    return True


def clean_text(text):
    """
    텍스트를 정리하는 함수
    
    Args:
        text (str): 정리할 텍스트
        
    Returns:
        str: 정리된 텍스트
    """
    if not text:
        return ""
    
    return text.strip().replace('\n', ' ').replace('\t', ' ')


def safe_int(value):
    """
    안전하게 정수로 변환하는 함수
    
    Args:
        value: 변환할 값
        
    Returns:
        int: 변환된 정수 (변환 실패 시 0)
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0


from datetime import datetime, timedelta

def get_current_timestamp():
    """
    현재 한국 시간(KST)을 정각으로 맞춘 문자열로 반환하는 함수
    
    Returns:
        str: 현재 KST 시간 (YYYY-MM-DD HH:00:00 형식)
    """
    # UTC 현재 시간
    now_utc = datetime.utcnow()
    # KST (UTC+9)로 변환
    now_kst = now_utc + timedelta(hours=9)
    # 분과 초를 0으로 설정하여 정각으로 맞춤
    return now_kst.replace(minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:00:00')


def get_current_kst_timestamp_short():
    """
    현재 한국 시간(KST)을 정각으로 맞춘 짧은 형식 문자열로 반환하는 함수
    
    Returns:
        str: 현재 KST 시간 (YYYY-MM-DD HH:00 형식)
    """
    # UTC 현재 시간
    now_utc = datetime.utcnow()
    # KST (UTC+9)로 변환
    now_kst = now_utc + timedelta(hours=9)
    # 분과 초를 0으로 설정하여 정각으로 맞춤
    return now_kst.replace(minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:00')


def get_current_kst_iso():
    """
    현재 한국 시간(KST)을 ISO 형식으로 반환하는 함수 (로그용)
    
    Returns:
        str: 현재 KST 시간 (ISO 형식)
    """
    # UTC 현재 시간
    now_utc = datetime.utcnow()
    # KST (UTC+9)로 변환
    now_kst = now_utc + timedelta(hours=9)
    return now_kst.isoformat() 