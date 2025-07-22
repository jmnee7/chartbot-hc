"""
음악 차트 크롤러 공통 설정
"""

# 공통 헤더 설정
COMMON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# 각 서비스별 URL 설정
URLS = {
    "melon": {
        "top_100": "https://www.melon.com/chart/index.htm",
        "hot_100": "https://www.melon.com/chart/hot100/index.htm"
    },
    "genie": {
        "top_100": "https://www.genie.co.kr/chart/top200"
    },
    "bugs": {
        "top_100": "https://music.bugs.co.kr/chart/track/realtime/total"
    },
    "vibe": {
        "top_100": "https://vibe.naver.com/chart/total"
    },
    "flo": {
        "top_100": "https://www.music-flo.com/browse/charts/track/monthly/all"
    }
}

# 타임아웃 설정
REQUEST_TIMEOUT = 30

# 재시도 설정
MAX_RETRIES = 3
RETRY_DELAY = 1
