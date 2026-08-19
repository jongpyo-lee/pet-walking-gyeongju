// --- 1. 지도 초기화 (기본 중심: 경주시청) ---
var map = L.map('map').setView([35.8427, 129.2084], 14);

// 오픈소스 타일 레이어 로드 (무료 지도 배경)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let currentMarker = null;
let currentRouteLine = null;
let currentLat = 35.8427;
let currentLng = 129.2084;

let myCustomCourses = [];
let walkRecords = [];

// --- 2. 현위치 GPS 가져오기 ---
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            
            // 지도 중심 이동 및 마커 표시
            map.setView([currentLat, currentLng], 15);
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker([currentLat, currentLng]).addTo(map)
                .bindPopup("🐾 현재 내 위치").openPopup();

            document.getElementById('locationInput').value = "GPS 현위치 적용됨";
            alert("현재 위치를 지도에 반영했습니다!");
        }, function(error) {
            alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
        });
    } else {
        alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
}

// --- 3. 주소 검색 (경주 지역 중심 가상 좌표 매칭) ---
function searchLocation() {
    const query = document.getElementById('locationInput').value;
    if(!query) {
        alert("주소나 장소명을 입력해주세요.");
        return;
    }

    // 간단한 경주 주요 장소 키워드 좌표 매칭
    if (query.includes("황성공원")) {
        currentLat = 35.8520; currentLng = 129.2030;
    } else if (query.includes("보문")) {
        currentLat = 35.8480; currentLng = 129.2550;
    } else if (query.includes("동궁") || query.includes("월지")) {
        currentLat = 35.8340; currentLng = 129.2270;
    } else {
        // 일반 검색어인 경우 경주시청 기준으로 약간 랜덤하게 지정
        currentLat = 35.8427 + (Math.random() - 0.5) * 0.02;
        currentLng = 129.2084 + (Math.random() - 0.5) * 0.02;
    }

    map.setView([currentLat, currentLng], 15);
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([currentLat, currentLng]).addTo(map)
        .bindPopup(`📍 ${query}`).openPopup();

    alert(`"${query}" 위치를 지도에 설정했습니다.`);
}

// --- 4. 선택한 목표(시간/거리)에 맞춰 도로/산책 코스 자동 생성 및 표시 ---
function recommendCourses() {
    const goal = document.getElementById('goalSelect').value;
    const listDiv = document.getElementById('courseList');

    // 기존에 그려진 경로 선이 있다면 삭제
    if (currentRouteLine) {
        map.removeLayer(currentRouteLine);
    }

    // 목표치에 따라 경로의 크기(반경) 조절
    let radiusOffset = 0.005; // 기본 (약 30분 / 3km)
    if (goal === "1시간" || goal === "5km") radiusOffset = 0.010;
    if (goal === "10km") radiusOffset = 0.020;

    // 현재 위치를 기준으로 사각형/루프 형태의 가상 산책 경로 코스 생성 (도로 모양처럼 보이도록 다각형 구성)
    const routePoints = [
        [currentLat, currentLng],
        [currentLat + radiusOffset, currentLng],
        [currentLat + radiusOffset, currentLng + radiusOffset],
        [currentLat, currentLng + radiusOffset],
        [currentLat, currentLng] // 출발지로 돌아오는 코스
    ];

    // 지도 위에 파란색 산책 코스 선 그리기
    currentRouteLine = L.polyline(routePoints, {color: '#339af0', weight: 5, opacity: 0.8}).addTo(map);
    map.fitBounds(currentRouteLine.getBounds());

    // 추천 리스트 출력
    let html = `
        <div class="course-item">
            <strong>🐾 [맞춤 자동 생성 코스] (${goal})</strong><br>
            <span style="font-size: 0.85rem; color: #555;">현재 위치를 기점으로 설정하신 ${goal} 목표에 맞춘 최적의 순환 산책로가 지도에 파란색 선으로 표시되었습니다!</span>
        </div>
    `;

    // 사용자가 등록한 커스텀 코스가 있다면 추가
    myCustomCourses.forEach(c => {
        if (c.goal === goal || goal.includes("전체")) {
            html += `
                <div class="course-item">
                    <strong>🌟 ${c.title}</strong><br>
                    <span style="font-size: 0.85rem; color: #555;">목표: ${c.goal} | ${c.desc}</span>
                </div>
            `;
        }
    });

    listDiv.innerHTML = html;
    alert(`설정하신 [${goal}] 목표에 맞춘 최적의 산책 코스가 지도에 그려졌습니다.`);
}

// --- 5. 나만의 코스 등록 ---
function saveCustomCourse() {
    const title = document.getElementById('customTitle').value;
    const desc = document.getElementById('customDesc').value;
    const goal = document.getElementById('goalSelect').value;

    if(!title || !desc) {
        alert("코스 이름과 설명을 모두 입력해주세요.");
        return;
    }

    myCustomCourses.push({ title, goal, desc });
    alert("나만의 코스가 성공적으로 등록되었습니다!");
    document.getElementById('customTitle').value = '';
    document.getElementById('customDesc').value = '';
    recommendCourses();
}

// --- 6. 산책 기록 저장 ---
function saveWalkRecord() {
    const date = document.getElementById('recordDate').value;
    const memo = document.getElementById('recordMemo').value;

    if(!date || !memo) {
        alert("날짜와 메모를 모두 입력해주세요.");
        return;
    }

    walkRecords.push({ date, memo });
    renderRecords();
    alert("산책 기록이 저장되었습니다!");
    document.getElementById('recordMemo').value = '';
}

function renderRecords() {
    const recordListDiv = document.getElementById('recordList');
    if(walkRecords.length === 0) {
        recordListDiv.innerHTML = `<p class="placeholder-text">저장된 산책 기록이 없습니다.</p>`;
        return;
    }

    let html = '';
    walkRecords.forEach(rec => {
        html += `
            <div class="record-item">
                <span style="font-size: 0.85rem; color: #ff6b6b; font-weight: bold;">📅 ${rec.date}</span><br>
                <span>🐶 ${rec.memo}</span>
            </div>
        `;
    });
    recordListDiv.innerHTML = html;
}
