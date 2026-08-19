// --- 1. 지도 초기화 (기본 중심: 경주시청) ---
var map = L.map('map').setView([35.8427, 129.2084], 14);

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
            
            map.setView([currentLat, currentLng], 15);
            if (currentMarker) map.removeLayer(currentMarker);
            currentMarker = L.marker([currentLat, currentLng]).addTo(map)
                .bindPopup("🐾 현재 내 위치").openPopup();

            document.getElementById('locationInput').value = "GPS 현위치 적용됨";
            alert("현재 위치를 지도에 반영했습니다!");
        }, function(error) {
            alert("위치 정보를 가져올 수 없습니다. GPS 권한을 확인해주세요.");
        });
    } else {
        alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
}

// --- 3. 실제 주소 검색 API (OpenStreetMap Nominatim 연동으로 정확한 위치 매칭) ---
function searchLocation() {
    const query = document.getElementById('locationInput').value.trim();
    if(!query) {
        alert("주소나 장소명을 입력해주세요.");
        return;
    }

    // 정확도를 높이기 위해 검색어에 '경주'를 조합하여 검색
    const searchQuery = query.includes("경주") ? query : `${query} 경주`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                currentLat = parseFloat(data[0].lat);
                currentLng = parseFloat(data[0].lon);
                
                map.setView([currentLat, currentLng], 15);
                if (currentMarker) map.removeLayer(currentMarker);
                currentMarker = L.marker([currentLat, currentLng]).addTo(map)
                    .bindPopup(`📍 ${data[0].display_name}`).openPopup();

                alert(`"${query}" 위치를 정확히 찾았습니다!`);
            } else {
                alert("검색 결과가 없습니다. 도로명이나 건물명을 정확하게 입력해주세요.");
            }
        })
        .catch(error => {
            alert("주소 검색 중 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
        });
}

// --- 4. 목표 설정에 맞춘 자연스러운 원형/곡선 산책 코스 생성 ---
function recommendCourses() {
    const goal = document.getElementById('goalSelect').value;
    const listDiv = document.getElementById('courseList');

    if (currentRouteLine) {
        map.removeLayer(currentRouteLine);
    }

    // 목표 거리에 따른 반경 설정 (단조로운 박스가 아닌 부드러운 곡선 루프 생성)
    let radius = 0.006; // 약 3km / 30분
    if (goal === "1시간" || goal === "5km") radius = 0.012;
    if (goal === "10km") radius = 0.024;

    // 12개의 다중 포인트로 원형/유기적인 곡선 코스 구성 (박스 형태 방지)
    const routePoints = [];
    const totalPoints = 12;
    for (let i = 0; i <= totalPoints; i++) {
        let angle = (i / totalPoints) * 2 * Math.PI;
        // 약간의 굴곡을 주어 실제 도로/산책로 느낌 구현
        let waveFactor = radius * (1 + 0.15 * Math.sin(i * 2));
        let lat = currentLat + waveFactor * Math.cos(angle);
        let lng = currentLng + waveFactor * Math.sin(angle) / Math.cos(currentLat * Math.PI / 180);
        routePoints.push([lat, lng]);
    }

    // 지도에 부드러운 곡선 경로 선 표시
    currentRouteLine = L.polyline(routePoints, {color: '#ff6b6b', weight: 6, opacity: 0.85, dashArray: '5, 10'}).addTo(map);
    map.fitBounds(currentRouteLine.getBounds());

    let html = `
        <div class="course-item">
            <strong>🐾 [맞춤 순환 산책로] (${goal})</strong><br>
            <span style="font-size: 0.85rem; color: #555;">선택하신 위치를 중심으로 목표(${goal})에 걸맞은 자연스러운 순환 산책 코스가 지도에 붉은색 점선 곡선으로 표시되었습니다!</span>
        </div>
    `;

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
    alert(`설정하신 [${goal}] 목표에 맞춘 최적의 산책 코스가 생성되었습니다.`);
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
