// 전역 변수로 현재 선택된 서비스와 가이드 타입 저장
let currentService = 'melon';
let currentGuideType = 'streaming';
let currentMainTab = 'music';
let currentDevice = 'mobile';
let currentIdCategory = null; // 'dualnumber' | 'id'
let currentIdDetail = null;   // nested detail (e.g., 'kt', 'skt', 'lgu+', 'melon', ...)

// 사용 가능한 가이드 파일 목록
const availableGuides = {
    music: {
        melon: ['pc', 'mobile'],
        genie: ['pc', 'mobile'],
        bugs: ['pc', 'mobile'],
        vibe: ['pc', 'mobile'],
        kakao: ['mobile'] // 카카오는 모바일만
    },
    mv: {
        melon: ['pc', 'mobile'],
        bugs: ['pc'] // 벅스는 PC만
    }
};

// 서비스 이름 매핑
const serviceNames = {
    melon: '멜론',
    genie: '지니',
    bugs: '벅스',
    vibe: '바이브',
    flo: '플로',
    youtube: '유튜브',
    kakao: '카카오뮤직'
};

// 가이드 타입 이름 매핑
const typeNames = {
    streaming: '스트리밍',
    music: '음원 다운로드',
    mv: '뮤비 다운로드',
    vote: '투표',
    id: '아이디 찾기',
    stability: '끊김 방지',
    groupbuy: '공동구매'
};

// 안전한 링크 변환: 일반 텍스트 중 URL을 클릭 가능한 앵커로 변환
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
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
            const safeHref = url.replace(/"/g, '&quot;');
            html += `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
        } else {
            html += escapeHtml(part);
        }
    }
    return html;
}

// Encode only the filename segment to safely handle spaces/plus signs/Korean
function encodeFilePath(path) {
    if (!path) return path;
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) return encodeURIComponent(path);
    const dir = path.slice(0, lastSlash + 1);
    const file = path.slice(lastSlash + 1);
    return dir + encodeURIComponent(file);
}

// Preload vote guide images to prevent flicker on tab switch
(function preloadVoteImages(){
    try {
        const sources = [
            'assets/guide/vote/뮤빗1.png',
            'assets/guide/vote/뮤빗2.png',
            'assets/guide/vote/스타플래닛1.png',
            'assets/guide/vote/스타플래닛2.png',
            'assets/guide/vote/아이돌챔프1.png',
            'assets/guide/vote/아이돌챔프2.png',
            'assets/guide/vote/팬캐스트 투표권 모으기.png',
            'assets/guide/vote/팬캐스트 투표하기.png',
            'assets/guide/vote/하이어1.png',
            'assets/guide/vote/하이어2.png',
            'assets/guide/vote/엠카운트다운.png'
        ].map(encodeFilePath);
        sources.forEach(src => { const img = new Image(); img.src = src; });
    } catch (_) {}
})();

// Preload groupbuy images to speed up first render
(function preloadGroupBuyImages(){
    try {
        const sources = [
            'assets/guide/groupbuy/미니레코드 국문.png',
            'assets/guide/groupbuy/미니레코드 영문.png',
            'assets/guide/groupbuy/애플뮤직 국문.png',
            'assets/guide/groupbuy/애플뮤직 영문.png',
            'assets/guide/groupbuy/에버라인 국문.png',
            'assets/guide/groupbuy/에버라인 영문.png',
            'assets/guide/groupbuy/올엠디.png'
        ].map(encodeFilePath);
        sources.forEach(src => { const img = new Image(); img.decoding = 'async'; img.src = src; });
    } catch (_) {}
})();

// Preload ID guide images (first-view stability)
(function preloadIdGuideImages(){
    try {
        const idFiles = [
            'assets/guide/generateid/dualnumber/202508_듀얼넘버생성_skt.png',
            'assets/guide/generateid/dualnumber/202508_듀얼넘버생성_lgu+.png',
            'assets/guide/generateid/dualnumber/202508_듀얼넘버생성_kt.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_멜론.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_지니.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_벅스.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_바이브.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_플로.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_카카오뮤직01.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_카카오뮤직02.png',
            'assets/guide/generateid/id/아이디생성가이드_202508ver_카카오뮤직03.png'
        ].map(encodeFilePath);
        idFiles.forEach(src => { const img = new Image(); img.decoding = 'async'; img.src = src; });
    } catch (_) {}
})();

// 상위 메뉴 탭 전환 함수
function switchMainTab(tab) {
    currentMainTab = tab;
    
    // 모든 상위 메뉴 탭 비활성화
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 클릭된 탭 활성화
    event.target.closest('.main-tab').classList.add('active');
    
    // 서비스 탭 전환
    // 요청에 따라 불필요한 상단 서비스 탭은 숨김
    document.getElementById('musicServiceTabs').style.display = 'none';
    document.getElementById('etcServiceTabs').style.display = 'none';
    
    // 가이드 탭과 이미지 컨테이너 숨기기
    document.getElementById('guideTabs').style.display = 'none';
    document.getElementById('deviceTabs').style.display = 'none';
    document.querySelector('.guide-content').style.display = 'none';
}

// 서비스 탭 제거됨: 더 이상 사용하지 않음

// 가이드 탭 전환 함수 (탭 UI는 제거되었으나 내부 라우팅용으로 유지)
function switchGuideTab(type) {
    currentGuideType = type;
    
    // 모든 가이드 탭 비활성화
    document.querySelectorAll('.guide-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 클릭된 탭 활성화 (inline handler가 아닌 호출 대비)
    if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
    }
    
    // 가이드 타이틀/소제목은 제거 상태 유지 (요청사항)

    // 아이디 가이드 특수 처리 (중첩 탭)
    const idCategoryTabs = document.getElementById('idCategoryTabs');
    const idDetailTabs = document.getElementById('idDetailTabs');
    const voteDetailTabs = document.getElementById('voteDetailTabs');
    const streamingGrid = document.getElementById('streaming-grid');
    const idGrid = document.getElementById('id-grid');
    const downloadGrid = document.getElementById('download-grid');
    const voteGrid = document.getElementById('vote-grid');
    const otherGrid = document.getElementById('other-grid');
    const groupbuyGrid = document.getElementById('groupbuy-grid');

    // 먼저 모두 숨김 및 이미지 영역 초기화(잔상 제거)
    [streamingGrid, idGrid, downloadGrid, voteGrid, otherGrid, groupbuyGrid].forEach(el => { if (el) el.style.display = 'none'; });
    const container = document.querySelector('.guide-image-container');
    const single = document.getElementById('guideImage');
    const guideTextBox = document.getElementById('guideText');
    if (container) {
        Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
    }
    // 기본 이미지 요소는 초기에는 숨김 (빈 src로 인한 엑박 방지)
    if (single) { single.style.display = 'none'; single.src = ''; single.onclick = null; }
    // 공동구매 전용 텍스트는 기본적으로 숨김/초기화 (다른 탭 잔상 제거)
    if (guideTextBox) { guideTextBox.style.display = 'none'; guideTextBox.innerHTML = ''; }
    if (type === 'id') {
        if (idGrid) idGrid.style.display = 'block';
        // 1단계: 카테고리 탭 렌더링 (구 그리드 사용)
        if (idCategoryTabs) {
            idCategoryTabs.style.display = 'flex';
            idCategoryTabs.innerHTML = `
                <button class="service-tab" data-idcat="dualnumber">듀얼 넘버 생성</button>
                <button class="service-tab" data-idcat="id">아이디 생성</button>
            `;
            // 이벤트 바인딩
            Array.from(idCategoryTabs.querySelectorAll('button')).forEach(btn => {
                btn.addEventListener('click', () => {
                    Array.from(idCategoryTabs.querySelectorAll('button')).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentIdCategory = btn.getAttribute('data-idcat');
                    // 그리드 기반 하위 메뉴 렌더링 (버튼 테두리 없는 텍스트형)
                    openIdCategoryGrid(currentIdCategory, null);
                });
            });
            // 기본 선택
            const firstBtn = idCategoryTabs.querySelector('button');
            if (firstBtn && typeof firstBtn.click === 'function') firstBtn.click();
        }
        // idCategoryTabs 요소가 없는 현재 마크업에서는 기존 그리드의 첫 버튼을 자동 선택
        if (!idCategoryTabs && idGrid) {
            const firstCatBtn = idGrid.querySelector('.guide-grid .guide-item');
            if (firstCatBtn && typeof firstCatBtn.click === 'function') firstCatBtn.click();
        }

        // 디바이스 탭 숨기기
        document.getElementById('deviceTabs').style.display = 'none';
        if (idDetailTabs) { idDetailTabs.style.display = 'none'; idDetailTabs.innerHTML = ''; }
        // 가이드 콘텐츠 표시
        document.querySelector('.guide-content').style.display = 'block';
        if (voteDetailTabs) voteDetailTabs.style.display = 'none';
        // 안정화: 첫 진입 시 기본 선택 보장 (듀얼넘버 > SKT)
        if (!currentIdCategory && !currentIdDetail) {
            // 즉시 표시를 위해 상태를 직접 설정 후 업데이트
            currentIdCategory = 'dualnumber';
            currentIdDetail = 'skt';
            updateGuideImage();
            // UI 버튼 활성화는 비동기로 보정
            setTimeout(() => { try { openIdCategoryGrid('dualnumber', null); selectIdDetail('skt'); } catch(_){} }, 0);
        }
        return;
    } else {
        if (idCategoryTabs) idCategoryTabs.style.display = 'none';
        if (idDetailTabs) { idDetailTabs.style.display = 'none'; idDetailTabs.innerHTML=''; }
    }

    // 공동구매 가이드
    if (type === 'groupbuy') {
        if (groupbuyGrid) groupbuyGrid.style.display = 'block';
        // 기본(첫 번째) 버튼 자동 선택 - 투표 가이드와 동일한 방식
        if (groupbuyGrid) {
            const firstGridBtn = groupbuyGrid.querySelector('.guide-item');
            if (firstGridBtn && typeof firstGridBtn.click === 'function') firstGridBtn.click();
        }
        document.getElementById('deviceTabs').style.display = 'none';
        document.querySelector('.guide-content').style.display = 'block';
        return;
    }

    // 투표 가이드 하위 탭
    if (type === 'vote') {
        if (voteGrid) voteGrid.style.display = 'block';
        // 기본(첫 번째) 버튼 자동 선택
        if (voteGrid) {
            const firstGridBtn = voteGrid.querySelector('.guide-item');
            if (firstGridBtn && typeof firstGridBtn.click === 'function') firstGridBtn.click();
        }
        document.getElementById('deviceTabs').style.display = 'none';
        document.querySelector('.guide-content').style.display = 'block';
        return;
    } else {
        if (voteDetailTabs) voteDetailTabs.style.display = 'none';
    }

    // 디바이스 탭 표시 (음원 다운로드나 뮤비 다운로드인 경우)
    if (type === 'music' || type === 'mv') {
        if (downloadGrid) downloadGrid.style.display = 'block';
        // 기본(첫 번째) 버튼 자동 선택 - 투표 가이드와 동일한 방식
        if (downloadGrid) {
            const firstGridBtn = downloadGrid.querySelector('.guide-item');
            if (firstGridBtn && typeof firstGridBtn.click === 'function') firstGridBtn.click();
        }
        const availableDevices = availableGuides[type][currentService];
        if (availableDevices && availableDevices.length > 1) {
            // PC/모바일 둘 다 있는 경우
            document.getElementById('deviceTabs').style.display = 'flex';
            
            // 디바이스 탭 초기화
            document.querySelectorAll('.device-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 첫 번째 디바이스 탭 활성화 (모바일 우선)
            const mobileTab = document.querySelector('.device-tab[data-device="mobile"]');
            if (mobileTab) {
                mobileTab.classList.add('active');
                currentDevice = 'mobile';
            }
        } else {
            // 하나만 있는 경우
            document.getElementById('deviceTabs').style.display = 'none';
            currentDevice = availableDevices[0];
        }
        
        // 가이드 이미지 업데이트
        updateGuideImage();
        document.querySelector('.guide-content').style.display = 'block';
    } else {
        // 스트리밍이나 아이디 찾기인 경우
        document.getElementById('deviceTabs').style.display = 'none';
        if (type === 'streaming') {
            if (streamingGrid) streamingGrid.style.display = 'block';
            document.querySelector('.guide-content').style.display = 'none';
        } else {
            updateGuideImage();
            document.querySelector('.guide-content').style.display = 'block';
        }
    }
}

// 디바이스 탭 전환 함수
function switchDeviceTab(device) {
    currentDevice = device;
    
    // 모든 디바이스 탭 비활성화
    document.querySelectorAll('.device-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 클릭된 탭 활성화
    event.target.classList.add('active');
    
    // 가이드 이미지 업데이트
    updateGuideImage();
}

// 가이드 텍스트 박스 초기화 (공동구매가 아닌 경우 숨김)
function hideGuideTextBox() {
    const textBox = document.getElementById('guideText');
    if (textBox) {
        textBox.style.display = 'none';
        textBox.innerHTML = '';
    }
}

// 가이드 이미지 업데이트 함수
function updateGuideImage() {
    // 공동구매가 아닌 경우 텍스트 박스 숨김
    if (currentGuideType !== 'groupbuy') {
        hideGuideTextBox();
    }
    
    // 투표 가이드로 인해 추가된 다중 이미지가 있다면 정리하고 단일 이미지 모드로 복구
    const container = document.querySelector('.guide-image-container');
    if (container) {
        Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
    }
    const single = document.getElementById('guideImage');
    if (single) single.style.display = '';
    let imagePath;
    if (currentGuideType === 'id') {
        // 중첩된 아이디 가이드 이미지 매핑
        if (currentIdCategory === 'dualnumber') {
            const map = {
                'kt': '202508_듀얼넘버생성_kt.png',
                'lgu+': '202508_듀얼넘버생성_lgu+.png',
                'skt': '202508_듀얼넘버생성_skt.png'
            };
            const file = map[currentIdDetail];
            if (file) {
                imagePath = encodeFilePath(`assets/guide/generateid/dualnumber/${file}`);
            }
        } else if (currentIdCategory === 'id') {
            // 카카오뮤직은 3장, 나머지는 1장
            if (currentIdDetail === 'kakao') {
                const kakaoList = [
                    '아이디생성가이드_202508ver_카카오뮤직01.png',
                    '아이디생성가이드_202508ver_카카오뮤직02.png',
                    '아이디생성가이드_202508ver_카카오뮤직03.png'
                ].map(f => encodeFilePath(`assets/guide/generateid/id/${f}`));
                // 단일 이미지 숨기고 다중 이미지로 렌더
                const container = document.querySelector('.guide-image-container');
                const single = document.getElementById('guideImage');
                if (container) {
                    Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
                }
                if (single) { single.style.display = 'none'; single.onclick = null; single.src = ''; }
                if (container) {
                    kakaoList.forEach(src => {
                        const img = document.createElement('img');
                        img.src = src;
                        img.alt = '카카오뮤직 아이디 생성 가이드';
                        img.className = 'guide-image vote-image';
                        container.appendChild(img);
                    });
                }
                return; // 조기 종료 (단일 이미지 경로 설정 생략)
            } else {
                const map = {
                    'melon': '아이디생성가이드_202508ver_멜론.png',
                    'vibe': '아이디생성가이드_202508ver_바이브.png',
                    'bugs': '아이디생성가이드_202508ver_벅스.png',
                    'genie': '아이디생성가이드_202508ver_지니.png',
                    'flo': '아이디생성가이드_202508ver_플로.png'
                };
                const file = map[currentIdDetail];
                if (file) {
                    imagePath = encodeFilePath(`assets/guide/generateid/id/${file}`);
                }
            }
        }
    } else if (currentGuideType === 'streaming') {
        imagePath = `guide/streaming/${currentService}-stream.jpg`;
    } else if (currentGuideType === 'stability') {
        // 끊김 방지 가이드는 공통 리소스 사용
        imagePath = `guide/etc/musicwave.png`;
    } else if (currentGuideType === 'music') {
        const availableDevices = availableGuides.music[currentService];
        if (availableDevices && availableDevices.length === 1) {
            // 하나만 있는 경우 (카카오 뮤직 등)
            imagePath = `guide/down/music/${currentService}-${availableDevices[0]}.png`;
        } else {
            // PC/모바일 둘 다 있는 경우
            imagePath = `guide/down/music/${currentService}-${currentDevice}.png`;
        }
    } else if (currentGuideType === 'mv') {
        const availableDevices = availableGuides.mv[currentService];
        if (availableDevices && availableDevices.length === 1) {
            // 하나만 있는 경우 (벅스 PC만)
            imagePath = `guide/down/mv/${currentService}-${availableDevices[0]}.png`;
        } else {
            // PC/모바일 둘 다 있는 경우
            imagePath = `guide/down/mv/${currentService}-${currentDevice}.png`;
        }
    } else if (currentGuideType === 'vote') {
        // vote 하위 탭에서 설정됨
    }
    
    const guideImage = document.getElementById('guideImage');
    // 이미지 경로가 있을 때만 표시하여 엑박 방지
    if (imagePath) {
        // 초기 렌더 타이밍에서 가끔 빈 프레임이 보이는 문제 방지: onload 후 표시
        guideImage.onload = function() { this.style.display = ''; };
        guideImage.onerror = function() { this.style.display = 'none'; };
        guideImage.src = imagePath;
    } else {
        guideImage.src = '';
        guideImage.style.display = 'none';
    }
    // 단일 이미지 모드에서는 클릭 이벤트 제거
    guideImage.onclick = null;
    // 디바이스 텍스트 결정
    let deviceText = '모바일';
    if (currentGuideType === 'music' || currentGuideType === 'mv') {
        const availableDevices = availableGuides[currentGuideType][currentService];
        if (availableDevices && availableDevices.length === 1) {
            deviceText = availableDevices[0] === 'pc' ? 'PC' : '모바일';
        } else {
            deviceText = currentDevice === 'pc' ? 'PC' : '모바일';
        }
    }
    guideImage.alt = `${serviceNames[currentService]} ${typeNames[currentGuideType]} 가이드 이미지 (${deviceText} 버전)`;
    
    // 이미지 로드 실패 시 기본 이미지 표시
    guideImage.onerror = function() {
        console.log(`이미지 로드 실패: ${imagePath}`);
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjVmNWY1Ii8+CjxjaXJjbGUgY3g9IjI1MCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiNkZGQiLz4KPHBhdGggZD0iTTIxMCAxMjBsNjAgMzAtNjAgMzB6IiBmaWxsPSIjOTk5Ii8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIj7siqTtirjrjJTrqoXshJzrspTslrQ8L3RleHQ+Cjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtd2VpZ2h0PSIxNiI+PuydtOuvuOyngCDssL3rs7XtlZzri6QuLi48L3RleHQ+Cjwvc3ZnPg==';
    };
    
    // 이미지 로드 성공 시 로그
    guideImage.onload = function() {
        console.log(`이미지 로드 성공: ${imagePath}`);
    };
}

// 여러 장 이미지를 순차 표시 (클릭으로 넘기기)
function setMultiImages(paths) {
    const guideImage = document.getElementById('guideImage');
    if (!guideImage || !paths || paths.length === 0) return;
    let idx = 0;
    guideImage.src = paths[idx];
    guideImage.onclick = function() {
        idx = (idx + 1) % paths.length;
        guideImage.src = paths[idx];
    };
    document.querySelector('.guide-content').style.display = 'block';
}

// 투표 가이드 이미지 매핑
function updateVoteGuideImage(key) {
    // 두 이미지를 동시에 표시: 1) 투표권 모으기 2) 투표하기
    const listMap = {
        musicbank: [
            encodeFilePath('assets/guide/vote/팬캐스트 투표권 모으기.png'),
            encodeFilePath('assets/guide/vote/팬캐스트 투표하기.png')
        ],
        musiccore: [
            encodeFilePath('assets/guide/vote/뮤빗1.png'),
            encodeFilePath('assets/guide/vote/뮤빗2.png')
        ],
        inkigayo: [
            encodeFilePath('assets/guide/vote/하이어1.png'),
            encodeFilePath('assets/guide/vote/하이어2.png')
        ],
        showchampion: [
            encodeFilePath('assets/guide/vote/아이돌챔프1.png'),
            encodeFilePath('assets/guide/vote/아이돌챔프2.png')
        ],
        theshow: [
            encodeFilePath('assets/guide/vote/스타플래닛1.png'),
            encodeFilePath('assets/guide/vote/스타플래닛2.png')
        ],
        mcount: [
            encodeFilePath('assets/guide/vote/엠카운트다운.png')
        ]
    };
    const paths = listMap[key] || [];
    const container = document.querySelector('.guide-image-container');
    const single = document.getElementById('guideImage');
    if (!container) return;

    // 단일 기본 이미지 숨김
    if (single) { single.style.display = 'none'; single.onclick = null; single.src = ''; }

    // 기존 투표 이미지 제거 및 로딩 placeholder 추가
    Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 200px; color: #9ca3af; font-size: 0.9rem;">이미지 로딩 중...</div>';

    // 이미지 로드 카운터
    let loadedCount = 0;
    const totalImages = paths.length;

    // 순서대로 두 이미지를 추가
    paths.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '투표 가이드 이미지';
        img.className = 'guide-image vote-image';
        
        // 이미지 로드 완료 시 placeholder 제거
        img.onload = function() {
            loadedCount++;
            if (loadedCount === totalImages && container) {
                const placeholder = container.querySelector('div');
                if (placeholder && placeholder.textContent.includes('로딩 중')) {
                    placeholder.remove();
                }
            }
        };
        
        container.appendChild(img);
    });
}

// 투표 가이드 버튼 클릭 핸들러 (스타일 활성화 토글 포함)
function openVoteGuide(key) {
    const voteGrid = document.getElementById('vote-grid');
    if (voteGrid) {
        const buttons = voteGrid.querySelectorAll('.guide-item');
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = Array.from(buttons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`openVoteGuide('${key}')`));
        if (activeBtn) activeBtn.classList.add('active');
    }
    currentGuideType = 'vote';
    // 투표 가이드에서는 텍스트 박스 숨김
    hideGuideTextBox();
    document.querySelector('.guide-content').style.display = 'block';
    updateVoteGuideImage(key);
}

// Guide hub handlers
function openStreamingGuide(service) {
    currentGuideType = 'streaming';
    currentService = service;
    // 스트리밍 가이드에서는 텍스트 박스 숨김
    hideGuideTextBox();
    // 스트리밍 선택 시 그리드 유지, 이미지 표시
    const streamingGrid = document.getElementById('streaming-grid');
    if (streamingGrid) streamingGrid.style.display = 'block';
    document.querySelector('.guide-content').style.display = 'block';
    updateGuideImage();
}

function openDownloadGuide(kind, service) {
    currentGuideType = kind === 'mv' ? 'mv' : 'music';
    currentService = service;
    // 다운로드 가이드에서는 텍스트 박스 숨김
    hideGuideTextBox();
    document.querySelector('.guide-content').style.display = 'block';
    updateGuideImage();
}

// 음원 다운로드 가이드를 투표 가이드처럼 다중 이미지로 표시
function openMusicDlGuide(service) {
    try {
        currentGuideType = 'music';
        document.querySelector('.guide-content').style.display = 'block';
        const container = document.querySelector('.guide-image-container');
        const single = document.getElementById('guideImage');
        if (!container) return;
        
        // single 숨기고 리스트로
        if (single) { single.style.display = 'none'; single.onclick = null; single.src = ''; }
        Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
        
        // 로딩 placeholder 추가 (사이즈 변화 방지)
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 300px; color: #9ca3af; font-size: 0.9rem;">이미지 로딩 중...</div>';

        const map = {
            melon: [
                encodeFilePath('assets/guide/download/멜론/음원 다운 가이드-01.png'),
                encodeFilePath('assets/guide/download/멜론/음원 다운 가이드-02.png')
            ],
            vibe: [
                encodeFilePath('assets/guide/download/바이브/음원 다운 가이드-07.png'),
                encodeFilePath('assets/guide/download/바이브/음원 다운 가이드-08.png')
            ],
            bugs: [
                encodeFilePath('assets/guide/download/벅스/음원 다운 가이드-05.png'),
                encodeFilePath('assets/guide/download/벅스/음원 다운 가이드-06.png')
            ],
            genie: [
                encodeFilePath('assets/guide/download/지니/음원 다운 가이드-03.png'),
                encodeFilePath('assets/guide/download/지니/음원 다운 가이드-04.png')
            ],
            kakao: [
                encodeFilePath('assets/guide/download/카카오뮤직/음원 다운 가이드-09.png')
            ]
        };
        const list = map[service] || [];
        
        // 이미지 로드 카운터
        let loadedCount = 0;
        const totalImages = list.length;
        
        list.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = '음원 다운로드 가이드';
            img.className = 'guide-image vote-image';
            
            // 이미지 로드 완료 시 placeholder 제거
            img.onload = function() {
                loadedCount++;
                if (loadedCount === totalImages && container) {
                    const placeholder = container.querySelector('div');
                    if (placeholder && placeholder.textContent.includes('로딩 중')) {
                        placeholder.remove();
                    }
                }
            };
            
            container.appendChild(img);
        });
        
        // 버튼 활성 토글
        const grid = document.getElementById('download-grid');
        if (grid) {
            const buttons = grid.querySelectorAll('.guide-item');
            buttons.forEach(btn => btn.classList.remove('active'));
            const label = serviceToKorean(service) + ' 다운로드';
            const activeBtn = Array.from(buttons).find(b => b.textContent.trim() === label);
            if (activeBtn) activeBtn.classList.add('active');
        }
    } catch (e) { console.log(e); }
}

function serviceToKorean(key){
    const map = { melon:'멜론', vibe:'바이브', bugs:'벅스', genie:'지니', kakao:'카카오뮤직' };
    return map[key] || key;
}

function openOtherGuide(kind) {
    if (kind === 'block') {
        currentGuideType = 'stability';
        // 기타 가이드에서는 텍스트 박스 숨김
        hideGuideTextBox();
        document.querySelector('.guide-content').style.display = 'block';
        updateGuideImage();
    } else if (kind === 'radio') {
        alert('라디오 신청 가이드는 준비 중입니다.🐻');
    } else {
        alert('준비 중입니다.🐻');
    }
}

// 공동구매 가이드 핸들러
function openGroupBuyGuide(vendor) {
    currentGuideType = 'groupbuy';
    // active 스타일 토글
    const grid = document.getElementById('groupbuy-grid');
    if (grid) {
        const buttons = grid.querySelectorAll('.guide-item');
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = Array.from(buttons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`openGroupBuyGuide('${vendor}')`));
        if (activeBtn) activeBtn.classList.add('active');
    }
    const container = document.querySelector('.guide-image-container');
    const textBox = document.getElementById('guideText');
    const single = document.getElementById('guideImage');
    
    // 이미지 컨테이너 초기화 및 로딩 상태 표시
    if (container) {
        Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
        // 로딩 placeholder 추가
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 140px; color: #9ca3af; font-size: 0.9rem;">이미지 로딩 중...</div>';
    }
    if (single) { single.style.display = 'none'; single.onclick = null; single.src = ''; }

    // 벤더별 안내 텍스트 매핑 (상단 표시)
    const vendorText = {
        minirecord: `미니레코드 공동구매\n\n▪️공구 기간: ~ 9월 7일 23:59 (KST)\n\n▪️공구 특전: 엽서 1종\n\n▪️공구 가격&링크\n💿 Tin Case Ver. 29,700원\nhttp://bit.ly/423DcoR\n\n💿 Savory Ver. 14,500원\nhttps://bit.ly/47mHYl0\n\n💿 Full Spread(랜덤) Ver. 14,500원\nhttps://bit.ly/4pfGPlM\n\n💿 Full Spread(세트) Ver. 43,500원\nhttps://bit.ly/47mg5JH\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`,
        applemusic: `애플뮤직 공동구매\n\n▪️공구 기간: ~ 9월 7일 23:59(KST)\n\n▪️공구 특전: 스티커 1종\n\n🔗공구 가격 & 링크\n💿Tin Case Ver. 30,700원\nhttps://abit.ly/acaxvd\n\n💿 Savory Ver. 14,500원\nhttps://abit.ly/fvgwev\n\n💿 Full Spread(랜덤) Ver. 14,500원\nhttps://abit.ly/rvw5i6\n\n💿 Full Spread(세트) ver. 43,200원\nhttps://abit.ly/vvau2w\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`,
        everline: `에버라인 공동구매\n\n▪️공구 기간: ~ 9월 8일 23:59 (KST)\n\n▪️공구 특전: 핀버튼 3종 중 랜덤 1종\n\n▪️공구 가격&링크\n💿 Tin Case Ver. 30,500₩\nhttps://bit.ly/45XUyWC\n\n💿 Savory Ver. 14,700\nhttps://bit.ly/4fJkn01\n\n💿 Full Spread(랜덤) Ver. 14,700₩\nhttps://bit.ly/45XUGp4\n\n💿 Full Spread(세트) Ver. 43,600₩\nhttps://bit.ly/4mQLk40\n\n* 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로\n최대한 >예약 판매 기간 내에< 많은 구매 부탁드립니다.`,
        allmd: `올엠디 공동구매\n\n▪️공구 기간 : ~ 9월 7일 23:59 (KST)\n\n▪️공구 특전: 스티커 1종\n\n▪️공구 가격\n💿Tin Case Ver. 29,500원\n💿Savory Ver. 14,400원\n💿Full Spread Ver. (랜덤) 14,400원\n💿Full Spread Ver. (세트) 42,600원\n\n🔗공구 링크 \nhttps://buly.kr/9BWCsD7\n\n※ 앨범 발매 후 온•오프라인 물량에 차질이 있을 수 있으므로 최대한 >예약 판매 기간 내에< 에 많은 구매 부탁드립니다.`
    };
    if (textBox) {
        const text = vendorText[vendor] || '';
        if (text) {
            textBox.style.display = '';
            textBox.innerHTML = linkifyText(text);
        } else {
            textBox.style.display = 'none';
            textBox.innerHTML = '';
        }
    }

    const map = {
        minirecord: [
            encodeFilePath('assets/guide/groupbuy/미니레코드 국문.png'),
            encodeFilePath('assets/guide/groupbuy/미니레코드 영문.png')
        ],
        applemusic: [
            encodeFilePath('assets/guide/groupbuy/애플뮤직 국문.png'),
            encodeFilePath('assets/guide/groupbuy/애플뮤직 영문.png')
        ],
        everline: [
            encodeFilePath('assets/guide/groupbuy/에버라인 국문.png'),
            encodeFilePath('assets/guide/groupbuy/에버라인 영문.png')
        ],
        allmd: [
            encodeFilePath('assets/guide/groupbuy/올엠디.png')
        ]
    };
    const paths = map[vendor] || [];
    const list = paths.length ? paths : [];
    // 투표 가이드와 동일: 두 이미지가 있으면 모두 표시, 하나면 하나만 표시
    const frag = document.createDocumentFragment();
    let loadedCount = 0;
    const totalImages = list.length;
    
    list.forEach((src, idx) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '공동구매 가이드 이미지';
        img.className = 'guide-image vote-image';
        img.decoding = 'async';
        if (idx === 0) {
            img.loading = 'eager';
            img.setAttribute('fetchpriority', 'high');
        } else {
            img.loading = 'lazy';
        }
        
        // 이미지 로드 완료 시 placeholder 제거
        img.onload = function() {
            loadedCount++;
            if (loadedCount === totalImages && container) {
                // 모든 이미지 로드 완료 시 placeholder 제거
                const placeholder = container.querySelector('div');
                if (placeholder && placeholder.textContent.includes('로딩 중')) {
                    placeholder.remove();
                }
            }
        };
        
        frag.appendChild(img);
    });
    
    if (container && totalImages > 0) {
        container.appendChild(frag);
        document.querySelector('.guide-content').style.display = 'block';
    }
}

function openIdCategoryGrid(category, el) {
    const grid = document.getElementById('id-subgrid');
    if (!grid) return;
    grid.style.display = 'flex';
    currentGuideType = 'id';
    currentIdCategory = category;
    // 이전 선택 상태 초기화
    currentIdDetail = null;
    if (el && el.parentElement) {
        Array.from(el.parentElement.querySelectorAll('.guide-item')).forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    if (category === 'dualnumber') {
        grid.innerHTML = `
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('skt')\">SKT</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('lgu+')\">LG U+</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('kt')\">KT</button>
        `;
    } else {
        grid.innerHTML = `
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('melon')\">멜론</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('genie')\">지니</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('bugs')\">벅스</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('vibe')\">바이브</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('flo')\">플로</button>
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('kakao')\">카카오뮤직</button>
        `;
    }
    // 하위 첫 항목을 자동 선택하여 이미지가 즉시 보이도록 함 (렌더 뒤 이벤트 루프에서 실행)
    setTimeout(() => {
        const firstDetailBtn = grid.querySelector('.guide-item');
        if (firstDetailBtn && typeof firstDetailBtn.click === 'function') {
            firstDetailBtn.click();
        }
    }, 0);
}

function selectIdDetail(detail) {
    currentIdDetail = detail;
    // 아이디 가이드에서는 텍스트 박스 숨김
    hideGuideTextBox();
    document.querySelector('.guide-content').style.display = 'block';
    updateGuideImage();
}

// 렌더링: 2단계 탭 (아이디 가이드)
function renderIdDetailTabs(category) {
    const idDetailTabs = document.getElementById('idDetailTabs');
    if (!idDetailTabs) return;
    idDetailTabs.style.display = 'flex';
    if (category === 'dualnumber') {
        idDetailTabs.innerHTML = `
            <button class="service-tab" data-iddetail="skt">SKT</button>
            <button class="service-tab" data-iddetail="lgu+">LG U+</button>
            <button class="service-tab" data-iddetail="kt">KT</button>
        `;
    } else {
        idDetailTabs.innerHTML = `
            <button class="service-tab" data-iddetail="melon">멜론</button>
            <button class="service-tab" data-iddetail="vibe">바이브</button>
            <button class="service-tab" data-iddetail="bugs">벅스</button>
            <button class="service-tab" data-iddetail="genie">지니</button>
            <button class="service-tab" data-iddetail="kakao">카카오 뮤직</button>
            <button class="service-tab" data-iddetail="flo">플로</button>
        `;
    }
    // 클릭 바인딩
    Array.from(idDetailTabs.querySelectorAll('button')).forEach(btn => {
        btn.addEventListener('click', () => {
            Array.from(idDetailTabs.querySelectorAll('button')).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentIdDetail = btn.getAttribute('data-iddetail');
            updateGuideImage();
            document.querySelector('.guide-content').style.display = 'block';
        });
    });
    // 기본 선택
    const first = idDetailTabs.querySelector('button');
    if (first) first.click();
}