// 1. 지도 초기화 (경주시청 기준 위치)
const map = L.map('map').setView([35.8562, 129.2247], 13);

// OpenStreetMap 타일 레이어 추가
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let currentMarker = null;

// 경주 추천 산책 코스 정보
const routes = {
  '황성공원': {
    lat: 35.8617,
    lng: 129.2158,
    info: '🌲 황성공원: 울창한 소나무 숲길과 평탄한 산책로가 있어 반려견과 걷기 좋습니다.'
  },
  '보문호수': {
    lat: 35.8373,
    lng: 129.2818,
    info: '🌊 보문호수 산책로: 호숫가를 따라 조용히 산책하기 좋으며 벤치가 잘 설치되어 있습니다.'
  },
  '동궁과월지': {
    lat: 35.8341,
    lng: 129.2266,
    info: '🌸 동궁과 월지/첨성대: 넓은 잔디밭과 유적지 인근 길을 따라 여유롭게 걸을 수 있습니다.'
  }
};

// 추천 코스 표시 함수
function showRoute(routeName) {
  const route = routes[routeName];
  if (!route) return;

  // 이전 마커가 있다면 제거
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  // 지도 이동 및 마커 추가
  map.setView([route.lat, route.lng], 15);
  currentMarker = L.marker([route.lat, route.lng]).addTo(map)
    .bindPopup(`<b>${routeName}</b>`)
    .openPopup();

  // 안내 문구 변경
  document.getElementById('route-info').innerText = route.info;
}

// 2. 산책 기록 저장 기능 (Local Storage 활용)
const walkForm = document.getElementById('walk-form');
const logList = document.getElementById('log-list');

// 페이지 로드 시 기존 저장된 기록 불러오기
document.addEventListener('DOMContentLoaded', loadLogs);

walkForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const dogName = document.getElementById('dog-name').value;
  const walkTime = document.getElementById('walk-time').value;
  const walkMemo = document.getElementById('walk-memo').value;
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const newLog = {
    dogName,
    walkTime,
    walkMemo,
    date: dateStr
  };

  saveLog(newLog);
  appendLogToUI(newLog);

  // 폼 초기화
  walkForm.reset();
});

// 기록을 로컬 스토리지에 저장
function saveLog(log) {
  const logs = JSON.parse(localStorage.getItem('walkLogs') || '[]');
  logs.unshift(log); // 최신 기록이 위로 올 수 있도록 배열 앞에 추가
  localStorage.setItem('walkLogs', JSON.stringify(logs));
}

// 로컬 스토리지에서 기록 불러오기
function loadLogs() {
  const logs = JSON.parse(localStorage.getItem('walkLogs') || '[]');
  logs.forEach(log => appendLogToUI(log));
}

// 화면에 기록 항목 추가
function appendLogToUI(log) {
  const li = document.createElement('li');
  li.className = 'log-item';
  li.innerHTML = `
    <div class="log-title">🐕 ${log.dogName} - ${log.walkTime}분 산책</div>
    <div class="log-details">${log.date}</div>
    ${log.walkMemo ? `<div class="log-memo">"${log.walkMemo}"</div>` : ''}
  `;
  logList.prepend(li);
}
