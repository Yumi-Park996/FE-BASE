document.addEventListener("DOMContentLoaded", () => {
  const postContainer = document.getElementById("postContainer");
  const postForm = document.getElementById("postForm");

  // 🚀 예제 게시글 데이터 (추후 Supabase에서 불러오기)
  let posts = [
    {
      title: "반려견과 제주 여행",
      image: "https://source.unsplash.com/300x200/?dog",
    },
    {
      title: "고양이와 함께한 하루",
      image: "https://source.unsplash.com/300x200/?cat",
    },
  ];

  // 🟢 게시글 렌더링 함수
  function renderPosts() {
    postContainer.innerHTML = "";
    posts.forEach((post, index) => {
      const postCard = `
                <div class="col-md-4">
                    <div class="card">
                        <img src="${post.image}" class="card-img-top" alt="게시글 이미지">
                        <div class="card-body">
                            <h5 class="card-title">${post.title}</h5>
                        </div>
                    </div>
                </div>
            `;
      postContainer.innerHTML += postCard;
    });
  }

  // 🟢 게시글 추가 이벤트
  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("postTitle").value;
    const image = document.getElementById("postImage").value;

    if (title && image) {
      posts.push({ title, image });
      renderPosts();
      postForm.reset();
      bootstrap.Modal.getInstance(
        document.getElementById("addPostModal")
      ).hide();
    }
  });

  // 🚀 초기 게시글 로딩
  renderPosts();
});
