// 1. 지도 초기화 (경주시청 기본 위치)
const map = L.map('map').setView([35.8562, 129.2247], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 커스텀 아이콘 (카페)
const cafeIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2734/2734035.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

// 2. 경주 반려견 동반 카페 마커 표기
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

// 3. 현위치 조회 기능 (단발성)
let currentLocMarker = null;

function showCurrentLocation() {
  const gpsStatus = document.getElementById('gps-status');

  if (!navigator.geolocation) {
    alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
    return;
  }

  gpsStatus.innerText = "📍 현재 위치 탐색 중...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const pos = [lat, lng];

      if (currentLocMarker) {
        map.removeLayer(currentLocMarker);
      }

      currentLocMarker = L.marker(pos).addTo(map)
        .bindPopup("<b>📍 내 현재 위치</b>")
        .openPopup();

      map.setView(pos, 15);
      gpsStatus.innerText = "✅ 현재 위치를 확인했습니다.";
    },
    (error) => {
      alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
      gpsStatus.innerText = "❌ 위치 확인 실패";
    },
    { enableHighAccuracy: true }
  );
}

// 4. 목표 선택 및 추천 알고리즘
let selectedTargetVal = "30분";
let selectedTargetType = "time";

function selectTarget(type, value) {
  selectedTargetType = type;
  selectedTargetVal = value;
  document.getElementById('target-display').innerText = `선택된 목표: ${value}`;

  // 버튼 스타일 활성화 처리
  const buttons = document.querySelectorAll('.target-group button');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// 추천 코스 데이터베이스
const courseDatabase = {
  '황남동': {
    lat: 35.8341,
    lng: 129.2266,
    courses: {
      '30분': { title: '🌸 대릉원 돌담길 짧은 코스', desc: '황리단길과 대릉원 외곽 돌담길을 따라 가볍게 걷기 좋은 30분 산책로입니다.' },
      '1시간': { title: '🏯 첨성대 & 계림 숲 한 바퀴', desc: '첨성대 잔디밭과 계림 숲길을 둘러보며 여유롭게 조경을 즐길 수 있는 1시간 코스입니다.' },
      '3km': { title: '🚶 동궁과 월지 둘레길 (약 3km)', desc: '황남동에서 출발해 첨성대와 동궁과 월지 입구까지 왕복하는 적당한 거리의 코스입니다.' },
      '5km': { title: '🐕 황남동 - 월정교 - 교촌마을 대순환 (약 5km)', desc: '교촌한옥마을과 월정교 하천변까지 넓게 다녀오는 유적지 탐방 코스입니다.' }
    }
  },
  '보문단지': {
    lat: 35.8373,
    lng: 129.2818,
    courses: {
      '30분': { title: '🌊 보문호수 수변공원길', desc: '보문호수 산책로 입구 부근에서 잔잔한 호수를 보며 다녀오는 30분 코스입니다.' },
      '1시간': { title: '🌲 보문 야외공연장 & 숲길', desc: '호수변 산책로와 녹지 공간이 어우러져 반려견이 냄새 맡기 좋은 1시간 추천 코스입니다.' },
      '3km': { title: '🚶 보문호수 반환점 코스 (약 3km)', desc: '보문호 산책길을 따라 직선으로 걸었다 돌아오는 쾌적한 평지 코스입니다.' },
      '5km': { title: '🏃 보문호수 대슬로프 순환 (약 5km)', desc: '보문호수의 명소를 크게 돈 뒤 근처 반려견 카페에서 휴식하기 좋은 코스입니다.' }
    }
  },
  '불국사': {
    lat: 35.7890,
    lng: 129.3280,
    courses: {
      '30분': { title: '🍁 불국사 공원 잔디광장', desc: '불국사 진입로 공원의 넓은 잔디밭과 울창한 나무 아래에서 즐기는 30분 산책입니다.' },
      '1시간': { title: '🌲 토함산 하단 산책로', desc: '경사가 완만한 산자락 길을 따라 자연의 숲 냄새를 맡을 수 있는 1시간 힐링 코스입니다.' },
      '3km': { title: '🚶 불국사 - 진현동 한옥마을 (약 3km)', desc: '한옥마을 골목길과 공원을 연계하여 조용하게 산책할 수 있는 3km 코스입니다.' },
      '5km': { title: '🏃 토함산 숲길 왕복 코스 (약 5km)', desc: '풍부한 녹지 속에서 반려견의 운동량을 채워줄 수 있는 5km 산책 코스입니다.' }
    }
  },
  '성건동': {
    lat: 35.8617,
    lng: 129.2158,
    courses: {
      '30분': { title: '🌳 황성공원 소나무 숲길', desc: '성건동 인근 황성공원의 우거진 소나무 숲을 가볍게 조깅하듯 걷는 30분 코스입니다.' },
      '1시간': { title: '🌊 형산강 고수부지 산책로', desc: '형산강 변을 따라 시원한 바람을 맞으며 걷는 트여있는 1시간 코스입니다.' },
      '3km': { title: '🚶 황성공원 전체 순환 (약 3km)', desc: '황성공원 내부 산책로와 운동장을 크게 둘러보는 평지 중심 3km 코스입니다.' },
      '5km': { title: '🏃 형산강 - 황성공원 연계 코스 (약 5km)', desc: '강변 산책로와 공원 숲길을 동시에 즐기는 경주시민 인기 5km 코스입니다.' }
    }
  }
};

let routeMarker = null;

function recommendCourse() {
  const startLoc = document.getElementById('start-location').value;
  const locData = courseDatabase[startLoc];

  if (!locData) return;

  const courseInfo = locData.courses[selectedTargetVal] || {
    title: `🐾 ${startLoc} 맞춤 산책 코스`,
    desc: `선택하신 ${startLoc} 출발지 주변의 우수한 산책로입니다.`
  };

  // 지도 이동 및 추천 코스 마커 표시
  if (routeMarker) map.removeLayer(routeMarker);

  map.setView([locData.lat, locData.lng], 15);
  routeMarker = L.marker([locData.lat, locData.lng]).addTo(map)
    .bindPopup(`<b>${courseInfo.title}</b>`)
    .openPopup();

  // 결과 화면 업데이트
  const resultBox = document.getElementById('recommend-result');
  document.getElementById('result-title').innerText = courseInfo.title;
  document.getElementById('result-desc').innerText = courseInfo.desc;
  resultBox.style.display = 'block';
}

// 5. 기록 저장 기능 (Local Storage)
const walkForm = document.getElementById('walk-form');
const logList = document.getElementById('log-list');

document.addEventListener('DOMContentLoaded', loadLogs);

walkForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const dogName = document.getElementById('dog-name').value;
  const walkTime = document.getElementById('walk-time').value;
  const walkDistance = document.getElementById('walk-distance').value;
  const walkMemo = document.getElementById('walk-memo').value;
  const startLoc = document.getElementById('start-location').value;

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const newLog = {
    dogName,
    walkTime,
    walkDistance,
    startLoc,
    target: selectedTargetVal,
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
  let locTargetInfo = ` [${log.startLoc} / ${log.target}]`;

  li.innerHTML = `
    <div class="log-title">🐕 ${log.dogName} - ${log.walkTime}분${distInfo}<span style="font-size:0.85rem; color:#4CAF50;">${locTargetInfo}</span></div>
    <div class="log-details">${log.date}</div>
    ${log.walkMemo ? `<div class="log-memo">"${log.walkMemo}"</div>` : ''}
  `;
  logList.prepend(li);
}
