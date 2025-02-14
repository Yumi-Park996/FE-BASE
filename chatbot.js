document.addEventListener("DOMContentLoaded", async () => {
  // form
  const addMsg = (sender, msg) => {
    const box = document.querySelector("#chat-messages");
    const p = document.createElement("div");
    p.className = "message";
    p.textContent = `${sender}:${msg}`;
    box.appendChild(p);
  };

  const userInput = document.querySelector("#user-input input");
  const sendButton = document.querySelector("#user-input button");

  async function makeReply(text) {
    const GEMINI_API_KEY = "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${text}의 메세지를 바탕으로 적절한 응답을 를 출력해줘.`,
              },
            ],
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    return json.candidates[0].content.parts[0].text;
  }

  sendButton.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (message.length === 0) return;
    addMsg("나", message);
    userInput.value = "";
    //ChatGPT API 요청후 답변을 화면에 추가
    const reply = await makeReply(message);
    addMsg("챗봇", reply);
  });
  // 사용자 입력 필드에서 Enter 키 이벤트를 처리
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendButton.click();
    }
  });
});
