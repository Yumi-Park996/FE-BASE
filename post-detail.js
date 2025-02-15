document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  if (!postId) {
    alert("게시글을 찾을 수 없습니다.");
    window.location.href = "community.html";
    return;
  }

  await loadPostDetail(postId);
});

async function loadPostDetail(postId) {
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
      ? `<div class="text-muted">✏ 수정됨: ${updatedDate}</div>`
      : `<div class="text-muted">📅 작성일: ${createdDate}</div>`;

    let imageTag = post.image_url
      ? `<img src="${post.image_url}" class="img-fluid rounded mb-3" alt="게시물 이미지">`
      : "";

    document.getElementById("postDetail").innerHTML = `
      <div class="card shadow-lg p-4">
          ${imageTag}
          <h2>${post.title}</h2>
          <p>${post.content}</p>
          ${dateText}
      </div>
    `;
  } catch (error) {
    console.error("Error:", error);
    alert("게시글을 불러오는 중 오류가 발생했습니다.");
    window.location.href = "community.html";
  }
}
