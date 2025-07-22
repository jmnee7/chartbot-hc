// 차트 데이터 로드 및 생성
async function loadChartData() {
    console.log('차트 데이터 로드 시작');

    // Chart.js가 로드되었는지 확인
    if (typeof Chart === 'undefined') {
        console.error('Chart.js가 로드되지 않았습니다!');
        document.getElementById('chartDebug').textContent = 'Chart.js 라이브러리 로드 실패!';
        return;
    }

    try {
        // 실제 데이터 파일 로드
        const response = await fetch('rank_history.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const historyData = await response.json();

        // 데이터가 비어있는지 확인
        if (Object.keys(historyData).length === 0) {
            document.getElementById('chartDebug').textContent = '차트 데이터가 없습니다.';
            return;
        }

        // 최신 24개 데이터만 사용
        const timestamps = Object.keys(historyData).sort().slice(-24);
        const chartData = {};
        timestamps.forEach(ts => {
            chartData[ts] = historyData[ts];
        });

        // 차트 생성
        createChart(chartData);

    } catch (error) {
        console.error('차트 데이터 로드 또는 처리 실패:', error);
        document.getElementById('chartDebug').textContent = `차트 데이터 로드 실패: ${error.message}`;
    }
}

// 차트 생성 함수
function createChart(chartData) {
    console.log('차트 생성 시작');
    
    const canvas = document.getElementById('rankChart');
    if (!canvas) {
        console.error('차트 캔버스를 찾을 수 없습니다.');
        return;
    }
    
    // 기존 차트 제거
    if (window.myRankChart) {
        window.myRankChart.destroy();
    }
    
    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = 350;
    
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(chartData).sort();
    
    // 서비스별 색상 및 이름 매핑
    const serviceInfo = {
        melon_top100: { name: '멜론 TOP100', color: '#00cd3c' },
        melon_hot100: { name: '멜론 HOT100', color: '#ff6b6b' },
        bugs: { name: '벅스', color: '#ff4757' },
        genie: { name: '지니', color: '#00a8ff' },
        vibe: { name: '바이브', color: '#8e44ad' },
        flo: { name: '플로', color: '#3b3b3b' }
    };

    // 데이터셋 동적 생성
    const datasets = Object.keys(serviceInfo).map(serviceKey => {
        return {
            label: serviceInfo[serviceKey].name,
            data: labels.map(time => {
                const serviceData = chartData[time][serviceKey];
                // 데이터가 배열이고, 첫 번째 항목에 rank가 있는지 확인
                if (Array.isArray(serviceData) && serviceData.length > 0 && serviceData[0].rank) {
                    return serviceData[0].rank;
                }
                return null; // 데이터가 없으면 null
            }),
            borderColor: serviceInfo[serviceKey].color,
            backgroundColor: `${serviceInfo[serviceKey].color}1a`, // 투명도 추가
            fill: false,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
            spanGaps: true // 중간에 데이터가 없어도 선을 연결
        };
    });
    
    try {
        console.log('Chart.js 객체 확인:', typeof Chart);
        
        window.myRankChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        reverse: true,
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: '순위'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '시간'
                        }
                    }
                }
            }
        });
        
        console.log('차트 생성 성공!');
        
        // 디버깅 정보 업데이트
        const debugElement = document.getElementById('chartDebug');
        if (debugElement) {
            debugElement.textContent = `차트 생성 완료! 데이터 포인트: ${labels.length}개`;
        }
        
    } catch (error) {
        console.error('차트 생성 실패:', error);
        const debugElement = document.getElementById('chartDebug');
        if (debugElement) {
            debugElement.textContent = `차트 생성 실패: ${error.message}`;
        }
    }
}

// 차트 범례 클릭 시 필터링
function filterChartByLegend(clickedLabel) {
    if (!window.myRankChart) return;
    
    window.myRankChart.data.datasets.forEach((dataset, index) => {
        window.myRankChart.setDatasetVisibility(index, false);
    });

    window.myRankChart.data.datasets.forEach((dataset, index) => {
        if (dataset.label === clickedLabel) {
            window.myRankChart.setDatasetVisibility(index, true);
        }
    });

    window.myRankChart.update();
}

// 모든 차트 보이기
function showAllCharts() {
    if (!window.myRankChart) return;
    
    window.myRankChart.data.datasets.forEach((dataset, index) => {
        window.myRankChart.setDatasetVisibility(index, true);
    });
    window.myRankChart.update();
} 