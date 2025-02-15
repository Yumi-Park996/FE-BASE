let map;
let marker;
let selectedLocation = "";

// 모달이 열릴 때 지도 초기화
document
  .getElementById("mapModal")
  .addEventListener("shown.bs.modal", function () {
    initMap();
  });

// 카카오맵 초기화 함수
function initMap() {
  const container = document.getElementById("map");

  // 지도 생성 옵션
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.978),
    level: 3,
  };

  // 지도가 이미 생성되었으면 새로 생성하지 않음
  if (!map) {
    map = new kakao.maps.Map(container, options);
  } else {
    map.relayout(); // 모달이 뜰 때 지도 리사이즈
  }

  // 마커 생성
  if (!marker) {
    marker = new kakao.maps.Marker({
      position: map.getCenter(),
    });
    marker.setMap(map);
  }

  // 지도 클릭 시 마커 이동 및 주소 가져오기
  kakao.maps.event.addListener(map, "click", function (mouseEvent) {
    const latlng = mouseEvent.latLng;
    marker.setPosition(latlng);

    geocoder.coord2Address(
      latlng.getLng(),
      latlng.getLat(),
      function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          selectedLocation = result[0].address.address_name;
        }
      }
    );
  });
}

// "선택 완료" 버튼 클릭 시 위치 입력 필드 업데이트
document
  .getElementById("confirmLocation")
  .addEventListener("click", function () {
    document.getElementById("locationInput").value = selectedLocation;
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("mapModal")
    );
    modal.hide();
  });

// 선택창 입력 받기기
function updateDropdownText(menuId, buttonId) {
  document
    .querySelectorAll(`#${menuId} input[type="radio"]`)
    .forEach((input) => {
      input.addEventListener("change", function () {
        document.getElementById(buttonId).textContent = this.value;
      });
    });
}

updateDropdownText("petSizeMenu", "petSizeBtn");
updateDropdownText("isPredatorMenu", "isPredatorBtn");
updateDropdownText("publicAccessMenu", "publicAccessBtn");

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
