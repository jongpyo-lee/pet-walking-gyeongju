// 지도 초기화 (초기 위치: 경주시 황남동 근처)
const map = L.map('map').setView([35.8341, 129.2266], 14);

// OpenStreetMap 타일 레이어 추가
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 상태 변수
let startCoords = [35.8341, 129.2266];
let selectedType = "왕복";
let selectedTarget = "30분";

let startMarker = L.marker(startCoords).addTo(map).bindPopup("<b>🚩 출발지</b>");
let endMarker = null;
let currentPolyline = null;

// 1. 도로명/지번 주소 검색 (User-Agent 헤더 및 예외 처리 강화 적용)
function searchAddress() {
  const inputEl = document.getElementById('address-input');
  const infoEl = document.getElementById('address-result-info');
  let query = inputEl.value.trim();

  if (!query) {
    alert("검색할 주소를 입력해주세요.");
    return;
  }

  infoEl.innerText = "🔍 주소를 검색 중입니다...";

  // 한국 주소 인식률 개선을 위한 키워드 보정
  if (!query.includes("경주")) query = `경주시 ${query}`;
  if (!query.includes("대한민국")) query = `대한민국 ${query}`;

  // Nominatim API URL (HTTPS 및 JSON 포맷 명시)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`;

  // User-Agent 헤더를 포함하여 요청 (API 정책 준수 및 403 에러 방지)
  fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'DogWalkingApp/1.0 (contact@example.com)'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`서버 응답 에러: ${response.status}`);
      }
      return response.json();
    })
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

        infoEl.innerText = `✅ 검색 완료: ${data[0].display_name.split(',')[0]}`;
      } else {
        infoEl.innerText = "❌ 위치를 찾지 못했습니다. '황남동' 또는 '포석로 1080'처럼 더 단순한 도로명/동 이름으로 검색해 보세요.";
      }
    })
    .catch(error => {
      console.error("주소 검색 오류:", error);
      infoEl.innerText = `❌ 에러 발생 (${error.message}). 잠시 후 다시 시도해 주세요.`;
    });
}

// 2. 편도 / 왕복 선택
function selectType(type) {
  selectedType = type;
  const btns = document.querySelectorAll('.type-group button');
  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// 3. 산책 목표 선택 (30분 / 1시간 / 3km / 5km / 10km)
function selectTarget(target) {
  selectedTarget = target;
  const btns = document.querySelectorAll('.target-group button');
  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// 4. 도로망 기준 추천 코스 생성 (OSRM Foot Routing API 활용)
function recommendCourse() {
  if (customMode) cancelCustomCourse();

  const resultBox = document.getElementById('recommend-result');
  const titleEl = document.getElementById('result-title');
  const descEl = document.getElementById('result-desc');

  // 목표에 따른 반경/거리 오프셋 계산
  let distOffset = 0.008; // 기본 약 1km
  if (selectedTarget === '1시간' || selectedTarget === '3km') distOffset = 0.015;
  if (selectedTarget === '5km') distOffset = 0.025;
  if (selectedTarget === '10km') distOffset = 0.048;

  let waypoints = [];
  if (selectedType === '편도') {
    // 편도: 출발지 -> 직선 오프셋 지점
    const endCoords = [startCoords[0] + distOffset, startCoords[1] + distOffset * 0.7];
    waypoints = [startCoords, endCoords];
  } else {
    // 왕복: 삼각 순환 루프 코스
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

        // OSM 도로망 반영 폴리라인 선 그리기
        const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
        currentPolyline = L.polyline(coordinates, { color: '#4CAF50', weight: 6, opacity: 0.85 }).addTo(map);

        startMarker = L.marker(startCoords).addTo(map).bindPopup("<b>🚩 출발지</b>");
        if (selectedType === '편도') {
          const lastPoint = coordinates[coordinates.length - 1];
          endMarker = L.marker(lastPoint).addTo(map).bindPopup("<b>🏁 도착지</b>");
        }

        map.fitBounds(currentPolyline.getBounds(), { padding: [30, 30] });

        titleEl.innerText = `🛣️ OpenStreetMap 도로망 기준 [${selectedType}] 코스`;
        descEl.innerText = `선택 목표: ${selectedTarget}\n예상 거리: 약 ${distanceKm}km | 예상 소요 시간: 약 ${durationMin}분\n(보도 우선 탐색, 인도 불개설 구간은 차도 도로 망 기준 연결)`;
        resultBox.style.display = 'block';
      } else {
        alert("근처 도로망 정보를 조회하지 못했습니다.");
      }
    })
    .catch(() => {
      alert("코스 탐색 연동 중 오류가 발생했습니다.");
    });
}

// 5. 지도 클릭으로 나만의 코스 직접 만들기
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
    alert("지도를 클릭하여 원하는 경유 지점들을 하나씩 찍어주세요.");
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
          
          // 사용자가 찍은 점들을 연결하는 OSM 도로 라인
          currentPolyline = L.polyline(coordinates, { color: '#FF9800', weight: 5, dashArray: '6, 8' }).addTo(map);

          const distanceKm = (route.distance / 1000).toFixed(2);
          const durationMin = Math.round(route.duration / 60);

          document.getElementById('result-title').innerText = "✏️ 직접 만드는 중인 산책 코스";
          document.getElementById('result-desc').innerText = `찍은 지점 수: ${customPoints.length}개\n현재 연결 거리: 약 ${distanceKm}km (예상 시간: 약 ${durationMin}분)`;
          document.getElementById('recommend-result').style.display = 'block';
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
    alert("최소 2개 이상의 지점을 찍어야 코스가 완성됩니다.");
    return;
  }

  customMode = false;
  map.off('click', onMapClickCustom);
  document.getElementById('custom-course-banner').style.display = 'none';

  document.getElementById('result-title').innerText = "✅ 나만의 산책 코스 완성!";
}

function cancelCustomCourse() {
  customMode = false;
  map.off('click', onMapClickCustom);
  document.getElementById('custom-course-banner').style.display = 'none';
  document.getElementById('recommend-result').style.display = 'none';
  clearMapLayers();
}

function clearMapLayers() {
  if (currentPolyline) map.removeLayer(currentPolyline);
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
  customMarkers.forEach(m => map.removeLayer(m));
  customMarkers = [];
}
