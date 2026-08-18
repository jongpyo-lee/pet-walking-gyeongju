// 1. 지도 초기화 (경주시청 기본 중심)
const map = L.map('map').setView([35.8562, 129.2247], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 카페 마커 아이콘
const cafeIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2734/2734035.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

// 경주 주요 반려견 동반 카페 표시
const dogCafes = [
  { name: "황남동 동반 카페 A", lat: 35.8362, lng: 129.2120, desc: "☕ 야외 테라스 동반 가능" },
  { name: "보문 호수뷰 카페 B", lat: 35.8390, lng: 129.2850, desc: "☕ 잔디 마당 보유" },
  { name: "불국사 인근 카페 C", lat: 35.7890, lng: 129.3280, desc: "☕ 실내 소형견 동반 가능" },
  { name: "성건동 카페 D", lat: 35.8580, lng: 129.2100, desc: "☕ 멍푸치노 판매" }
];

dogCafes.forEach(cafe => {
  L.marker([cafe.lat, cafe.lng], { icon: cafeIcon }).addTo(map)
    .bindPopup(`<b>🐶 ${cafe.name}</b><br>${cafe.desc}`);
});

// 선택 상태 변수
let startCoords = [35.8341, 129.2266]; // 기본값: 황남동
let selectedType = "왕복";
let selectedTarget = "30분";

let startMarker = null;
let currentLocMarker = null;
let currentPolyline = null;
let endMarker = null;

// 2. 도로명/지번 주소 검색 (Nominatim API)
function searchAddress() {
  const query = document.getElementById('address-input').value;
  const infoEl = document.getElementById('address-result-info');

  if (!query.trim()) {
    alert("검색할 주소를 입력해주세요.");
    return;
  }

  infoEl.innerText = "🔍 주소 찾는 중...";

  // 경주시 키워드 자동 보정
  const searchQuery = query.includes("경주") ? query : `경주시 ${query}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        startCoords = [lat, lon];

        if (startMarker) map.removeLayer(startMarker);

        map.setView(startCoords, 16);
        startMarker = L.marker(startCoords).addTo(map)
          .bindPopup(`<b>🚩 출발지</b><br>${data[0].display_name.split(',')[0]}`)
          .openPopup();

        infoEl.innerText = `✅ 출발지 설정 완료: ${data[0].display_name.split(',')[0]}`;
      } else {
        infoEl.innerText = "❌ 위치를 찾지 못했습니다. 정확한 도로명이나 지번을 입력해주세요.";
      }
    })
    .catch(() => {
      infoEl.innerText = "❌ 주소 검색 중 오류가 발생했습니다.";
    });
}

// 3. 단발성 현위치 조회
function showCurrentLocation() {
  const gpsStatus = document.getElementById('gps-status');

  if (!navigator.geolocation) {
    alert("브라우저에서 위치 서비스를 지원하지 않습니다.");
    return;
  }

  gpsStatus.innerText = "📍 현재 위치 탐색 중...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      startCoords = [lat, lng];

      if (currentLocMarker) map.removeLayer(currentLocMarker);
      if (startMarker) map.removeLayer(startMarker);

      currentLocMarker = L.marker(startCoords).addTo(map)
        .bindPopup("<b>📍 내 현위치 (출발지로 설정됨)</b>")
        .openPopup();

      map.setView(startCoords, 16);
      gpsStatus.innerText = "✅ 현재 위치가 출발지로 설정되었습니다.";
      document.getElementById('address-result-info').innerText = "✅ 현재 위치 기준";
    },
    () => {
      gpsStatus.innerText = "❌ 위치 조회 실패. 권한을 확인해주세요.";
    },
    { enableHighAccuracy: true }
  );
}

// 4. 형태 및 목표 선택 함수
function selectType(type) {
  selectedType = type;
  const btns = document.querySelectorAll('.type-group button');
  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function selectTarget(target) {
  selectedTarget = target;
  const btns = document.querySelectorAll('.target-group button');
  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// 5. OSRM 보행자 도로 네트워크 기반 코스 추천 (편도/왕복)
function recommendCourse() {
  const resultBox = document.getElementById('recommend-result');
  const titleEl = document.getElementById('result-title');
  const descEl = document.getElementById('result-desc');

  // 목표에 따른 보행 오프셋 거리 계산
  let distOffset = 0.008; // 약 800m ~ 1km
  if (selectedTarget === '1시간' || selectedTarget === '3km') distOffset = 0.015;
  if (selectedTarget === '5km') distOffset = 0.025;

  let waypoints = [];
  if (selectedType === '편도') {
    // 출발지 -> 목표 거리 만큼 떨어진 반환점 (편도)
    const endCoords = [startCoords[0] + distOffset, startCoords[1] + distOffset * 0.7];
    waypoints = [startCoords, endCoords];
  } else {
    // 왕복 (삼각형 보행 순환 루프)
    const p1 = [startCoords[0] + distOffset * 0.6, startCoords[1] + distOffset * 0.4];
    const p2 = [startCoords[0] + distOffset * 0.2, startCoords[1] + distOffset * 0.8];
    waypoints = [startCoords, p1, p2, startCoords];
  }

  const waypointsStr = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${waypointsStr}?overview=full&geometries=geojson`;

  fetch(osrmUrl)
    .then(res => res.json())
    .then(data => {
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(2);
        const durationMin = Math.round(route.duration / 60);

        clearMapLayers();

        // 도로 기반 경로(GeoJSON) 지도에 그리기
        const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
        currentPolyline = L.polyline(coordinates, { color: '#4CAF50', weight: 6, opacity: 0.85 }).addTo(map);

        // 시작/종료 마커
        startMarker = L.marker(startCoords).addTo(map).bindPopup("<b>🚩 출발지</b>");
        if (selectedType === '편도') {
          const lastPoint = coordinates[coordinates.length - 1];
          endMarker = L.marker(lastPoint).addTo(map).bindPopup("<b>🏁 편도 목적지</b>");
        }

        map.fitBounds(currentPolyline.getBounds(), { padding: [30, 30] });

        titleEl.innerText = `🛣️ 도로 기준 ${selectedType} 맞춤 추천 코스`;
        descEl.innerText = `총 거리: 약 ${distanceKm}km | 예상 보행 시간: 약 ${durationMin}분\n실제 보도/도로망을 반영한 최적의 코스입니다.`;
        resultBox.style.display = 'block';

        // 기록 폼에 자동 반영
        document.getElementById('walk-time').value = durationMin;
        document.getElementById('walk-distance').value = distanceKm;
      } else {
        alert("해당 지점 근처의 보행 도로 정보를 찾을 수 없습니다.");
      }
    })
    .catch(() => {
      alert("코스 탐색 중 오류가 발생했습니다.");
    });
}

// 6. 지도로 나만의 코스 직접 만들기 모드
let customMode = false;
let customPoints = [];
let customMarkers = [];

function toggleCustomCourseMode() {
  customMode = !customMode;
  const banner = document.getElementById('custom-course-banner');

  if (customMode) {
    banner.style.display = 'block';
    clearMapLayers();
    customPoints = [];
    customMarkers = [];
    map.on('click', onMapClickCustom);
    alert("지도를 클릭하여 나만의 산책 지점들을 순서대로 찍어주세요.");
  } else {
    cancelCustomCourse();
  }
}

function onMapClickCustom(e) {
  if (!customMode) return;

  const latlng = [e.latlng.lat, e.latlng.lng];
  customPoints.push(latlng);

  const marker = L.marker(latlng).addTo(map)
    .bindPopup(`<b>지점 ${customPoints.length}</b>`).openPopup();
  customMarkers.push(marker);

  drawCustomPath();
}

function drawCustomPath() {
  if (currentPolyline) map.removeLayer(currentPolyline);

  if (customPoints.length > 1) {
    const waypointsStr = customPoints.map(p => `${p[1]},${p[0]}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${waypointsStr}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
          currentPolyline = L.polyline(coordinates, { color: '#FF9800', weight: 5, dashArray: '5, 10' }).addTo(map);

          const distKm = (route.distance / 1000).toFixed(2);
          document.getElementById('walk-distance').value = distKm;
        }
      });
  }
}

function undoLastCustomPoint() {
  if (customPoints.length === 0) return;

  customPoints.pop();
  const lastMarker = customMarkers.pop();
  if (lastMarker) map.removeLayer(lastMarker);

  drawCustomPath();
}

function finishCustomCourse() {
  if (customPoints.length < 2) {
    alert("최소 2개 이상의 지점을 찍어주세요.");
    return;
  }

  customMode = false;
  map.off('click', onMapClickCustom);
  document.getElementById('custom-course-banner').style.display = 'none';

  const resultBox = document.getElementById('recommend-result');
  document.getElementById('result-title').innerText = "✏️ 내가 직접 만든 맞춤 산책 코스";
  document.getElementById('result-desc').innerText = `총 ${customPoints.length}개 지점으로 연결된 나만의 보행 코스가 완성되었습니다!`;
  resultBox.style.display = 'block';
}

function cancelCustomCourse() {
  customMode = false;
  map.off('click', onMapClickCustom);
  document.getElementById('custom-course-banner').style.display = 'none';
  clearMapLayers();
}

function clearMapLayers() {
  if (currentPolyline) map.removeLayer(currentPolyline);
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
  customMarkers.forEach(m => map.removeLayer(m));
  customMarkers = [];
}

// 7. 기록 저장 기능 (LocalStorage)
const walkForm = document.getElementById('walk-form');
const logList = document.getElementById('log-list');

document.addEventListener('DOMContentLoaded', loadLogs);

walkForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const dogName = document.getElementById('dog-name').value;
  const walkTime = document.getElementById('walk-time').value;
  const walkDistance = document.getElementById('walk-distance').value;
  const walkMemo = document.getElementById('walk-memo').value;

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const newLog = {
    dogName,
    walkTime,
    walkDistance,
    type: selectedType,
    target: selectedTarget,
    walkMemo,
    date: dateStr
  };

  saveLog(newLog);
  appendLogToUI(newLog);

  walkForm.reset();
  alert("오늘의 산책 기록이 저장되었습니다!");
});

function saveLog(log) {
  const logs = JSON.parse(localStorage.getItem('walkLogs') || '[]');
  logs.unshift(log);
  localStorage.setItem('walkLogs', JSON.stringify(logs));
}

function loadLogs() {
  const logs = JSON.parse(localStorage.getItem('walkLogs') || '[]');
  logs.forEach(log => appendLogToUI(log));
}

function appendLogToUI(log) {
  const li = document.createElement('li');
  li.className = 'log-item';
  
  let distInfo = log.walkDistance ? ` | ${log.walkDistance}km` : '';
  let metaInfo = ` [${log.type} / ${log.target}]`;

  li.innerHTML = `
    <div class="log-title">🐕 ${log.dogName} - ${log.walkTime}분${distInfo}<span style="font-size:0.85rem; color:#4CAF50;">${metaInfo}</span></div>
    <div class="log-details">${log.date}</div>
    ${log.walkMemo ? `<div class="log-memo">"${log.walkMemo}"</div>` : ''}
  `;
  logList.prepend(li);
}
