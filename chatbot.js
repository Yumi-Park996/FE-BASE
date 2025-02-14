document.addEventListener("DOMContentLoaded", async () => {
  //   form
  const userInput = document.querySelector("#user-input input");
  const sendButton = document.querySelector("#user-input button");
  // form
  const addMsg = (sender, msg) => {
    const box = document.querySelector("#chat-messages");

    // ✅ 메시지 전체 컨테이너 생성 (아이콘 포함)
    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    // ✅ 아이콘 추가
    const icon = document.createElement("div");
    icon.className = "icon";

    if (sender === "나") {
      messageContainer.classList.add("user");
      icon.innerHTML = `<i class="fas fa-user"></i>`; // ✅ 사용자 아이콘
    } else {
      messageContainer.classList.add("bot");
      icon.innerHTML = `<i class="fas fa-robot"></i>`; // ✅ 챗봇 아이콘
    }

    // ✅ 메시지 텍스트
    const messageText = document.createElement("div");
    messageText.className = "message";
    messageText.textContent = msg;

    // ✅ 사용자 메시지일 경우 오른쪽 정렬
    if (sender === "나") {
      messageText.classList.add("user"); // 사용자 메시지 스타일 추가
      messageContainer.appendChild(icon); // 아이콘을 오른쪽에 배치
      messageContainer.appendChild(messageText); // 메시지 추가
    } else {
      messageText.classList.add("bot"); // 챗봇 메시지 스타일 추가
      messageContainer.appendChild(icon); // 아이콘을 왼쪽에 배치
      messageContainer.appendChild(messageText); // 메시지 추가
    }

    box.appendChild(messageContainer);
    box.scrollTop = box.scrollHeight; // ✅ 자동 스크롤 유지
  };
  // 폼 제출 이벤트 막기
  document
    .querySelector(".form-wrapper form")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      // 폼 데이터 가져오기
      const field1 = document.getElementById("field1").value.trim();
      const field2 = document.getElementById("field2").value.trim();
      const field3 = document.getElementById("field3").value.trim();
      const field4 = document.getElementById("field4").value.trim();
      const field5 = document.getElementById("field5").value.trim();

      // 폼 내용을 메시지로 추가
      const formMessage = `📌 입력된 정보:\n1️⃣ ${field1}\n2️⃣ ${field2}\n3️⃣ ${field3}\n4️⃣ ${field4}\n5️⃣ ${field5}`;
      addMsg("폼 입력", formMessage);

      const submitButton = document.querySelector(
        ".form-wrapper button[type='submit']"
      );
      submitButton.disabled = true;
      submitButton.classList.add("btn-secondary");

      // 폼 필드 초기화
      document.querySelector(".form-wrapper form").reset();
    });

  // 기존 메시지 전송 버튼 기능 유지
  sendButton.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (message.length === 0) return;
    addMsg("나", message);
    userInput.value = "";

    // ChatGPT API 요청 후 답변을 화면에 추가
    const reply = await makeReply(message);
    addMsg("챗봇", reply);
  });

  async function makeReply(text) {
    const GEMINI_API_KEY = "AIzaSyChVDKhDWbGbDXLbp8PqdB5LKg5khQdtN4";
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
