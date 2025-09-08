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
    const otherSubgrid = document.getElementById('other-subgrid');
    
    // 모든 서브그리드 숨김 (탭 전환 시)
    const etcSubgrid = document.getElementById('other-etc-subgrid');
    const idSubgrid = document.getElementById('id-subgrid');
    if (otherSubgrid) {
        otherSubgrid.style.display = 'none';
        otherSubgrid.innerHTML = '';
    }
    if (etcSubgrid) {
        etcSubgrid.style.maxHeight = '0px';
        etcSubgrid.style.display = 'none'; // 추가: 확실한 숨김 처리
        etcSubgrid.style.visibility = 'hidden'; // 추가: 완전한 숨김
        etcSubgrid.innerHTML = ''; // 추가: 내용도 초기화
    }
    if (idSubgrid) {
        idSubgrid.style.maxHeight = '0px';
    }
    
    // 기타 가이드 메인 버튼들의 active 상태도 제거
    const otherGrid = document.getElementById('other-grid');
    if (otherGrid && type !== 'other') {
        const buttons = otherGrid.querySelectorAll('.guide-item');
        buttons.forEach(btn => btn.classList.remove('active'));
    }
    const streamingGrid = document.getElementById('streaming-grid');
    const idGrid = document.getElementById('id-grid');
    const downloadGrid = document.getElementById('download-grid');
    const voteGrid = document.getElementById('vote-grid');
    const groupbuyGrid = document.getElementById('groupbuy-grid');

    // 먼저 모두 숨김 및 이미지 영역 초기화(잔상 제거)
    [streamingGrid, idGrid, downloadGrid, voteGrid, otherGrid, groupbuyGrid].forEach(el => { if (el) el.style.display = 'none'; });
    if (otherSubgrid) { otherSubgrid.style.display = 'none'; otherSubgrid.innerHTML = ''; }
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
        const deviceTabs = document.getElementById('deviceTabs');
        if (deviceTabs) deviceTabs.style.display = 'none';
        if (idDetailTabs) { idDetailTabs.style.display = 'none'; idDetailTabs.innerHTML = ''; }
        // 가이드 콘텐츠 표시
        const guideContent = document.querySelector('.guide-content');
        if (guideContent) guideContent.style.display = 'block';
        if (voteDetailTabs) voteDetailTabs.style.display = 'none';
        // 기본 선택은 실제 버튼 자동 클릭 로직이 수행하므로 별도 강제값 설정을 하지 않습니다.
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

    // 기타 가이드 하위 탭
    if (type === 'other') {
        if (otherGrid) otherGrid.style.display = 'block';
        // 기본(첫 번째) 버튼 자동 선택
        if (otherGrid) {
            const firstGridBtn = otherGrid.querySelector('.guide-item');
            if (firstGridBtn && typeof firstGridBtn.click === 'function') firstGridBtn.click();
        }
        const deviceTabs = document.getElementById('deviceTabs');
        if (deviceTabs) deviceTabs.style.display = 'none';
        const guideContent = document.querySelector('.guide-content');
        if (guideContent) guideContent.style.display = 'block';
        return;
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
                    // 기존 placeholder 제거
                    const placeholder = container.querySelector('div');
                    if (placeholder && placeholder.textContent && placeholder.textContent.includes('로딩 중')) {
                        placeholder.remove();
                    }
                }
                if (single) { single.style.display = 'none'; single.onclick = null; single.src = ''; }
                if (container) {
                    let loadedCount = 0;
                    const totalImages = kakaoList.length;
                    
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
    
    let guideImage = document.getElementById('guideImage');
    const containerForSingle = document.querySelector('.guide-image-container');
    // guideImage 요소가 사라졌을 수 있으므로 보정 생성
    if (!guideImage && containerForSingle) {
        guideImage = document.createElement('img');
        guideImage.id = 'guideImage';
        guideImage.className = 'guide-image';
        guideImage.decoding = 'async';
        containerForSingle.appendChild(guideImage);
    }
    // 단일 이미지 로딩 중 placeholder 유지 -> 흰 화면 방지
    if (containerForSingle) {
        // 기존 placeholder가 없으면 추가
        const hasPlaceholder = !!Array.from(containerForSingle.children).find(c => c.nodeType === 1 && c.tagName === 'DIV' && c.textContent && c.textContent.includes('이미지 로딩'));
        if (!hasPlaceholder) {
            const ph = document.createElement('div');
            ph.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:200px;color:#9ca3af;font-size:0.9rem;';
            ph.textContent = '이미지 로딩 중...';
            containerForSingle.appendChild(ph);
        }
    }
    // 이미지 경로가 있을 때만 표시하여 엑박 방지
    if (imagePath) {
        guideImage.style.display = 'block';
        guideImage.style.visibility = 'visible';
        guideImage.onload = function() {
            this.style.display = 'block';
            this.style.visibility = 'visible';
            // 로딩 placeholder 제거
            if (containerForSingle) {
                const div = Array.from(containerForSingle.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('로딩 중'));
                if (div) div.remove();
            }
        };
        guideImage.onerror = function() {
            this.style.display = 'none';
            // 에러 안내 표시
            if (containerForSingle) {
                const ph = Array.from(containerForSingle.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('로딩 중'));
            }
        };
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
    currentGuideType = 'other';
    
    // 모든 서브그리드 초기화 (현재 선택된 메뉴가 아닌 경우)
    const subgrid = document.getElementById('other-subgrid');
    const etcSubgrid = document.getElementById('other-etc-subgrid');
    
    // 현재 클릭한 메뉴가 서브그리드를 사용하지 않는 경우 모든 서브그리드 숨김
    if (!['stability', 'simul', 'radio'].includes(kind) && 
        !(typeof kind === 'string' && (kind.indexOf('block_') === 0 || kind.indexOf('simul_') === 0 || kind.indexOf('radio_') === 0))) {
        if (subgrid) {
            subgrid.style.display = 'none';
            subgrid.innerHTML = '';
        }
    }
    
    // 기타 서브그리드 숨김 (기타 카테고리가 아닌 경우)
    if (!['gift_melon', 'cost', 'site_reco', 'etc'].includes(kind)) {
        if (etcSubgrid) {
            etcSubgrid.style.maxHeight = '0px';
            etcSubgrid.style.display = 'none';
            etcSubgrid.style.visibility = 'hidden';
            etcSubgrid.innerHTML = '';
        }
    }
    
    // active 스타일 토글
    const grid = document.getElementById('other-grid');
    if (grid) {
        const buttons = grid.querySelectorAll('.guide-item');
        buttons.forEach(btn => btn.classList.remove('active'));
        // block_* → stability, simul_* → simul, radio_* → radio 상단 버튼 활성화
        let keyForTop = kind;
        if (typeof kind === 'string') {
            if (kind.indexOf('block_') === 0) keyForTop = 'stability';
            if (kind.indexOf('simul_') === 0) keyForTop = 'simul';
            if (kind.indexOf('radio_') === 0) keyForTop = 'radio';
        }
        const activeBtn = Array.from(buttons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`openOtherGuide('${keyForTop}')`));
        if (activeBtn) activeBtn.classList.add('active');

        // 기타 하위 메뉴 클릭 시 상단 '기타' 버튼을 강제로 active 유지
        if (['gift_melon','cost','site_reco','etc'].includes(kind)) {
            const etcTopBtn = Array.from(buttons).find(b => b.textContent && b.textContent.trim() === '기타');
            if (etcTopBtn) etcTopBtn.classList.add('active');
        }
    }
    
    // stability: 아이디 가이드처럼 2단계 하위 메뉴 렌더링
    if (kind === 'stability' && subgrid) {
        subgrid.style.display = 'flex';
        // 버튼 렌더링
        subgrid.innerHTML = `
            <button class="guide-item text-only" onclick="openOtherGuide('block_airdroid')">Android - AirDroid</button>
            <button class="guide-item text-only" onclick="openOtherGuide('block_automate')">Android - Automate</button>
            <button class="guide-item text-only" onclick="openOtherGuide('block_ios_shortcut')">iOS - 단축어</button>
            <button class="guide-item text-only" onclick="openOtherGuide('block_ios_melon')">iOS - 멜론</button>
        `;
        // 첫 항목 자동 선택
        setTimeout(() => {
            const first = subgrid.querySelector('.guide-item');
            if (first && typeof first.click === 'function') first.click();
        }, 0);
        // 콘텐츠 영역 표시 및 텍스트 박스 숨김
        hideGuideTextBox();
        document.querySelector('.guide-content').style.display = 'block';
        return;
    }

    // 라디오 신청 가이드: 하위 4개 메뉴
    if (kind === 'radio' && subgrid) {
        subgrid.style.display = 'flex';
        subgrid.innerHTML = `
            <button class="guide-item text-only" onclick="openOtherGuide('radio_guide')">라디오 신청 가이드</button>
            <button class="guide-item text-only" onclick="openOtherGuide('radio_kbs')">KBS</button>
            <button class="guide-item text-only" onclick="openOtherGuide('radio_mbc')">MBC</button>
            <button class="guide-item text-only" onclick="openOtherGuide('radio_sbs')">SBS</button>
        `;
        setTimeout(() => {
            const first = subgrid.querySelector('.guide-item');
            if (first && typeof first.click === 'function') first.click();
        }, 0);
        hideGuideTextBox();
        document.querySelector('.guide-content').style.display = 'block';
        return;
    }

    // 기타 탭: 하위 3개 메뉴 (라디오 신청 가이드와 동일한 방식)
    if (kind === 'etc' && etcSubgrid) {
        etcSubgrid.style.display = 'flex';
        etcSubgrid.style.visibility = 'visible';
        etcSubgrid.innerHTML = `
            <button class="guide-item text-only" onclick="openOtherGuide('gift_melon')">멜론 선물하기 가이드</button>
            <button class="guide-item text-only" onclick="openOtherGuide('cost')">음원 다운로드 비용 안내</button>
            <button class="guide-item text-only" onclick="openOtherGuide('site_reco')">음원 사이트 추천</button>
        `;
        etcSubgrid.style.maxHeight = etcSubgrid.scrollHeight + 'px';
        setTimeout(() => {
            const first = etcSubgrid.querySelector('.guide-item');
            if (first && typeof first.click === 'function') first.click();
        }, 0);
        hideGuideTextBox();
        document.querySelector('.guide-content').style.display = 'block';
        return;
    }

    // 숏폼 제작 가이드: 단일 이미지 표시
    if (kind === 'shorts') {
        if (subgrid) { subgrid.style.display = 'none'; subgrid.innerHTML = ''; }
        hideGuideTextBox();
        const container = document.querySelector('.guide-image-container');
        document.querySelector('.guide-content').style.display = 'block';
        if (container) {
            // 기존 다중 이미지/placeholder 정리
            Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
            const placeholder = container.querySelector('div');
            if (placeholder && placeholder.textContent && placeholder.textContent.includes('로딩 중')) {
                placeholder.remove();
            }
            // guideImage 보장
            let img = document.getElementById('guideImage');
            if (!img) {
                img = document.createElement('img');
                img.id = 'guideImage';
                img.className = 'guide-image single-image';
                container.appendChild(img);
            } else {
                img.className = 'guide-image single-image';
            }
            img.onload = function(){ this.style.display=''; };
            img.onerror = function(){ this.style.display='none'; };
            // 디렉토리명에 공백이 있어 전체 경로를 안전하게 인코딩
            const path = 'assets/guide/etc/숏폼 제작 가이드/숏폼 제작 가이드.png';
            img.src = encodeURI(path);
            img.alt = '숏폼 제작 가이드';
        }
        return;
    }

    // 동시스밍 가이드: 하위 2개 메뉴 (사운드 어시스턴트 / 삼성 뮤직)
    if (kind === 'simul' && subgrid) {
        subgrid.style.display = 'flex';
        subgrid.innerHTML = `
            <button class="guide-item text-only" onclick="openOtherGuide('simul_soundassistant')">Android - 사운드 어시스턴트</button>
            <button class="guide-item text-only" onclick="openOtherGuide('simul_samsung')">Android - 삼성 뮤직</button>
        `;
        setTimeout(() => {
            const first = subgrid.querySelector('.guide-item');
            if (first && typeof first.click === 'function') first.click();
        }, 0);
        hideGuideTextBox();
        document.querySelector('.guide-content').style.display = 'block';
        return;
    }


    // block_* / simul_* / radio_* 하위 메뉴 클릭 시, 하단 버튼 active 토글
    if (subgrid && typeof kind === 'string' && (kind.indexOf('block_') === 0 || kind.indexOf('simul_') === 0 || kind.indexOf('radio_') === 0)) {
        const subButtons = subgrid.querySelectorAll('.guide-item');
        subButtons.forEach(btn => btn.classList.remove('active'));
        const activeSub = Array.from(subButtons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`openOtherGuide('${kind}')`));
        if (activeSub) activeSub.classList.add('active');
    }
    
    // 기타 서브그리드 버튼 active 토글
    if (etcSubgrid && ['gift_melon', 'cost', 'site_reco', 'etc'].includes(kind)) {
        const etcButtons = etcSubgrid.querySelectorAll('.guide-item');
        etcButtons.forEach(btn => btn.classList.remove('active'));
        const activeEtc = Array.from(etcButtons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`openOtherGuide('${kind}')`));
        if (activeEtc) activeEtc.classList.add('active');

        // 아코디언이 닫혀있다면 열기 (세 항목 동작 일관화를 위해 강제 오픈)
        const isClosed = etcSubgrid.style.maxHeight === '0px' || !etcSubgrid.style.maxHeight;
        if (isClosed) {
            etcSubgrid.style.display = 'flex';
            etcSubgrid.style.visibility = 'visible';
            // 현재 컨텐츠 높이 계산 후 적용
            requestAnimationFrame(() => {
                etcSubgrid.style.maxHeight = etcSubgrid.scrollHeight + 'px';
            });
        }
    }

    // 컬러링 가이드는 준비중 처리
    if (kind === 'coloring') {
        alert('준비 중입니다.🐻');
        return;
    }

    // 기타 가이드에서는 텍스트 박스 숨김
    hideGuideTextBox();
    const container = document.querySelector('.guide-image-container');
    const single = document.getElementById('guideImage');
    document.querySelector('.guide-content').style.display = 'block';

    // 컨테이너 초기화 및 placeholder
    if (container) {
        Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 140px; color: #9ca3af; font-size: 0.9rem;">이미지 로딩 중...</div>';
    }
    if (single) { single.style.display = 'none'; single.onclick = null; single.src = ''; }

    const map = {
        // 동시스밍 가이드 하위 메뉴
        simul_soundassistant: [
            encodeFilePath('assets/guide/etc/동시스밍 가이드/삼성뮤직 활용 가이드/동시스트리밍 가이드_사운드어시스턴트 (1).png'),
            encodeFilePath('assets/guide/etc/동시스밍 가이드/삼성뮤직 활용 가이드/동시스트리밍 가이드_사운드어시스턴트 (2).png')
        ],
        simul_samsung: [
            encodeFilePath('assets/guide/etc/동시스밍 가이드/삼성뮤직 활용 가이드/동시스트리밍_삼성뮤직활용 (1).png'),
            encodeFilePath('assets/guide/etc/동시스밍 가이드/삼성뮤직 활용 가이드/동시스트리밍_삼성뮤직활용 (2).png')
        ],
        // 멜론 선물하기 가이드
        gift_melon: [
            encodeFilePath('assets/guide/etc/멜론 선물하기 가이드/스밍팀 멜론 선물.png'),
            encodeFilePath('assets/guide/etc/멜론 선물하기 가이드/일반 멜론 선물.png')
        ],
        // 스포티파이 사전 저장 가이드
        spotify_pre: [
            encodeFilePath('assets/guide/etc/스포티파이 사전 저장 가이드/스포티파이 사전 저장 가이드 국문.png'),
            encodeFilePath('assets/guide/etc/스포티파이 사전 저장 가이드/스포티파이 사전 저장 가이드 영문.png')
        ],
        // 스밍 끊김 방지
        block_airdroid: [
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_에어안드로이드 (1).png'),
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_에어안드로이드 (2).png'),
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_에어안드로이드 (3).png'),
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_에어안드로이드 (4).png')
        ],
        block_automate: [
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_오토메이트 (1).png'),
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_오토메이트 (2).png')
        ],
        block_ios_shortcut: [
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_ios 단축어.png')
        ],
        block_ios_melon: [
            encodeFilePath('assets/guide/etc/스밍 끊김 방지 가이드/스트리밍끊김방지가이드_ios,안드로이드 멜론.png')
        ],
        // 라디오 신청 가이드 하위 메뉴
        radio_guide: [
            encodeFilePath('assets/guide/etc/라디오 신청 가이드/라디오 신청  가이드.png')
        ],
        radio_kbs: [
            encodeFilePath('assets/guide/etc/라디오 신청 가이드/KBS  KONG.png')
        ],
        radio_mbc: [
            encodeFilePath('assets/guide/etc/라디오 신청 가이드/MBC MINI.png')
        ],
        radio_sbs: [
            encodeFilePath('assets/guide/etc/라디오 신청 가이드/SBS  고릴라.png')
        ],
        // 단일 정보 가이드들 (music etc)
        cost: [
            encodeFilePath('assets/guide/etc/music etc/음원 다운로드 비용 안내.png')
        ],
        pre_vote: [
            encodeFilePath('assets/guide/etc/music etc/CRZY 음악방송 사전투표 안내.png')
        ],
        site_reco: [
            encodeFilePath('assets/guide/etc/music etc/음원 사이트 추천.png')
        ],
        // 컬러링 가이드 (준비중)
        coloring: []
    };

    const paths = map[kind] || [];
    if (!container || paths.length === 0) { return; }

    const frag = document.createDocumentFragment();
    let loadedCount = 0;
    const totalImages = paths.length;
    
    paths.forEach((src, idx) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '기타 가이드 이미지';
        img.className = 'guide-image vote-image';
        img.decoding = 'async';
        if (idx === 0) {
            img.loading = 'eager';
            img.setAttribute('fetchpriority', 'high');
        } else {
            img.loading = 'lazy';
        }
        img.onload = function(){
            loadedCount++;
            if (loadedCount === totalImages && container) {
                const placeholder = container.querySelector('div');
                if (placeholder && placeholder.textContent.includes('로딩 중')) {
                    placeholder.remove();
                }
            }
        };
        frag.appendChild(img);
    });

    container.appendChild(frag);
}

// 기타 가이드의 "기타" 카테고리 아코디언 처리 (아이디 가이드와 유사)
function openOtherCategoryGrid(category, el) {
    const grid = document.getElementById('other-etc-subgrid');
    if (!grid) return;
    
    // 다른 모든 서브그리드들 숨기기
    const otherSubgrid = document.getElementById('other-subgrid');
    if (otherSubgrid) {
        otherSubgrid.style.display = 'none';
        otherSubgrid.innerHTML = '';
    }
    
    // 다른 메인 버튼들의 active 상태 제거 (기타 제외)
    const otherGrid = document.getElementById('other-grid');
    if (otherGrid) {
        const buttons = otherGrid.querySelectorAll('.guide-item');
        buttons.forEach(btn => {
            if (btn !== el) {
                btn.classList.remove('active');
            }
        });
    }
    
    if (el && el.parentElement) {
        Array.from(el.parentElement.querySelectorAll('.guide-item')).forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    
    // 라디오 신청 가이드처럼 항상 하위 메뉴 표시 (토글 없음)
    
    // 하위 메뉴 내용 설정
    if (category === 'etc') {
        grid.innerHTML = `
            <button class="guide-item text-only" onclick="openOtherGuide('gift_melon')">멜론 선물하기 가이드</button>
            <button class="guide-item text-only" onclick="openOtherGuide('cost')">음원 다운로드 비용 안내</button>
            <button class="guide-item text-only" onclick="openOtherGuide('site_reco')">음원 사이트 추천</button>
        `;
    }
    
    // 아코디언 열기
    grid.style.display = 'flex';
    grid.style.visibility = 'visible'; // 추가: 확실한 표시
    // 높이를 계산해서 슬라이드 다운
    setTimeout(() => {
        grid.style.maxHeight = grid.scrollHeight + 'px';
    }, 10);
    
    // 하위 첫 항목을 자동 선택하여 이미지가 즉시 보이도록 함
    setTimeout(() => {
        const firstDetailBtn = grid.querySelector('.guide-item');
        if (firstDetailBtn && typeof firstDetailBtn.click === 'function') {
            firstDetailBtn.click();
        }
    }, 150); // 아코디언 애니메이션 후 실행
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
    
    currentGuideType = 'id';
    currentIdCategory = category;
    // 이전 선택 상태 초기화
    currentIdDetail = null;
    
    if (el && el.parentElement) {
        Array.from(el.parentElement.querySelectorAll('.guide-item')).forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    
    // 아코디언 애니메이션으로 하위 메뉴 표시
    const isCurrentlyOpen = grid.style.maxHeight && grid.style.maxHeight !== '0px';
    const isSameCategory = grid.getAttribute('data-current-category') === category;
    
    if (isCurrentlyOpen && isSameCategory) {
        // 같은 카테고리를 다시 클릭하면 닫기
        grid.style.maxHeight = '0px';
        grid.setAttribute('data-current-category', '');
        return;
    }
    
    // 하위 메뉴 내용 설정
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
    
    // 아코디언 열기
    grid.style.display = 'flex';
    grid.setAttribute('data-current-category', category);
    // 높이를 계산해서 슬라이드 다운
    setTimeout(() => {
        grid.style.maxHeight = grid.scrollHeight + 'px';
    }, 10);
    
    // 하위 첫 항목을 자동 선택하여 이미지가 즉시 보이도록 함
    setTimeout(() => {
        const firstDetailBtn = grid.querySelector('.guide-item');
        if (firstDetailBtn && typeof firstDetailBtn.click === 'function') {
            firstDetailBtn.click();
        }
    }, 150); // 아코디언 애니메이션 후 실행
}

function selectIdDetail(detail) {
    currentIdDetail = detail;
    // 아이디 가이드에서는 텍스트 박스 숨김
    hideGuideTextBox();
    const guideContent = document.querySelector('.guide-content');
    if (guideContent) guideContent.style.display = 'block';
    // 하위 버튼 active 토글
    const subgrid = document.getElementById('id-subgrid');
    if (subgrid) {
        const buttons = subgrid.querySelectorAll('.guide-item');
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = Array.from(buttons).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`selectIdDetail('${detail}')`));
        if (activeBtn) activeBtn.classList.add('active');
    }
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