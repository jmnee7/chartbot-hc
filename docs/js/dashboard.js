document.addEventListener('DOMContentLoaded', () => {
    updateRealTimeChartStatus();
    // 그래프 섹션 제거로 차트 데이터 로드는 비활성화
    // loadChartData();
    loadYouTubeStats(); // 유튜브 통계 로드
    setInterval(updateRealTimeChartStatus, 60000); // 1분마다 업데이트

    // 해시 기반 라우팅 초기화
    initHashRouting();

    // Init banner slider
    initBannerSlider();

    // Modal backdrop close support
    const modal = document.getElementById('gbModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            // 카카오톡/인앱브라우저에서 이벤트 전파 이슈 대응: 컨텐츠 외 영역 클릭 시 닫기
            const content = document.querySelector('#gbModal .modal-content');
            if (!content) return;
            if (!content.contains(e.target)) closeGbModal();
        });
        // ESC 키 닫기 (인앱 일부에서도 동작)
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGbModal(); });
    }
});

// 원클릭 스트리밍 하위 버튼 링크 매핑(링크 전달 시 여기만 채우면 됩니다)
const STREAMING_LINKS = {
    melon: [
        { label: '아이폰', url: 'https://tinyurl.com/tp67xc6x' },
        { label: '안드로이드1', url: 'https://tinyurl.com/5n77rvkp' },
        { label: '안드로이드2', url: 'https://tinyurl.com/bdh26ybr' },
        { label: '안드로이드3', url: 'https://tinyurl.com/57b6ycxm' },
        { label: '안드로이드4', url: 'https://tinyurl.com/4xmnk9kd' },
        { label: 'Window PC1', url: 'https://tinyurl.com/ysb3kvx6' },
        { label: 'Window PC2', url: 'https://tinyurl.com/54fzw6z9' },
        { label: 'Window PC3', url: 'https://tinyurl.com/y9ru7drx' },
        { label: 'Window PC4', url: 'https://tinyurl.com/mr3sj4et' },
        { label: 'Mac PC', url: 'https://tinyurl.com/hjsyn95b' },
        { label: '아이패드', url: 'https://tinyurl.com/ycyrb3hu' }
    ],
    genie: [
        { label: '아이폰', url: 'https://tinyurl.com/bdmp2fzk' },
        { label: '안드로이드', url: 'https://tinyurl.com/cz8fnhez' },
        { label: 'PC', url: 'https://tinyurl.com/8tuk8v76' }
    ],
    bugs: [
        { label: '안드로이드, 아이폰', url: 'https://tinyurl.com/dmm5yyrp' },
        { label: 'PC', url: 'https://tinyurl.com/t8pxtpbf' }
    ],
    vibe: [
        { label: '바이브1', url: 'https://tinyurl.com/42dp5pe3' },
        { label: '바이브2', url: 'https://tinyurl.com/bc96bbvf' },
        { label: '바이브3', url: 'https://tinyurl.com/ycyjsbv3' },
        { label: '바이브4', url: 'https://tinyurl.com/3thdtt2y' }
    ],
    flo: [
        { label: '플로', url: 'https://tinyurl.com/3hwajfyd' }
    ]
};

// 그룹구매 데이터(설명/링크) - 모달/아코디언에서 공통 사용
const GROUPBUY_DATA = {
    applemusic: [
        { label: 'Tin Case Ver.', url: 'https://abit.ly/acaxvd' },
        { label: 'Savory Ver.', url: 'https://abit.ly/fvgwev' },
        { label: 'Full Spread(랜덤) Ver.', url: 'https://abit.ly/rvw5i6' },
        { label: 'Full Spread(세트) Ver.', url: 'https://abit.ly/vvau2w' }
    ],
    allmd: [
        { label: '올엠디 바로가기', url: 'https://buly.kr/9BWCsD7' }
    ],
    minirecord: [
        { label: 'Tin Case Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2326' },
        { label: 'Savory Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2325' },
        { label: 'Full Spread(랜덤) Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2328' },
        { label: 'Full Spread(세트) Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2327' }
    ],
    everline: [
        { label: 'Tin Case Ver.', url: 'https://bit.ly/45XUyWC' },
        { label: 'Savory Ver.', url: 'https://bit.ly/4fJkn01' },
        { label: 'Full Spread(랜덤) Ver.', url: 'https://bit.ly/45XUGp4' },
        { label: 'Full Spread(세트) Ver.', url: 'https://bit.ly/4mQLk40' }
    ]
};

const GROUPBUY_TEXT = {
    minirecord: `미니레코드 공동구매\n\n▪️공구 기간: ~ 9월 7일 23:59 (KST)\n\n▪️공구 특전: 엽서 1종\n\n▪️공구 가격&링크\n💿 Tin Case Ver. 29,700원\nhttp://bit.ly/423DcoR\n\n💿 Savory Ver. 14,500원\nhttps://bit.ly/47mHYl0\n\n💿 Full Spread(랜덤) Ver. 14,500원\nhttps://bit.ly/4pfGPlM\n\n💿 Full Spread(세트) Ver. 43,500원\nhttps://bit.ly/47mg5JH\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`,
    applemusic: `애플뮤직 공동구매\n\n▪️공구 기간: ~ 9월 7일 23:59(KST)\n\n▪️공구 특전: 스티커 1종\n\n🔗공구 가격 & 링크\n💿Tin Case Ver. 30,700원\nhttps://abit.ly/acaxvd\n\n💿 Savory Ver. 14,500원\nhttps://abit.ly/fvgwev\n\n💿 Full Spread(랜덤) Ver. 14,500원\nhttps://abit.ly/rvw5i6\n\n💿 Full Spread(세트) ver. 43,200원\nhttps://abit.ly/vvau2w\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`,
    everline: `에버라인 공동구매\n\n▪️공구 기간: ~ 9월 8일 23:59 (KST)\n\n▪️공구 특전: 핀버튼 3종 중 랜덤 1종\n\n▪️공구 가격&링크\n💿 Tin Case Ver. 30,500₩\nhttps://bit.ly/45XUyWC\n\n💿 Savory Ver. 14,700\nhttps://bit.ly/4fJkn01\n\n💿 Full Spread(랜덤) Ver. 14,700₩\nhttps://bit.ly/45XUGp4\n\n💿 Full Spread(세트) Ver. 43,600₩\nhttps://bit.ly/4mQLk40\n\n* 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로\n최대한 >예약 판매 기간 내에< 많은 구매 부탁드립니다.`,
    allmd: `올엠디 공동구매\n\n▪️공구 기간 : ~ 9월 7일 23:59 (KST)\n\n▪️공구 특전: 스티커 1종\n\n▪️공구 가격\n💿Tin Case Ver. 29,500원\n💿Savory Ver. 14,400원\n💿Full Spread Ver. (랜덤) 14,400원\n💿Full Spread Ver. (세트) 42,600원\n\n🔗공구 링크 \nhttps://buly.kr/9BWCsD7\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`
};

  // 해시 기반 라우팅 초기화
  function initHashRouting() {
    // 브라우저 뒤로가기/앞으로가기 지원
    window.addEventListener('hashchange', handleHashChange);
    
    // 페이지 로드 시 현재 해시에 따라 뷰 설정
    handleHashChange();
  }

  // 해시 변경 처리
  function handleHashChange() {
    const hash = window.location.hash.substring(1); // # 제거
    const parts = hash.split('/'); // guide/id 형태 지원
    const viewId = parts[0];
    const subSection = parts[1];
    
    const validViews = ['dashboard', 'guide', 'event', 'todo', 'streamlist'];
    
    // 유효한 뷰인지 확인, 없으면 dashboard로 기본 설정
    const finalViewId = validViews.includes(viewId) ? viewId : 'dashboard';
    
    // URL 해시가 없거나 잘못된 경우 올바른 해시로 설정 (서브섹션 제외하고)
    if (!hash || !validViews.includes(viewId)) {
      window.location.hash = finalViewId;
      return;
    }
    
    showViewWithoutHash(finalViewId, subSection);
  }

  // 해시 업데이트 없이 뷰만 변경
  function showViewWithoutHash(viewId, subSection) {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('guide-view').style.display = 'none';
    document.getElementById('event-view').style.display = 'none';
    document.getElementById('todo-view').style.display = 'none';

    // streamlist는 guide-view를 사용하므로 별도 처리
    if (viewId !== 'streamlist') {
      const targetView = document.getElementById(`${viewId}-view`);
      if (targetView) {
        targetView.style.display = 'block';
      }
    } else {
      // streamlist는 guide-view를 사용
      document.getElementById('guide-view').style.display = 'block';
    }

    // 네비게이션 아이템 활성화/비활성화
    document.querySelectorAll('.nav-item').forEach(item => {
        // streamlist는 guide 네비게이션을 활성화
        const targetViewForNav = viewId === 'streamlist' ? 'guide' : viewId;
        if (item.onclick.toString().includes(`'${targetViewForNav}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 가이드 페이지이고 서브섹션이 있는 경우
    if (viewId === 'guide' && subSection && typeof switchGuideTab === 'function') {
      // 약간의 딜레이를 주어 DOM이 완전히 로드된 후 실행
      setTimeout(() => {
        switchGuideTab(subSection);
      }, 100);
    }

    // 스트리밍 리스트 페이지인 경우
    if (viewId === 'streamlist') {
      setTimeout(() => {
        showStreamListContent();
      }, 100);
    }

    // todo 페이지인 경우 달력 초기화
    if (viewId === 'todo' && typeof initializeTodoData === 'function' && typeof initializeCalendar === 'function') {
      initializeTodoData();
      initializeCalendar();
    }
  }

  // 기존 showView 함수 - 해시도 함께 업데이트
  function showView(viewId) {
    window.location.hash = viewId;
  }

  // 스트리밍 리스트 콘텐츠 표시 함수
  let currentStreamTab = 'taste';

  function showStreamListContent() {
    // 허브(버튼 그리드) 감추고 상세 이미지만 노출
    const hub = document.querySelector('#guide-view .guide-hub');
    if (hub) hub.style.display = 'none';
    const content = document.querySelector('#guide-view .guide-content');
    if (content) content.style.display = 'block';
    const container = document.querySelector('.guide-image-container');
    const single = document.getElementById('guideImage');

    // 단일 이미지 숨기기
    if (single) {
      single.style.display = 'none';
      single.onclick = null;
      single.src = '';
    }

    if (container) {
      container.innerHTML = '';

      // 탭 버튼 생성
      const tabsDiv = document.createElement('div');
      tabsDiv.className = 'guide-tabs';
      tabsDiv.style.cssText = 'margin-bottom: 16px;';
      tabsDiv.innerHTML = `
        <button class="guide-tab ${currentStreamTab === 'taste' ? 'active' : ''}" onclick="switchStreamTab('taste')">TASTE</button>
        <button class="guide-tab ${currentStreamTab === 'bittersweet' ? 'active' : ''}" onclick="switchStreamTab('bittersweet')">Bitter Sweet</button>
      `;
      container.appendChild(tabsDiv);

      // 콘텐츠 영역
      const contentDiv = document.createElement('div');
      contentDiv.id = 'stream-tab-content';
      container.appendChild(contentDiv);

      renderStreamTabContent(currentStreamTab, contentDiv);
    }
  }

  window.switchStreamTab = switchStreamTab;
  function switchStreamTab(tab) {
    currentStreamTab = tab;
    // 탭 버튼 활성화 업데이트
    document.querySelectorAll('.guide-image-container .guide-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const contentDiv = document.getElementById('stream-tab-content');
    if (contentDiv) {
      renderStreamTabContent(tab, contentDiv);
    }
  }

  function renderStreamTabContent(tab, contentDiv) {
    contentDiv.innerHTML = '';

    if (tab === 'taste') {
      const img = document.createElement('img');
      img.src = 'assets/home/streamlist/streamlist.png';
      img.alt = '스트리밍 리스트 - TASTE';
      img.className = 'guide-image vote-image';
      img.style.cssText = 'width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto;';
      img.onerror = function() {
        contentDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 300px; color: #ef4444; font-size: 0.9rem;">이미지를 불러올 수 없습니다.</div>';
      };
      contentDiv.appendChild(img);
    } else if (tab === 'bittersweet') {
      const img = document.createElement('img');
      img.src = 'assets/home/streamlist/bittersweet.jpeg';
      img.alt = '스트리밍 리스트 - Bitter Sweet';
      img.className = 'guide-image vote-image';
      img.style.cssText = 'width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto;';
      img.onerror = function() {
        contentDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 300px; color: #ef4444; font-size: 0.9rem;">이미지를 불러올 수 없습니다.</div>';
      };
      contentDiv.appendChild(img);
    }
  }

// 마지막으로 확인한 파일 수정 시간 저장
let lastFileModified = null;

async function updateRealTimeChartStatus() {
    try {
        // 먼저 파일 헤더만 확인해서 수정 시간 체크
        const headResponse = await fetch('rank_history.json', { method: 'HEAD' });
        const lastModified = headResponse.headers.get('Last-Modified');
        
        // 파일이 새로 수정되었을 때만 캐시 무효화
        let fetchOptions = {};
        if (lastFileModified && lastModified !== lastFileModified) {
            console.log('새로운 차트 데이터 감지됨, 캐시 무효화');
            fetchOptions = {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            };
        }
        
        lastFileModified = lastModified;
        
        const response = await fetch('rank_history.json', fetchOptions);
        const historyData = await response.json();
        const timestamps = Object.keys(historyData || {}).sort();

        // Helper: set placeholders when no data
        function setEmptyState() {
            const services = {
                'melon_top100': { rankId: 'melon-top-rank', badgeId: 'melon-top-badge', changeId: 'melon-top-change' },
                'melon_hot100': { rankId: 'melon-hot-rank', badgeId: 'melon-hot-badge', changeId: 'melon-hot-change' },
                'bugs': { rankId: 'bugs-rank', badgeId: 'bugs-badge', changeId: 'bugs-change' },
                'genie': { rankId: 'genie-rank', badgeId: 'genie-badge', changeId: 'genie-change' },
                'vibe': { rankId: 'vibe-rank', badgeId: 'vibe-badge', changeId: 'vibe-change' },
                'flo': { rankId: 'flo-rank', badgeId: 'flo-badge', changeId: 'flo-change' }
            };
            for (const elements of Object.values(services)) {
                const rankElement = document.getElementById(elements.rankId);
                const badgeElement = document.getElementById(elements.badgeId);
                const changeElement = document.getElementById(elements.changeId);
                if (rankElement) rankElement.textContent = '-';
                if (badgeElement) { badgeElement.textContent = 'OUT'; badgeElement.className = 'rank-badge out-chart'; }
                if (changeElement) changeElement.textContent = '';
            }
            const last = document.getElementById('lastUpdate');
            if (last) last.textContent = '-';
        }

        if (!timestamps.length) {
            setEmptyState();
            return;
        }

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
                    rankElement.innerHTML = `${currentRank}<span class="rank-unit">위</span>`;
                    badgeElement.textContent = 'IN';
                    badgeElement.className = 'rank-badge in-chart';
                } else {
                    rankElement.textContent = '-';
                    badgeElement.textContent = 'OUT';
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
                    } else if (currentRank !== null && previousRank === null) {
                        // NEW 상태 (차트아웃에서 차트인으로)
                        changeElement.textContent = 'NEW';
                        changeElement.className = 'rank-change new';
                    } else if (currentRank === null && previousRank !== null) {                        // 차트아웃 상태 - 아무 글씨도 표시하지 않음
                        changeElement.textContent = '';
                        changeElement.className = 'rank-change';
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

// Banner slider logic
function initBannerSlider() {
    const slider = document.getElementById('bannerSlider');
    if (!slider) return;
    const slides = Array.from(slider.children);
    const prevBtn = document.getElementById('bannerPrev');
    const nextBtn = document.getElementById('bannerNext');
    const dotsWrap = document.getElementById('bannerDots');
    let index = 0;
    let timerId;

    function updateView() {
        slider.style.transform = `translateX(-${index * 100}%)`;
        Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === index));
    }

    // Dots
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.addEventListener('click', () => { index = i; resetAuto(); updateView(); });
        dotsWrap.appendChild(dot);
    });

    function next() { index = (index + 1) % slides.length; updateView(); }
    function prev() { index = (index - 1 + slides.length) % slides.length; updateView(); }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

    function startAuto() { timerId = setInterval(next, 5000); }
    function stopAuto() { if (timerId) clearInterval(timerId); }
    function resetAuto() { stopAuto(); startAuto(); }

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    updateView();
    startAuto();
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

// Group Buy Modal
function openGroupBuyModal(vendor) {
    const modal = document.getElementById('gbModal');
    const title = document.getElementById('gbTitle');
    const body = document.getElementById('gbBody');
    if (!modal || !title || !body) return;

    // 안전한 링크 변환 유틸
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function linkifyText(text) {
        if (!text) return '';
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlPattern);
        let html = '';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i % 2 === 1) {
                const url = part;
                const safeHref = url.replace(/\"/g, '&quot;');
                html += `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
            } else {
                html += escapeHtml(part);
            }
        }
        return html;
    }

    const data = {
        applemusic: [
            { label: 'Tin Case Ver.', url: 'https://abit.ly/acaxvd' },
            { label: 'Savory Ver.', url: 'https://abit.ly/fvgwev' },
            { label: 'Full Spread(랜덤) Ver.', url: 'https://abit.ly/rvw5i6' },
            { label: 'Full Spread(세트) Ver.', url: 'https://abit.ly/vvau2w' }
        ],
        allmd: [
            { label: '올엠디 바로가기', url: 'https://buly.kr/9BWCsD7' }
        ],
        minirecord: [
            { label: 'Tin Case Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2326' },
            { label: 'Savory Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2325' },
            { label: 'Full Spread(랜덤) Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2328' },
            { label: 'Full Spread(세트) Ver.', url: 'https://minirecord.shop/product/detail.html?product_no=2327' }
        ],
        everline: [
            { label: 'Tin Case Ver.', url: 'https://bit.ly/45XUyWC' },
            { label: 'Savory Ver.', url: 'https://bit.ly/4fJkn01' },
            { label: 'Full Spread(랜덤) Ver.', url: 'https://bit.ly/45XUGp4' },
            { label: 'Full Spread(세트) Ver.', url: 'https://bit.ly/4mQLk40' }
        ]
    };

    // 벤더별 안내 텍스트 (가이드 화면과 동일 데이터)
    const vendorText = {
        minirecord: `미니레코드 공동구매\n\n▪️공구 기간: ~ 9월 7일 23:59 (KST)\n\n▪️공구 특전: 엽서 1종\n\n▪️공구 가격&링크\n💿 Tin Case Ver. 29,700원\nhttp://bit.ly/423DcoR\n\n💿 Savory Ver. 14,500원\nhttps://bit.ly/47mHYl0\n\n💿 Full Spread(랜덤) Ver. 14,500원\nhttps://bit.ly/4pfGPlM\n\n💿 Full Spread(세트) Ver. 43,500원\nhttps://bit.ly/47mg5JH\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`,
        applemusic: `애플뮤직 공동구매\n\n▪️공구 기간: ~ 9월 7일 23:59(KST)\n\n▪️공구 특전: 스티커 1종\n\n🔗공구 가격 & 링크\n💿Tin Case Ver. 30,700원\nhttps://abit.ly/acaxvd\n\n💿 Savory Ver. 14,500원\nhttps://abit.ly/fvgwev\n\n💿 Full Spread(랜덤) Ver. 14,500원\nhttps://abit.ly/rvw5i6\n\n💿 Full Spread(세트) ver. 43,200원\nhttps://abit.ly/vvau2w\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`,
        everline: `에버라인 공동구매\n\n▪️공구 기간: ~ 9월 8일 23:59 (KST)\n\n▪️공구 특전: 핀버튼 3종 중 랜덤 1종\n\n▪️공구 가격&링크\n💿 Tin Case Ver. 30,500₩\nhttps://bit.ly/45XUyWC\n\n💿 Savory Ver. 14,700\nhttps://bit.ly/4fJkn01\n\n💿 Full Spread(랜덤) Ver. 14,700₩\nhttps://bit.ly/45XUGp4\n\n💿 Full Spread(세트) Ver. 43,600₩\nhttps://bit.ly/4mQLk40\n\n* 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로\n최대한 >예약 판매 기간 내에< 많은 구매 부탁드립니다.`,
        allmd: `올엠디 공동구매\n\n▪️공구 기간 : ~ 9월 7일 23:59 (KST)\n\n▪️공구 특전: 스티커 1종\n\n▪️공구 가격\n💿Tin Case Ver. 29,500원\n💿Savory Ver. 14,400원\n💿Full Spread Ver. (랜덤) 14,400원\n💿Full Spread Ver. (세트) 42,600원\n\n🔗공구 링크 \nhttps://buly.kr/9BWCsD7\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`
    };

    const vendorName = {
        applemusic: '애플뮤직', allmd: '올엠디', minirecord: '미니레코드', everline: '에버라인'
    }[vendor] || '공동구매';

    title.textContent = vendorName;
    body.innerHTML = '';
    // 상단 안내 텍스트 추가 (그리드 전체 폭 차지)
    const description = vendorText[vendor];
    if (description) {
        const textDiv = document.createElement('div');
        textDiv.className = 'guide-text';
        textDiv.style.gridColumn = '1 / -1';
        textDiv.innerHTML = linkifyText(description);
        body.appendChild(textDiv);
    }
    (data[vendor] || []).forEach(item => {
        const btn = document.createElement('a');
        btn.className = 'btn';
        btn.href = item.url;
        btn.target = '_blank';
        btn.rel = 'noopener';
        btn.textContent = item.label;
        body.appendChild(btn);
    });
    modal.classList.add('show');
}

// Streaming detail modal (two-step like groupbuy)
function openStreamingModal(service) {
    const modal = document.getElementById('gbModal');
    const title = document.getElementById('gbTitle');
    const body = document.getElementById('gbBody');
    if (!modal || !title || !body) return;

    const serviceName = {
        melon: '멜론',
        genie: '지니',
        bugs: '벅스',
        vibe: '바이브'
    }[service] || '원클릭 스트리밍';

    // 서비스별 하위 버튼 목록
    // 데이터는 STREAMING_LINKS를 사용 (label/url 세트)
    const buttonsByService = STREAMING_LINKS;

    title.textContent = serviceName;
    body.innerHTML = '';

    const items = buttonsByService[service] || [];
    items.forEach(item => {
        const isLinkReady = !!(item && item.url);
        const el = document.createElement(isLinkReady ? 'a' : 'button');
        el.className = 'btn';
        if (isLinkReady) {
            el.href = item.url;
            el.target = '_blank';
            el.rel = 'noopener';
        } else {
            el.type = 'button';
            el.addEventListener('click', function(e){ e.preventDefault(); alert('준비 중입니다.🐻'); });
        }
        el.textContent = item.label || '항목';
        body.appendChild(el);
    });

    modal.classList.add('show');
}

function closeGbModal() { const m = document.getElementById('gbModal'); if (m) m.classList.remove('show'); }

// Unified quick modal (streaming/radio/groupbuy)
function openQuickModal(mode) {
    const modal = document.getElementById('gbModal');
    const title = document.getElementById('gbTitle');
    const body = document.getElementById('gbBody');
    if (!modal || !title || !body) return;

    body.innerHTML = '';
    body.className = '';
    if (mode === 'streaming') {
        title.textContent = '원클릭 스트리밍';
        body.className = 'accordion-group';
        const services = [
            { label: '멜론', key: 'melon' },
            { label: '지니', key: 'genie' },
            { label: '벅스', key: 'bugs' },
            { label: '바이브', key: 'vibe' },
            { label: '플로', key: 'flo' }
        ];
        services.forEach(s => {
            const header = document.createElement('button');
            header.className = 'btn accordion-header';
            header.type = 'button';
            header.textContent = s.label;

            const content = document.createElement('div');
            content.className = 'accordion-content';
            content.style.maxHeight = '0px';

            const grid = document.createElement('div');
            grid.className = 'guide-grid';

            // 멜론의 경우 안내 메시지 추가
            if (s.key === 'melon') {
                const noticeDiv = document.createElement('div');
                noticeDiv.style.cssText = 'text-align: center; margin-bottom: 10px; font-size: 12px; color: #666; font-style: italic; width: 100%;';
                noticeDiv.textContent = '빈화면 뜰 시 새로고침 해주세요!';
                content.appendChild(noticeDiv);
                
                const orderDiv = document.createElement('div');
                orderDiv.style.cssText = 'text-align: center; margin-bottom: 15px; font-size: 12px; color: #666; font-style: italic; width: 100%;';
                orderDiv.textContent = '🐻 순서대로 클릭 🐻';
                content.appendChild(orderDiv);
            }
            
            // 바이브의 경우 안내 메시지 추가
            if (s.key === 'vibe') {
                const orderDiv = document.createElement('div');
                orderDiv.style.cssText = 'text-align: center; margin-bottom: 15px; font-size: 12px; color: #666; font-style: italic; width: 100%;';
                orderDiv.textContent = '🐻 순서대로 클릭 🐻';
                content.appendChild(orderDiv);
            }

            (STREAMING_LINKS[s.key] || []).forEach(item => {
                const isLinkReady = !!(item && item.url);
                const el = document.createElement(isLinkReady ? 'a' : 'button');
                el.className = 'btn';
                el.textContent = item.label || '항목';
                if (isLinkReady) {
                    el.href = item.url;
                    el.target = '_blank';
                    el.rel = 'noopener';
                } else {
                    el.type = 'button';
                    el.addEventListener('click', function(e){ e.preventDefault(); alert('준비 중입니다.🐻'); });
                }
                grid.appendChild(el);
            });

            content.appendChild(grid);

            header.addEventListener('click', function(){
                const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
                if (isOpen) {
                    content.style.maxHeight = '0px';
                    header.classList.remove('open');
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    header.classList.add('open');
                }
            });

            body.appendChild(header);
            body.appendChild(content);
        });
    } else if (mode === 'radio') {
        title.textContent = '원클릭 라디오 신청';
        body.className = 'guide-grid';

        const ua = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        const isAndroid = /Android/i.test(ua);
        const isMacOS = /Macintosh|Mac OS X/i.test(ua);
        // 안드로이드는 smsto:, 그 외(iOS/맥/데스크톱)는 sms:
        const scheme = isAndroid ? 'smsto:' : 'sms:';
        const sep = isAndroid ? '?' : '&';
        const smsBody = encodeURIComponent('NCT 해찬의 CRZY 신청합니다.');

        function createSmsButton(label, rawNumber) {
            // iOS/맥/데스크톱은 '#' 그대로, Android는 인코딩
            const recipient = (isAndroid ? encodeURIComponent(rawNumber) : rawNumber);
            const href = `${scheme}${recipient}${sep}body=${smsBody}`;
            const a = document.createElement('a');
            a.className = 'btn';
            a.href = href;
            a.textContent = label;
            a.target = '_self';
            // 일부 브라우저/인앱에서 스킴 링크가 무시되는 경우를 대비한 강제 네비게이션
            a.addEventListener('click', function(e){
                try {
                    e.preventDefault();
                    window.location.href = href;
                } catch (err) {
                    // 무시
                }
            });
            return a;
        }

        body.appendChild(createSmsButton('KBS', '#8910'));
        body.appendChild(createSmsButton('MBC', '#8000'));
        body.appendChild(createSmsButton('SBS', '#1077'));
    } else if (mode === 'groupbuy') {
        title.textContent = '공동구매';
        body.className = 'accordion-group';
        const vendors = [
            { label: '미니레코드', key: 'minirecord' },
            { label: '애플뮤직', key: 'applemusic' },
            { label: '에버라인', key: 'everline' },
            { label: '올엠디', key: 'allmd' }
        ];
        vendors.forEach(v => {
            const header = document.createElement('button');
            header.className = 'btn accordion-header';
            header.type = 'button';
            header.textContent = v.label;

            const content = document.createElement('div');
            content.className = 'accordion-content';
            content.style.maxHeight = '0px';

            const grid = document.createElement('div');
            grid.className = 'guide-grid';

            // 상단 안내 텍스트
            const description = GROUPBUY_TEXT[v.key];
            if (description) {
                const textDiv = document.createElement('div');
                textDiv.className = 'guide-text';
                textDiv.style.gridColumn = '1 / -1';
                textDiv.innerHTML = (function linkifyText(text){
                    const urlPattern = /(https?:\/\/[^\s]+)/g;
                    const parts = String(text).split(urlPattern);
                    let html = '';
                    for (let i = 0; i < parts.length; i++) {
                        const part = parts[i];
                        if (i % 2 === 1) {
                            const url = part;
                            const safeHref = url.replace(/\"/g, '&quot;');
                            html += `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${url}</a>`;
                        } else {
                            html += part;
                        }
                    }
                    return html;
                })(description);
                grid.appendChild(textDiv);
            }

            (GROUPBUY_DATA[v.key] || []).forEach(item => {
                const a = document.createElement('a');
                a.className = 'btn';
                a.href = item.url;
                a.target = '_blank';
                a.rel = 'noopener';
                a.textContent = item.label;
                grid.appendChild(a);
            });

            content.appendChild(grid);

            header.addEventListener('click', function(){
                const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
                if (isOpen) {
                    content.style.maxHeight = '0px';
                    header.classList.remove('open');
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    header.classList.add('open');
                }
            });

            body.appendChild(header);
            body.appendChild(content);
        });
    }

    modal.classList.add('show');
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