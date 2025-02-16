import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

console.log("auth 실행");

dotenv.config();
const router = express.Router();

// ✅ Supabase 클라이언트 생성
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 📌 🔹 기존 server.js에서 auth 관련 기능을 이동
// 📌 로그인 요청 (소셜 로그인)
router.get("/:provider", async (req, res) => {
  const provider = req.params.provider;
  const validProviders = ["github", "google"];

  if (!validProviders.includes(provider)) {
    return res
      .status(400)
      .json({ error: "유효하지 않은 로그인 제공자입니다." });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: "http://127.0.0.1:5500/animal-trip/index.html", //####
    },
  });

  if (error) {
    console.error(`🛑 ${provider} 로그인 오류:`, error.message);
    return res.status(500).json({ error: error.message });
  }

  res.redirect(data.url);
});

// 📌 로그아웃 요청
router.get("/logout", async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(500).json({ error: "로그아웃 실패" });
  }

  res.json({ message: "로그아웃 성공" });
});

export default router;
