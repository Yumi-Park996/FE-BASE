document.addEventListener("DOMContentLoaded", async () => {
  async function findAnimal(base64Image, mimeType) {
    const url = "https://victorious-cubic-marionberry.glitch.me/findAnimal";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, mimeType }),
      });
      const data = await response.text(); // ✅ JSON이 아니라 텍스트로 받음
      console.log("✅ findAnimal 응답:", data);
      return data;
    } catch (error) {
      console.error("🚨 Gemini API 요청 오류:", error);
      return "🔴 오류 발생: API 요청 실패";
    }
  }

  async function findAnimal2(base64Image, mimeType, firstprompt) {
    const url = "https://victorious-cubic-marionberry.glitch.me/findAnimal2";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, mimeType, firstprompt }),
      });
      const data = await response.text(); // ✅ JSON이 아니라 텍스트로 받음
      console.log("✅ findAnimal2 응답:", data);
      return data;
    } catch (error) {
      console.error("🚨 Gemini API 2 요청 오류:", error);
      return "🔴 오류 발생: API 요청 실패";
    }
  }

  async function findAnimal3(base64Image, mimeType, secondprompt) {
    const url = "https://victorious-cubic-marionberry.glitch.me/findAnimal3";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, mimeType, secondprompt }),
      });
      const data = await response.text(); // ✅ JSON이 아니라 텍스트로 받음
      console.log("✅ findAnimal3 응답:", data);
      return data;
    } catch (error) {
      console.error("🚨 Gemini API 3 요청 오류:", error);
      return "🔴 오류 발생: API 요청 실패";
    }
  }

  const form = document.querySelector("#controller");
  const formContainer = document.querySelector("#formContainer");
  const spinnerContainer = document.querySelector("#spinnerContainer");
  const resultContainer = document.querySelector("#result");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    console.log("폼 제출");

    const imgBox = document.querySelector("#showImg");
    const content = document.querySelector("#result1");
    const name = document.querySelector("#petName").value;
    content.innerHTML = "";
    imgBox.src = "";

    const input = document.querySelector("#imageInput");

    formContainer.style.display = "none";
    spinnerContainer.style.display = "block";

    if (input.files && input.files[0]) {
      const file = input.files[0];

      try {
        console.log("🟢 이미지 업로드 중...");
        const formData = new FormData();
        formData.append("image", file);

        const uploadResponse = await fetch(
          "https://victorious-cubic-marionberry.glitch.me/upload",
          { method: "POST", body: formData }
        );

        if (!uploadResponse.ok) {
          throw new Error("이미지 업로드 실패");
        }

        const { base64Image, mimeType } = await uploadResponse.json();
        console.log("✅ 서버에서 변환된 Base64 데이터 수신 완료!");

        console.log("🔄 findAnimal 실행 중...");
        const finalAnswer = await findAnimal(base64Image, mimeType);
        console.log("✅ findAnimal 응답:", finalAnswer);

        console.log("🔄 findAnimal2 실행 중...");
        const finalAnswer2 = await findAnimal2(
          base64Image,
          mimeType,
          finalAnswer
        );
        console.log("✅ findAnimal2 응답:", finalAnswer2);

        console.log("🔄 findAnimal3 실행 중...");
        const finalAnswer3 = await findAnimal3(
          base64Image,
          mimeType,
          finalAnswer2
        );
        console.log("✅ findAnimal3 응답:", finalAnswer3);

        const result3 = document.createElement("p");

        spinnerContainer.style.display = "none";
        resultContainer.style.display = "block";
        imgBox.src = URL.createObjectURL(file);

        //```html 제거
        const parsed = finalAnswer3
          .replace(/\`\`\`html/g, "")
          .replace(/\`\`\`/g, "");
        result3.innerHTML = `📌 ${name} 분석 결과 : ${parsed}`;

        content.appendChild(result3);
      } catch (error) {
        console.error("🚨 오류 발생:", error);
        content.innerText =
          "이미지를 분석할 수 없습니다. 다른 이미지를 골라주세요";
        spinnerContainer.style.display = "none";
        formContainer.style.display = "block";
      }
    } else {
      alert("🚨 이미지 파일을 선택해주세요.");
      content.innerText =
        "이미지를 분석할 수 없습니다. 다른 이미지를 골라주세요";
      spinnerContainer.style.display = "none";
      formContainer.style.display = "block";
    }
  });
});
