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
    kakao: '카카오 뮤직'
};

// 가이드 타입 이름 매핑
const typeNames = {
    streaming: '스트리밍',
    music: '음원 다운로드',
    mv: '뮤비 다운로드',
    vote: '투표',
    id: '아이디 찾기',
    stability: '끊김 방지'
};

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
    
    // 클릭된 탭 활성화
    event.target.classList.add('active');
    
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

    // 먼저 모두 숨김
    [streamingGrid, idGrid, downloadGrid, voteGrid, otherGrid].forEach(el => { if (el) el.style.display = 'none'; });
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
            if (firstBtn) firstBtn.click();
        }
        // 디바이스 탭 숨기기
        document.getElementById('deviceTabs').style.display = 'none';
        if (idDetailTabs) { idDetailTabs.style.display = 'none'; idDetailTabs.innerHTML = ''; }
        // 가이드 콘텐츠 표시
        document.querySelector('.guide-content').style.display = 'block';
        if (voteDetailTabs) voteDetailTabs.style.display = 'none';
        return;
    } else {
        if (idCategoryTabs) idCategoryTabs.style.display = 'none';
        if (idDetailTabs) { idDetailTabs.style.display = 'none'; idDetailTabs.innerHTML=''; }
    }

    // 투표 가이드 하위 탭
    if (type === 'vote') {
        if (voteGrid) voteGrid.style.display = 'block';
        if (voteDetailTabs) {
            voteDetailTabs.style.display = 'flex';
            voteDetailTabs.innerHTML = `
                <button class="service-tab" data-vote="mubit">뮤빗</button>
                <button class="service-tab" data-vote="starplanet">스타플래닛</button>
                <button class="service-tab" data-vote="champ">챔프</button>
                <button class="service-tab" data-vote="fancast">팬캐스트</button>
                <button class="service-tab" data-vote="higher">하이어</button>
            `;
            Array.from(voteDetailTabs.querySelectorAll('button')).forEach(btn => {
                btn.addEventListener('click', () => {
                    Array.from(voteDetailTabs.querySelectorAll('button')).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const key = btn.getAttribute('data-vote');
                    updateVoteGuideImage(key);
                });
            });
            const first = voteDetailTabs.querySelector('button');
            if (first) first.click();
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

// 가이드 이미지 업데이트 함수
function updateGuideImage() {
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
                imagePath = `assets/guide/generateid/dualnumber/${file}`;
            }
        } else if (currentIdCategory === 'id') {
            const map = {
                'melon': '아이디생성가이드_202508ver_멜론.png',
                'vibe': '아이디생성가이드_202508ver_바이브.png',
                'bugs': '아이디생성가이드_202508ver_벅스.png',
                'genie': '아이디생성가이드_202508ver_지니.png',
                'kakao': '아이디생성가이드_202508ver_카카오뮤직01.png',
                'flo': '아이디생성가이드_202508ver_플로.png'
            };
            const file = map[currentIdDetail];
            if (file) {
                imagePath = `assets/guide/generateid/id/${file}`;
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
    guideImage.src = imagePath;
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
    const listMap = {
        mubit: [
            'assets/guide/vote/뮤빗1.png',
            'assets/guide/vote/뮤빗2.png'
        ],
        starplanet: [
            'assets/guide/vote/스타플래닛1.png',
            'assets/guide/vote/스타플래닛2.png'
        ],
        champ: [
            'assets/guide/vote/아이돌챔프1.png',
            'assets/guide/vote/아이돌챔프2.png'
        ],
        fancast: [
            'assets/guide/vote/팬캐스트 투표권 모으기.png',
            'assets/guide/vote/팬캐스트 투표하기.png'
        ],
        higher: [
            'assets/guide/vote/하이어1.png',
            'assets/guide/vote/하이어2.png'
        ]
    };
    const paths = listMap[key] || [];
    const container = document.querySelector('.guide-image-container');
    const single = document.getElementById('guideImage');
    if (!container) return;
    // 단일 이미지 숨김
    if (single) { single.style.display = 'none'; single.onclick = null; }
    // 기존 다중 이미지 제거
    Array.from(container.querySelectorAll('.vote-image')).forEach(el => el.remove());
    // 두 이미지를 모두 추가
    paths.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '투표 가이드 이미지';
        img.className = 'guide-image vote-image';
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
    document.querySelector('.guide-content').style.display = 'block';
    updateVoteGuideImage(key);
}

// Guide hub handlers
function openStreamingGuide(service) {
    currentGuideType = 'streaming';
    currentService = service;
    // 스트리밍 선택 시 그리드 유지, 이미지 표시
    const streamingGrid = document.getElementById('streaming-grid');
    if (streamingGrid) streamingGrid.style.display = 'block';
    document.querySelector('.guide-content').style.display = 'block';
    updateGuideImage();
}

function openDownloadGuide(kind, service) {
    currentGuideType = kind === 'mv' ? 'mv' : 'music';
    currentService = service;
    document.querySelector('.guide-content').style.display = 'block';
    updateGuideImage();
}

function openOtherGuide(kind) {
    if (kind === 'block') {
        currentGuideType = 'stability';
        document.querySelector('.guide-content').style.display = 'block';
        updateGuideImage();
    } else if (kind === 'radio') {
        alert('라디오 신청 가이드는 준비 중입니다.🐻');
    } else {
        alert('준비 중입니다.🐻');
    }
}

function openIdCategoryGrid(category, el) {
    const grid = document.getElementById('id-subgrid');
    if (!grid) return;
    grid.style.display = 'flex';
    currentGuideType = 'id';
    currentIdCategory = category;
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
            <button class=\"guide-item text-only\" onclick=\"selectIdDetail('kakao')\">카카오 뮤직</button>
        `;
    }
}

function selectIdDetail(detail) {
    currentIdDetail = detail;
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