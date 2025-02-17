// 여기 추가가
document.addEventListener("DOMContentLoaded", () => {
  console.log("loadposttest");
  checkLoginStatus();

  // 🔹 현재 페이지가 community.html이면 게시글 불러오기 실행
  if (window.location.pathname.includes("community.html")) {
    loadPosts();
  }
  const addPostBtn = document.getElementById("addPostBtn");
  if (addPostBtn) {
    addPostBtn.addEventListener("click", async () => {
      const isLoggedIn = await checkLoginStatus();

      if (isLoggedIn) {
        console.log("✅ 로그인됨, 게시글 작성 페이지로 이동");
        window.location.href = "write.html"; // ✅ 로그인 시 write.html로 이동
      } else {
        console.warn("🛑 로그인되지 않음, 로그인 페이지로 이동");
        alert("로그인이 필요합니다!");
        window.location.href = "login.html"; // ❌ 로그인 안 되어 있으면 login.html로 이동
      }
    });
  }
});
// 여기 추가
async function checkLoginStatus() {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error || !sessionData?.session) {
      console.log("🛑 로그인 상태: 로그아웃됨");
      return false;
    } else {
      console.log("✅ 로그인 상태: 로그인됨");
      return true;
    }
  } catch (err) {
    console.error("🛑 로그인 상태 확인 중 오류 발생:", err);
    return false;
  }
}

// 📌 서버에서 게시글 불러오기
async function loadPosts() {
  console.log("loadtest");
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();

  postList.innerHTML = ""; // 기존 게시글 초기화
  const isLoggedIn = await checkLoginStatus();

  if (!isLoggedIn) {
    console.log("🛑 로그인하지 않은 사용자");
  }

  posts.forEach((post) => createPostElement(post));
}

// 📌 Supabase Storage에 이미지 업로드하는 함수
async function uploadImageToSupabase(file) {
  const imageName = file.name
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .replace(/^\/+/, "");
  console.log("📌 업로드할 파일명:", imageName); //

  try {
    // ✅ Supabase Storage에 업로드 요청
    const { data, error } = await supabase.storage
      .from("images")
      .upload(imageName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("🛑 이미지 업로드 실패:", error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    console.log("✅ 이미지 업로드 성공:", data);

    // ✅ 수동으로 URL 생성 (기본 사용)
    let publicURL = `https://kjlypjubepptwtfjxxpy.supabase.co/storage/v1/object/public/images/${imageName}`;
    console.log("📌 수동으로 생성된 이미지 URL:", publicURL);

    return publicURL; // ✅ 정상적인 URL 반환
  } catch (error) {
    console.error("🛑 이미지 업로드 중 예외 발생:", error.message);
    throw error;
  }
}

// ===============여기추가================= //
// 현재 로그인한 사용자의 user_id 가져오기
// ✅ 로그인 여부를 확인하는 새로운 함수 (로그인 안 되어도 오류 없이 진행)
async function getCurrentUserId() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    return null; // 로그인하지 않은 경우 null 반환 (경고창 없음)
  }
  return sessionData.session.user.id;
}
//===================================//

// 📌 게시글 저장 (이미지 base64 변환 후 Supabase DB 저장)
async function savePost(title, content, imageFile) {
  let imageUrl = null;

  // ✅ 현재 로그인된 사용자 정보 가져오기
  const { data: sessionData, error } = await supabase.auth.getSession();

  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return;
  }

  const access_token = sessionData.session.access_token;
  const user_id = sessionData.session.user.id; // ✅ user_id 가져오기

  // ✅ Supabase Storage에 직접 업로드
  if (imageFile) {
    try {
      imageUrl = await uploadImageToSupabase(imageFile);
    } catch (error) {
      alert("이미지 업로드 실패!");
      return;
    }
  }

  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`, // ✅ Authorization 헤더 추가
    },
    body: JSON.stringify({ title, content, image_url: imageUrl, user_id }),
  });

  const responseData = await response.json();
  console.log("📌 API 응답:", responseData); // ✅ API 응답 확인

  if (response.ok) {
    loadPosts();
  } else {
    alert(`게시글 저장 실패! 오류: ${responseData.error}`);
  }
}

// 📌 서버에서 게시글 수정하기 (updated_at 반영 + 디버깅 추가)
async function updatePost(postId) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) {
    return;
  }
  console.log(postId);
  const titleElement = document.getElementById(`edit-title-${postId}`);
  const contentElement = document.getElementById(`edit-content-${postId}`);
  const fileInput = document.getElementById(`edit-image-${postId}`);

  if (!titleElement || !contentElement) {
    alert("수정할 게시글을 찾을 수 없습니다.");
    return;
  }

  const title = titleElement.value;
  const content = contentElement.value;

  let imageUrl =
    document.getElementById(`current-image-${postId}`)?.src || null;

  // ✅ Supabase Storage에 직접 업로드
  if (fileInput && fileInput.files.length > 0) {
    imageUrl = await uploadImageToSupabase(fileInput.files[0]);
  }

  // ✅ 서버로 게시글 데이터 전송 (PATCH 사용 → 부분 업데이트)
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: "PUT", // ✅ PUT → PATCH로 변경 (전체 업데이트 대신 부분 업데이트)
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, image_url: imageUrl }),
    });

    if (!response.ok) {
      console.warn(`[디버깅] 서버 응답 오류 - 상태 코드: ${response.status}`);
      alert(`게시글 수정 실패! (상태 코드: ${response.status})`);
      return;
    }

    console.log(`[디버깅] 게시글 수정 성공 - postId: ${postId}`);
    loadPosts(); // ✅ 수정된 내용 다시 불러오기
  } catch (error) {
    console.error("[디버깅] 게시글 수정 중 오류 발생:", error);
    alert("게시글 수정 중 오류가 발생했습니다.");
  }
}

// 📌 게시글 이미지 삭제
async function deleteImage(postId) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const confirmDelete = confirm("이미지를 삭제하시겠습니까?");
  if (!confirmDelete) return;

  // ✅ Storage에서 직접 삭제 요청 추가
  const imageElement = document.getElementById(`current-image-${postId}`);
  if (imageElement) {
    const imageUrl = imageElement.src;
    const filePath = imageUrl.split("/images/")[1]; // Storage 파일명 추출
    const { error } = await supabase.storage.from("images").remove([filePath]);

    if (error) {
      console.error("🛑 Storage 이미지 삭제 오류:", error);
      alert("이미지 삭제 실패!");
      return;
    }
  }

  // ✅ DB에서도 image_url 제거
  const response = await fetch(`${API_URL}/posts/${postId}/image`, {
    method: "DELETE",
  });

  if (response.ok) {
    alert("이미지가 삭제되었습니다!");
    loadPosts();
  } else {
    alert("이미지 삭제 실패!");
  }
}

// 📌 서버에서 게시글 삭제하기
async function deletePost(postId) {
  // === 추가 ===
  const user_id = await getCurrentUserId(); // ✅ 현재 로그인한 사용자 ID 가져오기
  // ==
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const confirmDelete = confirm("정말로 삭제하시겠습니까?");
  if (!confirmDelete) return;

  // ✅ 로그인 토큰 가져오기 추가=============
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    alert("로그인이 필요합니다!");
    return;
  }
  const access_token = sessionData.session.access_token;
  //========================================

  // ✅ 게시글에 연결된 이미지 확인
  const postElement = document.getElementById(`current-image-${postId}`);
  if (postElement) {
    const imageUrl = postElement.src;
    const filePath = imageUrl.split("/images/")[1]; // Storage 파일명 추출

    // ✅ Supabase Storage에서 이미지 삭제
    const { error } = await supabase.storage.from("images").remove([filePath]);
    if (error) {
      console.error("🛑 Storage 이미지 삭제 오류:", error);
      alert("게시글 삭제 중 이미지 삭제에 실패했습니다.");
      return;
    }
  }

  const response = await fetch(`${API_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`, // ✅ 로그인한 사용자 인증 추가
    },
  });

  if (response.ok) {
    alert("게시글 삭제 완료");
    loadPosts();
  } else {
    alert("게시글 삭제 실패!");
  }
}

// 📌 댓글 추가하기
async function addComment(board_id) {
  const user_id = await checkAuth(); // ✅ 로그인 체크
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료

  const commentInput = document.getElementById(`comment-input-${board_id}`);
  const content = commentInput.value.trim();
  if (!content) return;

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board_id, content }),
  });

  const responseData = await response.json();
  console.log("📌 API 응답:", responseData); // ✅ API 응답 확인

  if (response.ok) {
    loadComments(board_id);
  } else {
    alert(`댓글 작성 실패! 오류: ${responseData.error}`);
  }
}

// 📌 서버에서 댓글 수정하기
async function updateComment(commentId, board_id) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료
  const contentInput = document.getElementById(`edit-comment-${commentId}`);

  const newContent = contentInput.value.trim();
  if (!newContent) return alert("댓글 내용을 입력하세요.");

  await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: newContent }),
  });

  loadComments(board_id); // 수정 후 해당 게시글의 댓글 다시 불러오기
}

// 📌 댓글 삭제하기
async function deleteComment(commentId, board_id) {
  const user_id = await checkAuth(); // ✅ 로그인 체크 추가
  if (!user_id) return; // ✅ 로그인되지 않으면 함수 종료
  await fetch(`${API_URL}/comments/${commentId}`, { method: "DELETE" });
  loadComments(board_id); // 다시 불러오기
}

// 📌 글 작성 이벤트 (이미지 업로드 추가)
postForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageFile = document.getElementById("image").files[0]; // 파일 선택

  if (!title || !content) return;

  await savePost(title, content, imageFile);

  // 입력 필드 초기화
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("image").value = "";

  window.location.href = "./community.html";
});

//===========여기 추가=========//
function goToEditPage(postId) {
  window.location.href = `edit.html?id=${postId}`;
}
// 📌 게시글을 동적으로 생성하는 함수 (개선된 디자인 적용)
async function createPostElement(post) {
  const postDiv = document.createElement("div");
  const spinner = document.querySelector("#spinnerContainer");
  postDiv.classList.add("col-md-4", "mb-4"); // 🔹 3개씩 배치 (Bootstrap Grid 활용)

  const createdDate = new Date(post.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  const updatedDate = post.updated_at
    ? new Date(post.updated_at).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      })
    : null;
  const isUpdated = post.updated_at && post.updated_at !== post.created_at;

  let dateText = isUpdated
    ? `<div class="post-updated text-muted">✏ 수정됨: ${updatedDate}</div>`
    : `<div class="post-date text-muted">📅 작성일: ${createdDate}</div>`;

  let imageTag = post.image_url
    ? `<img src="${post.image_url}" class="card-img-top" alt="게시물 이미지">`
    : "";

  // ✅ 새로 만든 getCurrentUserId() 사용 (로그인 안 해도 오류 안 나도록)
  const currentUserId = await getCurrentUserId();

  let editButton = "";
  if (currentUserId && post.user_id && currentUserId === post.user_id) {
    editButton = `<button class="btn btn-sm btn-outline-primary edit-btn" onclick="goToEditPage('${post.id}')">✏ 수정</button>`;
  }

  // 🛑 삭제 버튼: 현재 로그인한 사용자와 게시글 작성자가 같은 경우에만 표시
  let deleteButton = "";
  if (currentUserId && post.user_id && currentUserId === post.user_id) {
    deleteButton = `<button class="btn btn-sm btn-outline-danger delete-btn" onclick="deletePost('${post.id}')">🗑 삭제</button>`;
  }

  // ========삭제============//
  postDiv.innerHTML = `
        <div class="card shadow-sm">
            <!-- 기존 게시글 내용 (보기 모드) -->
            <div id="view-mode-${post.id}">
                <a href="post-detail.html?id=${
                  post.id
                }" class="text-decoration-none text-dark">
                    ${imageTag}
                    <div class="card-body">
                        <h5 class="card-title">${post.title}</h5>
                        <p class="card-text">${post.content.substring(
                          0,
                          50
                        )}...</p>
                        ${dateText}
                    </div>
                </a>
                <div class="d-flex justify-content-between mt-3 p-2">
                    ${editButton}
                    ${deleteButton}
                </div>
            </div>
        </div>
  `;
  spinner.style.display = "none";
  document.getElementById("postList").appendChild(postDiv);
  //loadComments(post.id); // 댓글 불러오기
}

// 📌 특정 게시글의 댓글 불러오기 (작성 & 수정 날짜 포함)
async function loadComments(board_id) {
  const response = await fetch(`${API_URL}/comments?board_id=${board_id}`);
  const comments = await response.json();

  const commentsDiv = document.getElementById(`comments-${board_id}`);
  commentsDiv.innerHTML = ""; // 기존 댓글 초기화

  comments.forEach((comment) => {
    const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
    const updatedDate = comment.updated_at
      ? new Date(comment.updated_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })
      : null;
    const isUpdated =
      comment.updated_at && comment.updated_at !== comment.created_at;

    let dateText = isUpdated
      ? `<div class="comment-updated">✏ 수정: ${updatedDate}</div>`
      : `<div class="comment-date">📅 작성: ${createdDate}</div>`;

    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");
    commentElement.innerHTML = `
        <div id="view-comment-${comment.id}">
            <p class="comment-content">${comment.content}</p>
            ${dateText}
            <div class="comment-actions">
                <button class="btn btn-sm btn-outline-primary edit-comment-btn" data-comment-id="${comment.id}"  onclick="enableCommentEditMode('${comment.id}', '${comment.content}')">✏ 수정</button>
                <button class="btn btn-sm btn-outline-danger delete-comment-btn" data-comment-id="${comment.id}" data-board-id="${board_id}" onclick="deleteComment('${comment.id}', '${board_id}')">🗑 삭제</button>
            </div>
        </div>
  
        <div id="edit-comment-mode-${comment.id}" style="display: none;">
            <input type="text" id="edit-comment-${comment.id}" class="form-control comment-edit-input" value="${comment.content}">
            <button class="btn btn-success save-comment-btn" data-comment-id="${comment.id}" data-board-id="${board_id}" onclick="updateComment('${comment.id}', '${board_id}')">💾 저장</button>
            <button class="btn btn-secondary cancel-comment-btn" data-comment-id="${comment.id}" onclick="disableCommentEditMode('${comment.id}')">❌ 취소</button>
        </div>
      `;
    commentsDiv.appendChild(commentElement);
  });
}

// 📌 수정 모드 활성화
function enableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "none";
  document.getElementById(`edit-mode-${postId}`).style.display = "block";
}

// 📌 수정 모드 취소
function disableEditMode(postId) {
  document.getElementById(`view-mode-${postId}`).style.display = "block";
  document.getElementById(`edit-mode-${postId}`).style.display = "none";
}

// 📌 댓글 수정 모드 활성화
function enableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "none";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display =
    "block";
}

// 📌 댓글 수정 모드 취소
function disableCommentEditMode(commentId) {
  document.getElementById(`view-comment-${commentId}`).style.display = "block";
  document.getElementById(`edit-comment-mode-${commentId}`).style.display =
    "none";
}

// 📌 페이지 로드 시 게시글 불러오기
window.onload = loadPosts;
