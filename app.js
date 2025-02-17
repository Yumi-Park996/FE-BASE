// const baseUrl = "http://localhost:3000";
const baseUrl = 'https://miniature-purple-scissor.glitch.me';

// 📌 장소 목록 조회
async function fetchBaseList(tourValue) {
  try {
    const response = await fetch(`${baseUrl}/baselist?tourValue=${tourValue}&lat=${window.selectedLatlng.lat}&lng=${window.selectedLatlng.lng}`);

    // const data = await response.text(); // JSON 대신 text로 받아보기
    // console.log("📌 응답 본문:", data);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    // contentid만 추출하여 배열로 반환
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching content IDs:', error);
    return [];
  }
}

// 📌 개별 API 호출 (각 contentid에 대해 호출)
async function fetchDetail(contentId) {
  try {
    const response = await fetch(`${baseUrl}/tour/detail?contentId=${contentId}`);

    // const data = await response.text(); // JSON 대신 text로 받아보기
    // console.log("📌 응답 본문:", data);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data; // 상세 정보 반환
  } catch (error) {
    console.error(`Error fetching details for contentId ${contentId}:`, error);
    return null;
  }
}

function getSelectedTourValue() {
  const selectedRadio = document.querySelector('input[name="tourType"]:checked');
  if (selectedRadio) {
    return selectedRadio.value;
  }
  return ''; // 아무것도 선택되지 않았을 경우
}

// 📌 모든 API 호출 실행
async function fetchAllDetails() {
  // 관광 카테고리
  const tourValue = getSelectedTourValue();
  console.log(tourValue + '\n');

  // 장소 기본 정보
  if (!window.selectedLatlng?.lng || !window.selectedLatlng?.lat) {
    // 객체가 없을 경우 먼저 생성
    if (!window.selectedLatlng) {
      window.selectedLatlng = {};
    }

    // 기본 위치 설정 (서울시청 좌표)
    window.selectedLatlng.lng = 126.97865225753738;
    window.selectedLatlng.lat = 37.566842224638414;
  }
  const data = await fetchBaseList(tourValue);

  // 만약에 data가 없다면 종료
  if (data.length === 0) {
    console.log('주위의 정보 없음', data);

    const resultDiv = document.getElementById('result');
    const div = document.createElement('div');

    // 조회된 관광/숙소가 없음
    const message = document.createElement('p');
    message.textContent = '조회된 관광/숙소가 없음';
    div.appendChild(message);

    // resultDiv 안에 추가
    resultDiv.appendChild(div);

    return;
  }

  // contentid 배열 가져오기
  const contentIds = data.map(item => item.contentid);

  console.log('📌 가져온 contentId 목록:', contentIds);

  if (contentIds.length === 0) {
    console.error('📌 contentId가 없습니다.');
    return;
  }

  // Promise.all()로 모든 API 호출 실행
  const detailsArray = await Promise.all(contentIds.map(fetchDetail));

  console.log(detailsArray);
  // 📌 배열 내부 구조 확인 후 문자열 변환
  const detailsString = detailsArray
    .map((detail, index) => {
      if (!detail || !Array.isArray(detail) || detail.length === 0) return null;
      const item = detail[0]; // 첫 번째 요소 가져오기

      // 장소의 속성 정리
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'string') {
          item[key] = item[key].replace(/[-\s]+/g, ' ').trim();
        }
      });

      const info = data[index];
      const title = info.title;
      const addr = `${info.addr1} ${info.addr2}`;

      return `${index}번 장소 이름: ${title} 상세 주소: ${addr} 사고 예방 및 응급 조치 관련 정보: ${item.relaAcdntRiskMtr}, 반려동물 동반 가능 구역 정보: ${item.acmpyTypeCd}, 관련 시설: ${item.relaPosesFclty}, 제공되는 반려동물 관련 용품: ${item.relaFrnshPrdlst}, 기타 동반 정보: ${item.etcAcmpyInfo}, 구매 가능한 제품 목록: ${item.relaPurcPrdlst}, 동반 가능한 반려견 기준: ${item.acmpyPsblCpam}, 대여 관련 제품 목록: ${item.relaRntlPrdlst}, 필수 동반 조건: ${item.acmpyNeedMtr}`;
    })
    .filter(item => item !== null) // null 값 제거
    .join('\n'); // 줄바꿈으로 연결

  // pet 정보
  // 각 input 필드의 값을 가져오기
  const name = document.getElementById('petName').value.trim();
  const species = document.getElementById('petSpecies').value.trim();
  const size = document.getElementById('petSizeBtn').textContent !== '선택' ? document.getElementById('petSizeBtn').textContent.trim() : '선택 안 함';
  const isPredator = document.getElementById('isPredatorBtn').textContent !== '선택' ? document.getElementById('isPredatorBtn').textContent.trim() : '선택 안 함';
  const isPublicFriendly = document.getElementById('publicAccessBtn').textContent !== '선택' ? document.getElementById('publicAccessBtn').textContent.trim() : '선택 안 함';

  // 값을 하나의 문자열로 연결
  const petInfo = `이름: ${name}, 종: ${species}, 크기: ${size}, 맹수 여부: ${isPredator}, 공공장소 동행 가능 여부: ${isPublicFriendly}`;
  const prompt = '숙소 정보:\n' + detailsString + '\n반려동물 정보:\n' + petInfo;
  console.log('📌 숙소 정보, 펫 정보:\n', prompt);

  // gemini에게 물어봅시다..
  const url = `https://miniature-purple-scissor.glitch.me/gemini?type=${tourValue}`;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      text: prompt,
    }),
    // Content-Type 꼭!
    headers: {
      'Content-Type': 'Application/json',
    },
  });
  const json = await response.json();
  let infoList = JSON.parse(json.reply);

  // 화면에 보여주는 함수
  displayInfo(infoList, data, tourValue);
}

function displayInfo(infoList, data, tourValue) {
  const resultDiv = document.getElementById('result');

  // 조건에 부합되는 관광/숙소가 없다면
  if (infoList[0] === -1 || infoList.length === 0) {
    const div = document.createElement('div');

    // 반려 동물 정보에 맞는 관광/숙소가 없음
    const message = document.createElement('p');
    message.textContent = '반려 동물 정보에 맞는 관광/숙소가 없음';
    div.appendChild(message);

    // resultDiv 안에 추가
    resultDiv.appendChild(div);
  } else {
    // data 배열에서 각 숙소의 정보 출력
    for (const [index, placeInfo] of infoList.entries()) {
      const item = data[placeInfo.NUMBER]; // 번호에 맞는 숙소 정보

      const div = document.createElement('div');
      div.classList.add('info-card');
      div.id = `${tourValue}-${index}`; // 인덱스를 기반으로 id 설정

      // 숙소 이름
      const title = document.createElement('h3');
      title.classList.add('info-name');
      title.textContent = item.title;
      div.appendChild(title);

      // 숙소 주소
      const address = document.createElement('p');
      address.classList.add('info-address');
      address.textContent = `📍 ${item.addr1} ${item.addr2}`;
      div.appendChild(address);

      // 숙소 이미지 (없으면 대체 이미지 설정)
      const image = document.createElement('img');
      image.classList.add('info-image');

      if (item.firstimage) {
        image.src = item.firstimage;
      } else {
        image.src = './asset/notfound.png'; // 기본 이미지 경로
      }
      image.alt = item.title;
      image.style.width = '50%'; // 이미지 크기 조절
      div.appendChild(image);

      // 주요특징
      const info = document.createElement('p');
      info.classList.add('info-description');
      info.textContent = `🔍 ${placeInfo.INFO && placeInfo.INFO.trim() ? placeInfo.INFO : '정보 없음'}`;

      div.appendChild(info);

      // 운영시간
      const time = document.createElement('p');
      time.classList.add('info-hours');
      time.textContent = `📅 ${placeInfo.TIME && placeInfo.TIME.trim() ? placeInfo.TIME : '정보 없음'}`;

      div.appendChild(time);

      // 전화번호
      const tel = document.createElement('p');
      time.classList.add('info-phone');
      tel.textContent = `📞  ${item.tel && item.tel.trim() ? item.tel : '정보 없음'}`;

      div.appendChild(tel);

      /*
    // 숙소 링크 (필요시 추가)
    const link = document.createElement("a");
    link.href = `http://tour.visitkorea.or.kr/${item.contentid}`;
    link.target = "_blank";
    link.textContent = "상세보기";
    div.appendChild(link);
    */

      resultDiv.appendChild(div);
    }
  }
  // 로딩 스피너 비활성화
  document.getElementById('spinner').innerHTML = '';
}

document.getElementById('fetchButton').addEventListener('click', fetchAllDetails);
