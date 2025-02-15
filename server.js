import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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

// 📌 게시글 수정 (PATCH /posts/:id)
app.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, image_url } = req.body;

  const { error } = await supabase
    .from("board")
    .update({ title, content, image_url }) // ✅ Base64 URL을 DB에 저장
    .eq("id", id);

  if (error) {
    console.error("🛑 게시글 수정 오류:", error);
    return res.status(500).json({ error: error.message });
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

// 📌 게시글 삭제 (DELETE /posts/:id)
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;

  // 게시글 삭제
  const { error } = await supabase.from("board").delete().eq("id", id);

  if (error) {
    console.error("🛑 게시글 삭제 오류:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "게시글 삭제 완료!" });
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
