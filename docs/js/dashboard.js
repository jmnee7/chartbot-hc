// 디바이스 타입 감지 함수
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 스트리밍 사이트 정보
const streamingData = {
    melon: {
        name: '멜론',
        color: '#00cd3c',
        mobileUrl: 'melonapp://play/album/11814158',
        webUrl: 'https://www.melon.com/album/detail.htm?albumId=11814158',
        image: 'images/melon.jpg'
    },
    genie: {
        name: '지니',
        color: '#ff6b35',
        mobileUrl: 'genieapp://play/album/11814158',
        webUrl: 'https://www.genie.co.kr/detail/songInfo?xgnm=37705982',
        image: 'images/genie.jpg'
    },
    bugs: {
        name: '벅스',
        color: '#ff4757',
        mobileUrl: 'bugsapp://play/album/11814158',
        webUrl: 'https://music.bugs.co.kr/track/34440751',
        image: 'images/bugs.jpg'
    },
    vibe: {
        name: '바이브',
        color: '#8e44ad',
        mobileUrl: 'vibeapp://play/album/11814158',
        webUrl: 'https://vibe.naver.com/track/28574653',
        image: 'images/vibe.jpg'
    },
    flo: {
        name: '플로',
        color: '#00a8ff',
        mobileUrl: 'floapp://play/album/11814158',
        webUrl: 'https://www.music-flo.com/detail/track/421503988',
        image: 'images/flo.jpg'
    }
};

// 바로 스트리밍으로 이동
function goToStreaming(service) {
    const data = streamingData[service];
    if (!data) return;

    const isMobile = isMobileDevice();
    const selectedUrl = isMobile ? data.mobileUrl : data.webUrl;
    const deviceType = isMobile ? '앱' : '웹';

    // 디바이스 타입 알림
    alert(`${data.name} ${deviceType} 버전으로 이동합니다.`);
    
    // 새 탭에서 링크 열기
    window.open(selectedUrl, '_blank');
}

// 가이드 모달 표시
function showGuide(service) {
    const data = streamingData[service];
    if (!data) return;

    const modal = document.getElementById('streamingModal');
    const modalTitle = document.getElementById('modalTitle');
    const streamingImage = document.getElementById('streamingImage');
    const streamingLink = document.getElementById('streamingLink');

    modalTitle.textContent = data.name + ' 스트리밍 가이드';
    streamingImage.src = data.image;
    streamingLink.href = isMobileDevice() ? data.mobileUrl : data.webUrl;
    streamingLink.style.background = data.color;
    
    modal.style.display = 'block';
}

function closeStreamingModal() {
    document.getElementById('streamingModal').style.display = 'none';
}

// 메뉴 네비게이션 함수들
function showMainContent() {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('guideSection').style.display = 'none';
    
    // 메뉴 활성화 상태 변경
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.menu-item').classList.add('active');
}

function showGuideMenu() {
    document.querySelector('.container').style.display = 'none';
    document.getElementById('guideSection').style.display = 'block';
    
    // 메뉴 활성화 상태 변경
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.menu-item')[1].classList.add('active');
    
    // 상위 메뉴 초기화 (음원 가이드 활성화)
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector('.main-tab').classList.add('active');
    currentMainTab = 'music';
    
    // 서비스 탭 초기화
    document.getElementById('musicServiceTabs').style.display = 'flex';
    document.getElementById('otherServiceTabs').style.display = 'none';
    
    // 가이드 탭 숨기기 (음원사이트 선택 전까지)
    document.getElementById('guideTabs').style.display = 'none';
    document.getElementById('deviceTabs').style.display = 'none';
    
    // 이미지 컨테이너 숨기기
    document.querySelector('.guide-content').style.display = 'none';
}

function showAbout() {
    alert('NCT DREAM 차트 추적 시스템\n\nBTF - NCT DREAM\n실시간 차트 추적 및 팬덤 스트리밍 지원 플랫폼\n\nGitHub Actions를 통한 자동 업데이트\n매시간 정각에 차트 데이터 갱신');
}

// 실시간 차트 현황 업데이트 함수
async function updateRealTimeChartStatus() {
    try {
        const response = await fetch('rank_history.json');
        const historyData = await response.json();
        
        // 최신 데이터 가져오기
        const timestamps = Object.keys(historyData).sort();
        const latestTimestamp = timestamps[timestamps.length - 1];
        const latestData = historyData[latestTimestamp];
        
        // 각 서비스별로 업데이트
        const services = {
            'melon_top100': { rankId: 'melon-top-rank', badgeId: 'melon-top-badge' },
            'melon_hot100': { rankId: 'melon-hot-rank', badgeId: 'melon-hot-badge', changeId: 'melon-hot-change' },
            'bugs': { rankId: 'bugs-rank', badgeId: 'bugs-badge', changeId: 'bugs-change' },
            'genie': { rankId: 'genie-rank', badgeId: 'genie-badge' },
            'vibe': { rankId: 'vibe-rank', badgeId: 'vibe-badge' },
            'flo': { rankId: 'flo-rank', badgeId: 'flo-badge' }
        };
        
        for (const [service, elements] of Object.entries(services)) {
            const serviceData = latestData[service];
            const rankElement = document.getElementById(elements.rankId);
            const badgeElement = document.getElementById(elements.badgeId);
            
            // rank 값 추출 함수
            const getRank = (serviceData) => {
                if (!serviceData || !Array.isArray(serviceData) || serviceData.length === 0) {
                    return null;
                }
                const firstItem = serviceData[0];
                // null이 아닌 실제 순위 값만 반환
                return (firstItem.rank !== undefined && firstItem.rank !== null) ? firstItem.rank : null;
            };
            
            const currentRank = getRank(serviceData);
            
            if (currentRank !== null) {
                // 차트인
                rankElement.innerHTML = currentRank;
                badgeElement.textContent = '차트인';
                badgeElement.className = 'rank-badge in-chart';
                
                // 순위 변화 표시 (이전 데이터와 비교)
                if (elements.changeId && timestamps.length > 1) {
                    const previousTimestamp = timestamps[timestamps.length - 2];
                    const previousData = historyData[previousTimestamp];
                    const previousServiceData = previousData[service];
                    const previousRank = getRank(previousServiceData);
                    
                    if (previousRank !== null && previousRank !== currentRank) {
                        const change = previousRank - currentRank;
                        const changeElement = document.getElementById(elements.changeId);
                        if (change > 0) {
                            changeElement.innerHTML = `🔺${change}`;
                            changeElement.className = 'rank-change up';
                        } else if (change < 0) {
                            changeElement.innerHTML = `🔻${Math.abs(change)}`;
                            changeElement.className = 'rank-change down';
                        }
                    }
                }
            } else {
                // 차트아웃
                rankElement.innerHTML = '-';
                badgeElement.textContent = '차트아웃';
                badgeElement.className = 'rank-badge out-chart';
            }
        }
        
        // 마지막 업데이트 시간 표시
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = latestTimestamp;
        }
        
    } catch (error) {
        console.error('실시간 차트 현황 업데이트 실패:', error);
    }
}

// 유튜브 토글 기능
function toggleYoutube() {
    const youtubeSection = document.getElementById('youtubeSection');
    const toggleButton = document.getElementById('youtubeToggle');
    
    if (youtubeSection.classList.contains('minimized')) {
        youtubeSection.classList.remove('minimized');
        toggleButton.textContent = '−';
    } else {
        youtubeSection.classList.add('minimized');
        toggleButton.textContent = '+';
    }
}

// 유튜브 조회수/좋아요 가져오기 (모의 데이터)
function loadYouTubeStats() {
    // 실제 YouTube API 키가 필요한 부분이지만, 임시로 모의 데이터 사용
    setTimeout(() => {
        document.getElementById('viewCount').textContent = '1,234,567';
        document.getElementById('likeCount').textContent = '45,678';
    }, 1000);
}

// 공동구매 모달 함수
function openGroupBuy(type) {
    let message = '';
    switch(type) {
        case 'album':
            message = '앨범 공동구매에 참여하시겠습니까?';
            break;
        case 'streaming':
            message = '스트리밍 패스 공동구매에 참여하시겠습니까?';
            break;
        case 'voting':
            message = '투표 패키지 공동구매에 참여하시겠습니까?';
            break;
    }
    
    if (confirm(message)) {
        alert('공동구매 참여 신청이 완료되었습니다! 참여자 수가 모집되면 연락드리겠습니다.');
    }
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('streamingModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료 - 대시보드 초기화 시작');
    loadYouTubeStats();
    updateRealTimeChartStatus();
    
    // 차트 데이터 로드 (약간의 지연 후)
    setTimeout(function() {
        loadChartData();
    }, 100);
});

// 실시간 데이터 업데이트 (5분마다)
setInterval(async () => {
    try {
        const response = await fetch('rank_history.json');
        const data = await response.json();
        
        // 최신 데이터로 차트 업데이트
        const latestTime = Object.keys(data).sort().pop();
        document.getElementById('lastUpdate').textContent = latestTime;
        
        // 순위 업데이트
        const latest = data[latestTime];
        updateRankDisplays(latest);
        
    } catch (error) {
        console.log('데이터 업데이트 중 오류 발생:', error);
    }
}, 300000); // 5분마다 업데이트

function updateRankDisplays(data) {
    // 새로운 순위 카드 업데이트 로직
    const updateRankCard = (selector, rankData, serviceName) => {
        const card = document.querySelector(selector);
        if (!card) return;

        const rankNumber = card.querySelector('.rank-number');
        const rankChange = card.querySelector('.rank-change');
        const rankBadge = card.querySelector('.rank-badge');

        if (rankData && rankData.rank) {
            rankNumber.textContent = rankData.rank;
            rankBadge.textContent = '차트인';
            rankBadge.className = 'rank-badge in-chart';
        } else {
            rankNumber.textContent = '-';
            rankBadge.textContent = '차트아웃';
            rankBadge.className = 'rank-badge out-chart';
        }
    };

    // 각 사이트별 순위 업데이트
    updateRankCard('.rank-card.melon-top', data.melon_top100?.[0], 'melon_top100');
    updateRankCard('.rank-card.melon-hot', data.melon_hot100?.[0], 'melon_hot100');
    updateRankCard('.rank-card.bugs', data.bugs?.[0], 'bugs');
    updateRankCard('.rank-card.genie', data.genie?.[0], 'genie');
    updateRankCard('.rank-card.vibe', data.vibe?.[0], 'vibe');
    updateRankCard('.rank-card.flo', data.flo?.[0], 'flo');
} 