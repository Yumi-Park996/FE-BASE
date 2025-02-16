import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./auth.js"; // ✅ auth.js 라우트 연결
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// ✅ Supabase 클라이언트 생성 (환경 변수 사용)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS 설정
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ 현재 파일의 디렉토리 가져오기 (ESM 사용 시)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 서버 루트(`/`)에서 정적 파일 제공 설정 (public 폴더 없이 해결)
app.use(express.static(path.join(__dirname, "animal-trip")));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ 라우트 등록
app.use("/auth", authRoutes);

// 📌 모든 게시글 가져오기
app.get("/posts", async (req, res) => {
  const { data, error } = await supabase
    .from("board") // board: 수퍼베이스 상에서의 게시물을 쌓는 데이터 테이블
    .select("*")
    .order("created_at", { ascending: false }); // 게시물에서 데이터가 쌓이는 timestamp

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 📌 새 게시글 추가
app.post("/posts", async (req, res) => {
  const { title, content, image_url, user_id } = req.body; // board에 있는 컬럼명

  if (!title || !content)
    return res.status(400).json({ error: "제목과 내용을 입력하세요." });

  if (!user_id) return res.status(401).json({ error: "로그인이 필요합니다." });

  // ✅ Supabase 요청 시
  const { data, error } = await supabase
    .from("board")
    .insert([{ title, content, image_url, user_id }]); // 게시글이 board에 추가됨

  if (error) {
    console.error("🛑 Supabase INSERT 오류:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// 📌 특정 게시글 가져오기 (게시글 상세 조회)
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("board") // ✅ "board" 테이블에서 특정 ID의 게시글 조회
      .select("*")
      .eq("id", id) // ✅ ID가 일치하는 데이터 가져오기
      .single(); // ✅ 단일 객체 반환

    if (error) {
      console.error("🛑 Supabase SELECT 오류:", error);
      return res.status(500).json({ error: "서버 오류 발생" });
    }

    if (!data) {
      console.log("🛑 게시글 없음");
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    res.json(data);
  } catch (error) {
    console.error("🛑 서버 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//####
// 📌 게시글 수정 (PATCH /posts/:id)
app.patch("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, image_url } = req.body;

  // ✅ 1. 기존 게시글 정보 가져오기 (이전 이미지 URL 포함)
  const { data: existingPost, error: fetchError } = await supabase
    .from("board")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("🛑 기존 게시글 조회 오류:", fetchError);
    return res.status(500).json({ error: "게시글을 찾을 수 없습니다." });
  }

  // ✅ 2. 기존 이미지 삭제 (새로운 이미지가 업로드된 경우만)
  if (
    image_url &&
    existingPost.image_url &&
    image_url !== existingPost.image_url
  ) {
    const filePath = existingPost.image_url.split("/images/")[1]; // Storage 파일명 추출
    const { error: deleteImageError } = await supabase.storage
      .from("images")
      .remove([filePath]);

    if (deleteImageError) {
      console.error("🛑 기존 이미지 삭제 오류:", deleteImageError);
      return res.status(500).json({ error: "기존 이미지 삭제 실패" });
    }
  }

  // ✅ 3. 게시글 업데이트
  const { error: updateError } = await supabase
    .from("board")
    .update({ title, content, image_url }) // 새로운 이미지 URL 저장
    .eq("id", id);

  if (updateError) {
    console.error("🛑 게시글 수정 오류:", updateError);
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ message: "게시글 수정 완료!" });
});

// 📌 이미지 삭제
app.delete("/posts/:id/image", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("board")
    .update({ image_url: null }) // 이미지 URL을 NULL로 설정하여 삭제
    .eq("id", id);

  if (error) {
    console.error("🛑 이미지 삭제 오류:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "이미지 삭제 완료!" });
});

//####
// 📌 게시글 삭제 (DELETE /posts/:id)
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;

  // ✅ 1. 기존 게시글 정보 가져오기 (이미지 URL 포함)
  const { data: post, error: fetchError } = await supabase
    .from("board")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("🛑 게시글 조회 오류:", fetchError);
    return res.status(500).json({ error: "게시글을 찾을 수 없습니다." });
  }

  // ✅ 2. 게시글 삭제
  const { error: deletePostError } = await supabase
    .from("board")
    .delete()
    .eq("id", id);

  if (deletePostError) {
    console.error("🛑 게시글 삭제 오류:", deletePostError);
    return res.status(500).json({ error: deletePostError.message });
  }

  // ✅ 3. 게시글에 이미지가 있었으면 Storage에서도 삭제
  if (post.image_url) {
    const filePath = post.image_url.split("/images/")[1]; // Storage 파일명 추출
    const { error: deleteImageError } = await supabase.storage
      .from("images")
      .remove([filePath]);

    if (deleteImageError) {
      console.error("🛑 Storage 이미지 삭제 오류:", deleteImageError);
      return res.status(500).json({
        error: "게시글 삭제는 완료되었지만, 이미지 삭제에 실패했습니다.",
      });
    }
  }

  res.json({ message: "게시글 및 이미지 삭제 완료!" });
});

// 📌 게시글별 댓글 불러오기 (GET /comments?board_id=게시글ID)
app.get("/comments", async (req, res) => {
  const { board_id } = req.query;
  if (!board_id)
    return res.status(400).json({ error: "board_id가 필요합니다." });

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("board_id", board_id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 📌 댓글 추가하기 (POST /comments)
app.post("/comments", async (req, res) => {
  const { board_id, content } = req.body;
  if (!board_id || !content)
    return res.status(400).json({ error: "board_id와 content가 필요합니다." });

  const { data, error } = await supabase
    .from("comments")
    .insert([{ board_id, content }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 📌 댓글 수정 (PATCH /comments/:id)
app.patch("/comments/:id", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "댓글 내용을 입력하세요." });
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ content }) // `updated_at`은 Supabase 트리거에서 자동 변경됨
    .eq("id", id)
    .select("id, content, created_at, updated_at");

  if (error) {
    console.error("🛑 댓글 수정 오류:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// 📌 댓글 삭제하기 (DELETE /comments/:id)
app.delete("/comments/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "댓글 삭제 완료!" });
});

// ✅ 서버 실행
app.listen(PORT, () =>
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`)
);
