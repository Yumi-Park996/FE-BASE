// 📌 Supabase 클라이언트 생성 (환경 변수 대신 직접 입력)
const supabase = window.supabase.createClient(
  "https://kjlypjubepptwtfjxxpy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbHlwanViZXBwdHd0Zmp4eHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NDQyNTEsImV4cCI6MjA1NTAyMDI1MX0.f5GXW2J7c2bFItWRNgJtEA9tUEGANoLtyGSflyHqHsk",
  {
    auth: { persistSession: true, autoRefreshToken: true }, // ✅ 세션 유지
  }
);

// ✅ Supabase 객체가 정상적으로 생성되었는지 확인
console.log("✅ Supabase 객체:", supabase);

const API_URL = "http://127.0.0.1:3000"; // 백엔드 서버 주소

const postList = document.getElementById("postList");
const postForm = document.getElementById("postForm");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ main.js 로드 완료");

  // ✅ 네비게이션 바 동적으로 로드
  await loadNavbar();
  setTimeout(() => {
    console.log("네비게이션 로드 후 실행");
    checkLogin();
  }, 100);
});
// 📌 네비게이션 바 동적 로드 함수
async function loadNavbar() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) {
    console.error("🛑 네비게이션 바 컨테이너를 찾을 수 없음!");
    return;
  }

  try {
    const response = await fetch("./templates/navbar.html");
    const navbarHTML = await response.text();
    navbarContainer.innerHTML = navbarHTML;
    console.log("✅ 네비게이션 바 로드 완료!");

    // ✅ 네비게이션 바가 완전히 로드된 후 로그인 상태 확인
    checkLogin();
  } catch (error) {
    console.error("🛑 네비게이션 바 로드 실패:", error);
  }
}
// 📌 소셜 로그인 함수 (GitHub, Google 지원)
async function signInWithProvider(provider) {
  console.log(`🔹 기존 세션 초기화 중...`);
  await supabase.auth.signOut(); // ✅ 기존 세션 삭제 후 로그인 진행
  console.log(window.location.origin);
  const redirectUrl = window.location.origin + "/FE-BASE/index.html"; // ✅ 로그인 후 돌아올 경로 //####

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectUrl,
      prompt: "select_account", // ✅ 항상 계정 선택 창 띄우기
    },
  });

  if (error) {
    console.error(`🛑 ${provider} 로그인 오류:`, error.message);
  } else {
    console.log(`✅ ${provider} 로그인 요청 보냄:`, data);
  }
  // ✅ 로그인 후 2초 뒤에 세션 강제 업데이트 (Supabase 세션 반영 속도 문제 해결)
  setTimeout(async () => {
    await supabase.auth.getSession();
    checkLogin();
  }, 2000);
}

// 📌 로그인 버튼 이벤트 추가 (각 버튼 클릭 시 provider 설정)
document
  .querySelector("#login-github")
  .addEventListener("click", () => signInWithProvider("github"));
document
  .querySelector("#login-google")
  .addEventListener("click", () => signInWithProvider("google"));

async function checkLogin() {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    console.log("🔹 Supabase 세션 데이터:", sessionData);

    const loginBtn = document.querySelector("#login-btn"); // 로그인 버튼
    const logoutBtn = document.querySelector("#logout-btn"); // 로그아웃 버튼

    if (!loginBtn || !logoutBtn) {
      console.error("🛑 네비게이션 바 버튼을 찾을 수 없음!");
      return;
    }

    // ✅ 로그인 버튼 클릭 시 로그인 페이지로 이동 (이벤트 리스너 추가)
    loginBtn.removeEventListener("click", handleLoginClick); // 중복 방지
    loginBtn.addEventListener("click", handleLoginClick);

    if (error || !sessionData?.session) {
      console.warn("🔹 세션 없음, 로그아웃 상태 유지");
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      return;
    }

    // ✅ 현재 로그인한 사용자 정보 가져오기
    const { data: userCheck, error: userCheckError } =
      await supabase.auth.getUser();

    if (userCheckError || !userCheck?.user) {
      console.warn("🛑 사용자 계정이 삭제됨! 강제 로그아웃 실행...");
      await supabase.auth.signOut();
      window.location.reload();
      return;
    }

    console.log("✅ 로그인 상태 확인 완료! 네비게이션 바 업데이트");
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // ✅ 로그아웃 버튼 클릭 시 로그아웃 실행
    logoutBtn.removeEventListener("click", signOutAndClearSession); // 중복 방지
    logoutBtn.addEventListener("click", signOutAndClearSession);
  } catch (err) {
    console.error("🛑 checkLogin() 실행 중 오류 발생:", err);
  }
}
// 📌 로그인 버튼 클릭 시 실행될 함수
function handleLoginClick() {
  console.log("🔹 로그인 버튼 클릭됨, login.html로 이동!");
  window.location.href = "./login.html";
}
// ✅ 로그인 상태 자동 감지 (로그인/로그아웃 감지)
supabase.auth.onAuthStateChange((event, session) => {
  console.log("🔹 인증 상태 변경 감지됨:", event, session);
  checkLogin(); // ✅ 로그인 상태 자동 업데이트
});

// ✅ 페이지 로드 시 로그인 상태 확인
document.addEventListener("DOMContentLoaded", checkLogin);

//📌 로그아웃
async function signOutAndClearSession() {
  console.log("🔹 로그아웃 버튼 클릭됨, 세션 삭제 시도...");
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("🛑 로그아웃 실패:", error.message);
  } else {
    console.log("✅ 로그아웃 성공");

    // ✅ 페이지 새로고침 (세션 정보만 삭제)
    window.location.reload();
  }
}

// 📌 로그아웃 버튼 이벤트 추가
document
  .querySelector("#logout")
  .addEventListener("click", signOutAndClearSession);

async function checkAuth() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return null;
  }
  return sessionData.session.user.id;
}
