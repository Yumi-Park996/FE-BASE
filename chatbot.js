document.addEventListener("DOMContentLoaded", async () => {
  //   form
  const userInput = document.querySelector("#user-input input");
  const sendButton = document.querySelector("#user-input button");

  // form
  const addMsg = (sender, msg) => {
    const box = document.querySelector("#chat-messages");

    //메시지 전체 컨테이너 생성 (아이콘 포함)
    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container";

    //아이콘 추가
    const icon = document.createElement("div");
    icon.className = "icon";

    if (sender === "나") {
      messageContainer.classList.add("user");
      icon.innerHTML = `<i class="fas fa-user"></i>`; // 사용자 아이콘
    } else {
      messageContainer.classList.add("bot");
      icon.innerHTML = `<i class="fas fa-robot"></i>`; // 챗봇 아이콘
    }

    // 메시지 텍스트
    const messageText = document.createElement("div");
    messageText.className = "message";
    messageText.textContent = msg;

    //  메시지일 경우 오른쪽 정렬
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
    box.scrollTop = box.scrollHeight; // 자동 스크롤 유지
  };

  document
    .querySelector(".form-wrapper form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      // 폼 데이터 가져오기
      const field1 = document.querySelector("#field1").value.trim();
      const field2 = document.querySelector("#field2").value.trim();
      const field3 = document.querySelector("#field3").value.trim();
      const field4 = document.querySelector("#field4").value.trim();
      const field5 = document.querySelector("#field5").value.trim();

      // 폼 내용을 메시지로 추가
      const formMessage = `${field1}와의 여행을 원하시는 군요? 잠시만 기다려주시면 관광지/숙박 업소/음식점을 알려드리겠습니다!`;
      addMsg("챗봇", formMessage);

      try {
        // ChatGPT API 요청 후 답변을 화면에 추가
        const reply = await replyForm(field1, field2, field3, field4, field5);
        addMsg("챗봇", reply);
      } catch (error) {
        console.error("ChatGPT API 요청 중 오류 발생:", error);
        addMsg("챗봇", "죄송합니다. 정보를 가져오는 데 문제가 발생했습니다.");
      }
      // 폼 제출 이벤트 막기
      const submitButton = document.querySelector(
        ".form-wrapper button[type='submit']"
      );
      submitButton.disabled = true;
      submitButton.classList.add("btn-secondary");
    });

  // 기존 메시지 전송 버튼 기능 유지
  sendButton.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (message.length === 0) return;
    addMsg("나", message);
    userInput.value = "";
  });

  const GEMINI_API_KEY = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  async function replyForm(a, b, c, d, e) {
    console.log("함수 넘어옴");
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${a}는 동물 이름, ${b}는 동물 크기, ${c}는 무게, ${d}는 맹수인지 아닌지, ${e}는 공공장소 동행 가능 여부야. 이 정보를 바탕으로 이 동물과 함께 여행가면 좋을 관광지나 숙소 3개를 추천해줘. 한글 평문으로 작성해줘.`,
              },
            ],
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    console.log(json);
    return json.candidates[0].content.parts[0].text;
  }

  async function makeReply(text) {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${text}의 메세지를 바탕으로 적절한 응답을 출력해줘.`,
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
