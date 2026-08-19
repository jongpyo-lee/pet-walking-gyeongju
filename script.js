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

// --- 3. 실제 주소 검색 API (Nominatim) ---
function searchLocation() {
    const query = document.getElementById('locationInput').value.trim();
    if(!query) {
        alert("주소나 장소명을 입력해주세요.");
        return;
    }

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
            alert("주소 검색 중 오류가 발생했습니다.");
        });
}

// --- 4. 실제 인도/도로망을 따라가는 길찾기 코스 생성 (OSRM API 연동) ---
function recommendCourses() {
    const goal = document.getElementById('goalSelect').value;
    const listDiv = document.getElementById('courseList');

    if (currentRouteLine) {
        map.removeLayer(currentRouteLine);
    }

    // 목표치에 따라 반환점 거리 설정 (실제 보행자 거리 기준, 위경도 오프셋 계산)
    // 30분/3km -> 약 1km 갔다가 돌아오는 코스
    // 1시간/5km -> 약 1.8km 갔다가 돌아오는 코스
    // 10km -> 약 3.5km 갔다가 돌아오는 코스
    let offset = 0.008; 
    if (goal === "1시간" || goal === "5km") offset = 0.015;
    if (goal === "10km") offset = 0.030;

    // 목적지(반환점) 좌표 계산 (출발지 기준 북동쪽 방향의 실제 도로 위치)
    let destLat = currentLat + offset;
    let destLng = currentLng + offset;

    // OSRM 보행자(foot) 전용 경로 검색 API 호출 (실제 인도 및 도로망을 정확히 따라감)
    // 구조: 출발지(lng,lat) -> 반환점(lng,lat) -> 출발지(lng,lat) 왕복 코스
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${currentLng},${currentLat};${destLng},${destLat};${currentLng},${currentLat}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                // GeoJSON 좌표 형식은 [lng, lat]이므로 Leaflet에 맞게 [lat, lng]로 변환
                const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                // 실제 도로/인도 위에 파란색 실선 경로 표시
                currentRouteLine = L.polyline(latLngs, { color: '#228be6', weight: 6, opacity: 0.85 }).addTo(map);
                map.fitBounds(currentRouteLine.getBounds());

                const distanceKm = (route.distance / 1000).toFixed(2);
                const durationMin = Math.round(route.duration / 60);

                let html = `
                    <div class="course-item">
                        <strong>🐾 [실제 도로/인도 맞춤 산책로] (${goal})</strong><br>
                        <span style="font-size: 0.85rem; color: #555;">
                            실제 보행자 길잡이 기준 총 거리: <b>약 ${distanceKm}km</b> | 예상 소요시간: <b>약 ${durationMin}분</b><br>
                            지도 위에 실제 인도와 도로망을 따라 걷는 경로가 파란색 실선으로 표시되었습니다!
                        </span>
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
                alert(`선택하신 목표(${goal})에 맞는 실제 인도/도로 산책 경로가 지도에 반영되었습니다!`);
            } else {
                alert("경로를 탐색할 수 없습니다. 다른 위치를 선택해 주세요.");
            }
        })
        .catch(error => {
            alert("길찾기 서버와 통신 중 오류가 발생했습니다.");
        });
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
