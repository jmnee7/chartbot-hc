document.addEventListener('DOMContentLoaded', () => {
    updateRealTimeChartStatus();
    // 그래프 섹션 제거로 차트 데이터 로드는 비활성화
    // loadChartData();
    loadYouTubeStats(); // 유튜브 통계 로드
    setInterval(updateRealTimeChartStatus, 60000); // 1분마다 업데이트

    // 초기 뷰 설정
    showView('dashboard');
});

function showView(viewId) {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('guide-view').style.display = 'none';

    document.getElementById(`${viewId}-view`).style.display = 'block';

    // 네비게이션 아이템 활성화/비활성화
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.onclick.toString().includes(`'${viewId}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

async function updateRealTimeChartStatus() {
    try {
        const response = await fetch('rank_history.json');
        const historyData = await response.json();
        const timestamps = Object.keys(historyData).sort();

        const latestTimestamp = timestamps[timestamps.length - 1];
        const latestData = historyData[latestTimestamp];

        const services = {
            'melon_top100': { rankId: 'melon-top-rank', badgeId: 'melon-top-badge', changeId: 'melon-top-change' },
            'melon_hot100': { rankId: 'melon-hot-rank', badgeId: 'melon-hot-badge', changeId: 'melon-hot-change' },
            'bugs': { rankId: 'bugs-rank', badgeId: 'bugs-badge', changeId: 'bugs-change' },
            'genie': { rankId: 'genie-rank', badgeId: 'genie-badge', changeId: 'genie-change' },
            'vibe': { rankId: 'vibe-rank', badgeId: 'vibe-badge', changeId: 'vibe-change' },
            'flo': { rankId: 'flo-rank', badgeId: 'flo-badge', changeId: 'flo-change' }
        };

        for (const [service, elements] of Object.entries(services)) {
            const serviceData = latestData[service];
            const rankElement = document.getElementById(elements.rankId);
            const badgeElement = document.getElementById(elements.badgeId);
            const changeElement = document.getElementById(elements.changeId);

            const getRank = (data) => {
                if (!data || !Array.isArray(data) || data.length === 0) return null;
                const rank = data[0].rank;
                return (rank !== undefined && rank !== null) ? rank : null;
            };

            const currentRank = getRank(serviceData);

            if (rankElement && badgeElement) {
                if (currentRank !== null) {
                    rankElement.textContent = currentRank;
                    badgeElement.textContent = '차트인';
                    badgeElement.className = 'rank-badge in-chart';
                } else {
                    rankElement.textContent = '-';
                    badgeElement.textContent = '차트아웃';
                    badgeElement.className = 'rank-badge out-chart';
                }
            }

            if (changeElement) {
                if (timestamps.length > 1) {
                    const previousTimestamp = timestamps[timestamps.length - 2];
                    const previousData = historyData[previousTimestamp][service];
                    const previousRank = getRank(previousData);

                    if (currentRank !== null && previousRank !== null) {
                        const change = previousRank - currentRank;
                        if (change > 0) {
                            changeElement.textContent = `🔺${change}`;
                            changeElement.className = 'rank-change up';
                        } else if (change < 0) {
                            changeElement.textContent = `🔻${Math.abs(change)}`;
                            changeElement.className = 'rank-change down';
                        } else {
                            changeElement.textContent = '-';
                            changeElement.className = 'rank-change';
                        }
                    } else {
                        changeElement.textContent = '';
                    }
                } else {
                    changeElement.textContent = '';
                }
            }
        }

        const d = new Date(latestTimestamp + '+09:00');
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const HH = String(d.getHours()).padStart(2, '0');
        document.getElementById('lastUpdate').textContent = `${yyyy}.${mm}.${dd} ${HH}:00`;

    } catch (error) {
        console.error('실시간 차트 현황 업데이트 실패:', error);
    }
}

function goToStreaming(service) {
    const streamingData = {
        melon: { mobileUrl: 'melonapp://play/album/11814158', webUrl: 'https://www.melon.com/album/detail.htm?albumId=11814158' },
        genie: { mobileUrl: 'genieapp://play/album/11814158', webUrl: 'https://www.genie.co.kr/detail/songInfo?xgnm=37705982' },
        bugs: { mobileUrl: 'bugsapp://play/album/11814158', webUrl: 'https://music.bugs.co.kr/track/34440751' },
        vibe: { mobileUrl: 'vibeapp://play/album/11814158', webUrl: 'https://vibe.naver.com/track/28574653' },
        flo: { mobileUrl: 'floapp://play/album/11814158', webUrl: 'https://www.music-flo.com/detail/track/421503988' }
    };
    const url = /Mobi|Android/i.test(navigator.userAgent) ? streamingData[service].mobileUrl : streamingData[service].webUrl;
    window.open(url, '_blank');
}

function openGroupBuy(type) {
    let message = '';
    switch(type) {
        case 'album':
            message = '앨범 공동구매에 참여하시겠습니까?';
            break;
        case 'streaming':
            message = '스트리밍 패스 공동구매에 참여하시겠습니까?';
            break;
    }
    
    if (confirm(message)) {
        alert('공동구매 참여 신청이 완료되었습니다! 참여자 수가 모집되면 연락드리겠습니다.');
    }
}

// 유튜브 조회수/좋아요 가져오기 (실제 데이터)
async function loadYouTubeStats() {
    try {
        const response = await fetch('youtube_stats.json');
        
        if (response.ok) {
            const data = await response.json();
            
            const viewCountElement = document.getElementById('viewCount');
            const likeCountElement = document.getElementById('likeCount');
            
            if (viewCountElement) {
                viewCountElement.textContent = data.view_count_formatted || '-';
            }
            if (likeCountElement) {
                likeCountElement.textContent = data.like_count_formatted || '-';
            }
            
            console.log('✅ YouTube 통계 로드 성공:', data);
        } else {
            throw new Error('YouTube 통계 파일을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('❌ YouTube 통계 로드 실패:', error);
        
        // 실패한 경우 실시간 순위와 동일하게 "-" 표시
        const viewCountElement = document.getElementById('viewCount');
        const likeCountElement = document.getElementById('likeCount');
        
        if (viewCountElement) {
            viewCountElement.textContent = '-';
        }
        if (likeCountElement) {
            likeCountElement.textContent = '-';
        }
    }
}

// 목표 진행률 UI 제거로 관련 함수 삭제