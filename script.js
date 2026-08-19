// --- 1. 카카오맵 지도 초기화 및 마커 표시 ---
var container = document.getElementById('map');
var options = {
    center: new kakao.maps.LatLng(35.8427, 129.2084), // 경주시청 중심 좌표
    level: 7
};
var map = new kakao.maps.Map(container, options);

// 추천 코스 데이터 (위도, 경주 좌표 포함)
const sampleCourses = [
    { title: "황성공원 솔숲 산책로", goal: "30분", desc: "황성공원 운동장 주변 소나무 그늘 산책 코스 (약 2km)", lat: 35.852, lng: 129.203 },
    { title: "보문호수 산책로 코스", goal: "1시간", desc: "보문 호수를 따라 걷는 탁 트인 수변 코스 (약 7km)", lat: 35.848, lng: 129.255 },
    { title: "동궁과 월지 돌담길", goal: "3km", desc: "고즈넉한 경주 야경과 돌담을 구경하는 산책로", lat: 35.834, lng: 129.227 },
    { title: "형산강 체육공원 강변길", goal: "5km", desc: "탁 트인 강바람을 맞으며 걷기 좋은 평지 코스", lat: 35.830, lng: 129.210 }
];

// 지도에 샘플 코스 마커 일괄 생성
sampleCourses.forEach(course => {
    var markerPosition = new kakao.maps.LatLng(course.lat, course.lng);
    var marker = new kakao.maps.Marker({
        position: markerPosition
    });
    marker.setMap(map);

    // 마커 클릭 시 안내 메시지
    kakao.maps.event.addListener(marker, 'click', function() {
        alert(`[${course.title}] 코스입니다!\n설명: ${course.desc}`);
    });
});

let myCustomCourses = [];
let walkRecords = [];

// --- 2. 위치 검색 및 GPS 기능 ---
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            document.getElementById('locationInput').value = "경주시 현위치 (GPS 좌표 연동됨)";
            alert("현재 위치를 성공적으로 불러왔습니다!");
        }, function(error) {
            alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
        });
    } else {
        alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
}

function searchLocation() {
    const query = document.getElementById('locationInput').value;
    if(!query) {
        alert("주소나 장소명을 입력해주세요.");
        return;
    }
    alert(`"${query}" 주변 경주 지역의 위치를 탐색합니다.`);
}

// --- 3. 맞춤 코스 추천 기능 ---
function recommendCourses() {
    const selectedGoal = document.getElementById('goalSelect').value;
    const listDiv = document.getElementById('courseList');
    
    let filtered = sampleCourses.filter(c => c.goal === selectedGoal);
    if(filtered.length === 0) {
        filtered = sampleCourses;
    }

    let allCourses = [...filtered, ...myCustomCourses];

    let html = '';
    allCourses.forEach(course => {
        html += `
            <div class="course-item">
                <strong>🐾 ${course.title}</strong><br>
                <span style="font-size: 0.85rem; color: #555;">목표: ${course.goal} | ${course.desc}</span>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

// --- 4. 나만의 코스 등록 ---
function saveCustomCourse() {
    const title = document.getElementById('customTitle').value;
    const desc = document.getElementById('customDesc').value;
    const goal = document.getElementById('goalSelect').value;

    if(!title || !desc) {
        alert("코스 이름과 설명을 모두 입력해주세요.");
        return;
    }

    myCustomCourses.push({ title, goal, desc, lat: 35.8427, lng: 129.2084 }); // 임시로 경주시청 위치에 등록
    alert("나만의 코스가 성공적으로 등록되었습니다!");
    document.getElementById('customTitle').value = '';
    document.getElementById('customDesc').value = '';
    recommendCourses();
}

// --- 5. 산책 기록 저장 및 출력 ---
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
