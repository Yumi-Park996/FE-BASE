import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ✅ Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 📌 모든 게시글 가져오기 (GET /posts)
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("board")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 📌 새 게시글 추가 (POST /posts)
router.post("/", async (req, res) => {
  const { title, content, image_url, user_id } = req.body;

  if (!title || !content)
    return res.status(400).json({ error: "제목과 내용을 입력하세요." });

  if (!user_id) return res.status(401).json({ error: "로그인이 필요합니다." });

  const { data, error } = await supabase
    .from("board")
    .insert([{ title, content, image_url, user_id }]);

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// 📌 게시글 수정 (PUT /posts/:id)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, image_url } = req.body;

  const { error } = await supabase
    .from("board")
    .update({ title, content, image_url })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "게시글 수정 완료!" });
});

// 📌 게시글 삭제 (DELETE /posts/:id)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("board").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "게시글 삭제 완료!" });
});

export default router;
