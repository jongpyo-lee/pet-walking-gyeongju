// 초기 경주 지역 샘플 코스 데이터
const sampleCourses = [
    { title: "황성공원 솔숲 산책로", goal: "30분", desc: "황성공원 운동장 주변 소나무 그늘 산책 코스 (약 2km)" },
    { title: "보문호수 산책로 코스", goal: "1시간", desc: "보문 호수를 따라 걷는 탁 트인 수변 코스 (약 7km)" },
    { title: "동궁과 월지 돌담길", goal: "3km", desc: "고즈넉한 경주 야경과 돌담을 구경하는 산책로" },
    { title: "형산강 체육공원 강변길", goal: "5km", desc: "탁 트인 강바람을 맞으며 걷기 좋은 평지 코스" }
];

let myCustomCourses = [];
let walkRecords = [];

// 현재 위치 가져오기 버튼 기능
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

// 주소 검색 버튼 기능
function searchLocation() {
    const query = document.getElementById('locationInput').value;
    if(!query) {
        alert("주소나 장소명을 입력해주세요.");
        return;
    }
    alert(`"${query}" 주변 경주 지역의 위치를 탐색합니다.`);
}

// 맞춤 코스 추천 기능
function recommendCourses() {
    const selectedGoal = document.getElementById('goalSelect').value;
    const listDiv = document.getElementById('courseList');
    
    // 목표에 맞는 샘플 코스 필터링
    let filtered = sampleCourses.filter(c => c.goal === selectedGoal);
    if(filtered.length === 0) {
        filtered = sampleCourses;
    }

    // 내가 만든 코스도 포함
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

// 나만의 코스 등록
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

// 산책 기록 저장
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

// 산책 기록 리스트 화면에 뿌려주기
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
