document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  const goBackBtn = document.getElementById("goBackBtn");
  const addCommentButton = document.getElementById("addCommentButton");

  if (!postId) {
    alert("게시글을 찾을 수 없습니다.");
    window.location.href = "community.html";
    return;
  }

  goBackBtn.addEventListener("click", function () {
    const basePath = window.location.pathname.split("/").slice(0, -1).join("/");
    window.location.href = `${basePath}/community.html`;
  });

  addCommentButton.addEventListener("click", () => addComment(postId));

  await loadPostDetail(postId);
  await loadComments(postId);
});

/* 📌 특정 게시글 상세 정보 불러오기 */
async function loadPostDetail(postId) {
  const spinner = document.querySelector("#spinnerContainer");
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`);
    const post = await response.json();

    if (!post) {
      alert("게시글을 찾을 수 없습니다.");
      window.location.href = "community.html";
      return;
    }

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
      ? `<div class="text-muted">수정됨: ${updatedDate}</div>`
      : `<div class="text-muted">작성일: ${createdDate}</div>`;

    let imageTag = post.image_url
      ? `<img src="${post.image_url}" class="img-fluid rounded mb-3 postDetailImg" alt="게시물 이미지">`
      : "";
    spinner.style.display = "none";
    document.getElementById("postDetail").innerHTML = `
      <div class="card shadow-lg p-4">
        <h2>${post.title}</h2>
          ${imageTag}
          <h4>${post.content}</h4>
          <p class="dataText">${dateText}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error:", error);
    alert("게시글을 불러오는 중 오류가 발생했습니다.");
    window.location.href = "community.html";
  }
}

/* 📌 특정 게시글의 댓글 불러오기 */
async function loadComments(postId) {
  const response = await fetch(`${API_URL}/comments?board_id=${postId}`);
  const comments = await response.json();
  const currentUserId = await getCurrentUserId();

  const commentsDiv = document.getElementById("commentsList");
  commentsDiv.innerHTML = "";

  comments.forEach((comment) => {
    const createdDate = new Date(comment.created_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });

    let editDeleteButtons = "";
    if (currentUserId && currentUserId === comment.user_id) {
      editDeleteButtons = `
        <button class="btn btn-sm btn-outline-primary" onclick="enableCommentEdit('${comment.id}')">수정</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${comment.id}')">삭제</button>
      `;
    }

    const commentElement = document.createElement("div");
    commentElement.classList.add("comment-box");
    commentElement.innerHTML = `
      <div class="card-body">
        <p class="card-text">${comment.content}</p>
        <small class="text-muted">작성일: ${createdDate}</small>
        <div class="comment-actions d-flex justify-content-end">${editDeleteButtons}</div>
      </div>
    `;
    commentsDiv.appendChild(commentElement);
  });
}

/* 📌 댓글 입력창 클릭 시 로그인 유도 */
document
  .getElementById("commentInput")
  .addEventListener("focus", async function () {
    const userId = await getCurrentUserId();
    if (!userId) {
      alert("댓글을 작성하려면 로그인이 필요합니다.");
      this.blur(); // 입력창 비활성화
    }
  });

/* 📌 댓글 추가 */
async function addComment(postId) {
  const userId = await getCurrentUserId();
  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  const commentInput = document.getElementById("commentInput");
  const content = commentInput.value.trim();
  if (!content) return;

  const response = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board_id: postId, content, user_id: userId }),
  });

  if (response.ok) {
    commentInput.value = "";
    console.log("댓글 저장완료");
    loadComments(postId);
  } else {
    alert("댓글 작성 실패!");
  }
}

/* 📌 댓글 수정 모드 활성화 */
function enableCommentEdit(commentId) {
  const commentDiv = document.getElementById(`comment-${commentId}`);
  const commentContent = commentDiv.querySelector("p").innerText;

  commentDiv.innerHTML = `
    <textarea id="edit-comment-${commentId}" class="form-control">${commentContent}</textarea>
    <button class="btn btn-sm btn-success" onclick="updateComment('${commentId}')">저장</button>
    <button class="btn btn-sm btn-secondary" onclick="loadComments(postId)">취소</button>
  `;
}

/* 📌 댓글 수정 */
async function updateComment(commentId) {
  const userId = await getCurrentUserId();
  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  const editContent = document
    .getElementById(`edit-comment-${commentId}`)
    .value.trim();
  if (!editContent) return alert("댓글 내용을 입력하세요.");

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: editContent }),
  });

  if (response.ok) {
    loadComments(postId);
  } else {
    alert("댓글 수정 실패!");
  }
}

/* 📌 댓글 삭제 */
async function deleteComment(commentId) {
  const userId = await getCurrentUserId();
  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  const confirmDelete = confirm("댓글을 삭제하시겠습니까?");
  if (!confirmDelete) return;

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "DELETE",
  });

  if (response.ok) {
    alert("댓글이 삭제되었습니다.");
    loadComments(postId);
  } else {
    alert("댓글 삭제 실패!");
  }
}

/* 📌 현재 로그인한 사용자의 ID 가져오기 */
async function getCurrentUserId() {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData?.session) {
    return null;
  }
  return sessionData.session.user.id;
}
