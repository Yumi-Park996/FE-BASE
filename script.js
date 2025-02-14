document.addEventListener("DOMContentLoaded", function () {
  fetch("./templates/navbar.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;
    });

  fetch("./templates/footer.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    });

  function validatePassword() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const message = document.getElementById("password-message");

    if (password !== confirmPassword) {
      message.style.color = "red";
      message.textContent = "비밀번호가 일치하지 않습니다.";
    } else {
      message.style.color = "green";
      message.textContent = "비밀번호가 일치합니다.";
    }
  }
});
