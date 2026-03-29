"""
찾고 싶은 가수와 곡 설정 파일
"""

# 찾고 싶은 가수 (여러 명일 경우 set으로 관리)
TARGET_ARTISTS = {"태용 (TAEYONG)", "해찬 (HAECHAN)"}

# 찾고 싶은 특정 곡 (단일 문자열로 최적화)
TARGET_SONG = "Bitter Sweet (Addiction)"

# 특정 가수의 특정 곡 조합 (가수 set + 곡명)
TARGET_ARTIST_SONG = ({"태용 (TAEYONG)", "해찬 (HAECHAN)"}, "Bitter Sweet (Addiction)")

# 검색 모드 설정 
# "artists" - 지정된 가수들의 모든 곡
# "songs" - 지정된 곡들만 (가수 무관)  
# "artist_songs" - 지정된 가수의 지정된 곡들만
# "all" - 위 모든 조건에 해당하는 곡들
SEARCH_MODE = "artist_songs"

def is_target_song(artist_name, song_title):
    """
    해당 곡이 타겟 곡인지 확인 (단일 문자열 비교로 최적화)
    
    Args:
        artist_name (str): 가수명
        song_title (str): 곡명
        
    Returns:
        bool: 타겟 곡 여부
    """
    artist_clean = artist_name.strip()
    song_clean = song_title.strip()

    # 아티스트명에서 개별 이름 추출 (콤마, | 등으로 구분될 수 있음)
    artist_parts = {a.strip() for a in artist_clean.replace('|', ',').split(',')}

    if SEARCH_MODE == "artists":
        # 지정된 가수 중 한 명이라도 포함되면 매칭
        return bool(artist_parts & TARGET_ARTISTS)

    elif SEARCH_MODE == "songs":
        # 지정된 곡만 (가수 무관)
        return song_clean == TARGET_SONG

    elif SEARCH_MODE == "artist_songs":
        # 지정된 가수의 지정된 곡만
        target_artists, target_song = TARGET_ARTIST_SONG
        return song_clean == target_song and bool(artist_parts & target_artists)

    elif SEARCH_MODE == "all":
        target_artists, target_song = TARGET_ARTIST_SONG
        is_target_artist = bool(artist_parts & TARGET_ARTISTS)
        is_target_song_check = song_clean == TARGET_SONG
        is_specific_combo = song_clean == target_song and bool(artist_parts & target_artists)
        return is_target_artist or is_target_song_check or is_specific_combo

    return False


def get_target_info():
    """
    현재 타겟 설정 정보를 반환
    
    Returns:
        dict: 타겟 설정 정보
    """
    return {
        "search_mode": SEARCH_MODE,
        "target_artists": TARGET_ARTISTS,
        "target_song": TARGET_SONG,
        "target_artist_song": TARGET_ARTIST_SONG
    } 