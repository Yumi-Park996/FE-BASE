const TOUR_TYPE = {
  12: "관광지",
  14: "문화시설",
  15: "축제공연행사",
  25: "여행코스",
  28: "레포츠",
  32: "숙박",
  38: "쇼핑",
  39: "음식점",
};

var map;
var marker;
var geocoder;
var infowindow;

function loadKaKaoMap(x = 37.566842224638414, y = 126.97865225753738) {
  var mapContainer = document.getElementById("map"), // 지도를 표시할 div
    mapOption = {
      center: new kakao.maps.LatLng(x, y), // 지도의 중심좌표
      level: 3, // 지도의 확대 레벨
    };

  map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

  // 주소-좌표 변환 객체를 생성합니다
  geocoder = new kakao.maps.services.Geocoder();
  infowindow = new kakao.maps.InfoWindow({ zindex: 1 }); // 클릭한 위치에 대한 주소를 표시할 인포윈도

  // 지도를 클릭한 위치에 표출할 마커입니다
  marker = new kakao.maps.Marker({
    // 지도 중심좌표에 마커를 생성합니다
    position: map.getCenter(),
  });

  // 지도에 클릭 이벤트를 등록합니다
  // 지도를 클릭하면 마지막 파라미터로 넘어온 함수를 호출합니다
  kakao.maps.event.addListener(map, "click", clickEvent);
}

function moveMap(keyword) {
  // 장소 검색 객체를 생성

  var ps = new kakao.maps.services.Places();

  ps.keywordSearch(keyword, function (data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
      console.log(data[0].y, data[0].x); // 첫 번째 검색 결과의 위도(y)와 경도(x) 출력

      var newCenter = new kakao.maps.LatLng(data[0].y, data[0].x);

      if (map) {
        map.setCenter(newCenter); // 기존 map의 중심만 변경
        map.setLevel(4); // 지도 레벨을 5로 변경
      } else {
        loadKaKaoMap(data[0].y, data[0].x);
      }
    } else {
      console.log("검색 실패:", status);
    }
  });
}

function searchDetailAddrFromCoords(coords, callback) {
  // 좌표로 법정동 상세 주소 정보를 요청합니다
  geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
}

function clickEvent(mouseEvent) {
  searchDetailAddrFromCoords(mouseEvent.latLng, function (result, status) {
    if (status === kakao.maps.services.Status.OK) {
      var detailAddr = !!result[0].road_address
        ? "<div>도로명주소 : " + result[0].road_address.address_name + "</div>"
        : "";
      detailAddr +=
        "<div>지번 주소 : " + result[0].address.address_name + "</div>";

      var content =
        '<div class="bAddr">' +
        '<span class="infoWindow">법정동 주소정보</span>' +
        detailAddr +
        "</div>";

      // 마커를 클릭한 위치에 표시합니다
      var latlng = mouseEvent.latLng;
      marker.setPosition(latlng);
      marker.setMap(map);

      // 인포윈도우에 클릭한 위치에 대한 법정동 상세 주소정보를 표시
      infowindow.setContent(content);
      infowindow.open(map, marker);

      // 클릭한 위치의 위도와 경도 정보를 객체로 저장하여 전역 객체인 window에 저장
      window.selectedLatlng = {
        lat: latlng.getLat(), // 위도 값 저장
        lng: latlng.getLng(), // 경도 값 저장
      };

      var message = result[0].address.address_name;

      var resultDiv = document.getElementById("locationInput");
      resultDiv.value = message;
    }
  });
}

document.getElementById("searchButton").addEventListener("click", function () {
  // 입력된 키워드 가져오기
  var keyword = document.getElementById("keywordInput").value;
  // moveMap 함수 실행
  moveMap(keyword);
});

loadKaKaoMap();

// 모달이 열릴 때 지도 초기화
document
  .getElementById("mapModal")
  .addEventListener("shown.bs.modal", function () {
    map.relayout();
  });

// "선택 완료" 버튼 클릭 시 맵 모달 Hide
document
  .getElementById("confirmLocation")
  .addEventListener("click", function () {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("mapModal")
    );
    modal.hide();
  });

// 선택창 입력 받기
function updateDropdownText(menuId, buttonId, isTourType) {
  document
    .querySelectorAll(`#${menuId} input[type="radio"]`)
    .forEach((input) => {
      input.addEventListener("change", function () {
        console.log(this.value);
        let selected = this.value;
        if (isTourType) selected = TOUR_TYPE[selected];
        document.getElementById(buttonId).textContent = selected;
      });
    });
}

updateDropdownText("petSizeMenu", "petSizeBtn", false);
updateDropdownText("isPredatorMenu", "isPredatorBtn", false);
updateDropdownText("publicAccessMenu", "publicAccessBtn", false);
updateDropdownText("tourTypeMenu", "tourTypeBtn", true);

//폼 제출 이벤트
document.getElementById("petForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("petName").value;
  const species = document.getElementById("petSpecies").value;
  const petSize =
    document.getElementById("petSizeBtn").textContent !== "선택"
      ? document.getElementById("petSizeBtn").textContent
      : "선택 안 함";
  const isPredator =
    document.getElementById("isPredatorBtn").textContent !== "선택"
      ? document.getElementById("isPredatorBtn").textContent
      : "선택 안 함";
  const publicAccess =
    document.getElementById("publicAccessBtn").textContent !== "선택"
      ? document.getElementById("publicAccessBtn").textContent
      : "선택 안 함";
  const location =
    document.getElementById("locationInput").value || "선택 안 함";

  document.getElementById("result").innerHTML = `
      <h4>입력한 정보</h4>
      <p><strong>이름:</strong> ${name}</p>
      <p><strong>종:</strong> ${species}</p>
      <p><strong>동물 크기:</strong> ${petSize}</p>
      <p><strong>맹수 여부:</strong> ${isPredator}</p>
      <p><strong>공공장소 동행 가능 여부:</strong> ${publicAccess}</p>
  `;
});
