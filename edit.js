document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  const editTitle = document.getElementById("editTitle");
  const editContent = document.getElementById("editContent");
  const newImageInput = document.getElementById("newImage");
  const currentImage = document.getElementById("currentImage");
  const deleteImageBtn = document.getElementById("deleteImageBtn");
  const editPostForm = document.getElementById("editPostForm");

  let imageUrl = null;

  if (!postId) {
    alert("게시글 ID가 없습니다!");
    window.location.href = "community.html";
    return;
  }

  // ✅ 기존 게시글 데이터 가져오기
  const response = await fetch(`${API_URL}/posts/${postId}`);
  const post = await response.json();

  if (!post) {
    alert("게시글을 찾을 수 없습니다!");
    window.location.href = "community.html";
    return;
  }

  // ✅ 제목 및 내용 채우기
  editTitle.value = post.title;
  editContent.value = post.content;

  // ✅ 기존 이미지 표시 (있으면)
  if (post.image_url) {
    currentImage.src = post.image_url;
    currentImage.style.display = "block";
    deleteImageBtn.style.display = "block";
    imageUrl = post.image_url;
  }

  // ✅ 현재 로그인한 사용자 확인
  const currentUserId = await getCurrentUserId();
  if (!currentUserId || currentUserId !== post.user_id) {
    alert("게시글을 수정할 권한이 없습니다!");
    window.location.href = `post-detail.html?id=${postId}`;
    return;
  }

  // ✅ 이미지 삭제 버튼 클릭 시 기존 이미지 삭제
  deleteImageBtn.addEventListener("click", async () => {
    const confirmDelete = confirm("이미지를 삭제하시겠습니까?");
    if (!confirmDelete) return;

    // Supabase Storage에서 이미지 삭제
    const filePath = imageUrl.split("/images/")[1];
    const { error } = await supabase.storage.from("images").remove([filePath]);

    if (error) {
      console.error("🛑 이미지 삭제 오류:", error);
      alert("이미지 삭제 실패!");
      return;
    }

    imageUrl = null; // 이미지 URL 초기화
    currentImage.style.display = "none";
    deleteImageBtn.style.display = "none";
    alert("이미지가 삭제되었습니다!");
  });

  // ✅ 게시글 수정 요청
  editPostForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const updatedTitle = editTitle.value.trim();
    const updatedContent = editContent.value.trim();
    const newImageFile = newImageInput.files[0];

    if (!updatedTitle || !updatedContent) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    // ✅ 로그인 토큰 가져오기
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData?.session) {
      alert("로그인이 필요합니다!");
      return;
    }
    const access_token = sessionData.session.access_token;

    // ✅ 새 이미지가 있으면 Supabase에 업로드
    if (newImageFile) {
      try {
        imageUrl = await uploadImageToSupabase(newImageFile);
      } catch (error) {
        alert("새 이미지 업로드 실패!");
        return;
      }
    }

    // ✅ 게시글 수정 요청
    const updateResponse = await fetch(`${API_URL}/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        title: updatedTitle,
        content: updatedContent,
        image_url: imageUrl,
      }),
    });

    if (updateResponse.ok) {
      alert("게시글이 수정되었습니다!");
      window.location.href = `post-detail.html?id=${postId}`; // 수정 후 상세 페이지로 이동
    } else {
      alert("게시글 수정 실패!");
    }
  });
});

// 📌 이미지 업로드 함수 (Supabase Storage에 저장)
async function uploadImageToSupabase(file) {
  const imageName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  console.log("📌 업로드할 파일명:", imageName);

  try {
    const { data, error } = await supabase.storage
      .from("images")
      .upload(imageName, file, { cacheControl: "3600", upsert: true });

    if (error) {
      console.error("🛑 이미지 업로드 실패:", error);
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    return `https://kjlypjubepptwtfjxxpy.supabase.co/storage/v1/object/public/images/${imageName}`;
  } catch (error) {
    console.error("🛑 이미지 업로드 중 오류 발생:", error.message);
    throw error;
  }
}

// 📌 수정 취소 버튼
function cancelEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  window.location.href = `post-detail.html?id=${postId}`;
}
