//Name: Gustavo Miranda
//StudentID: 101488574

$(function () {
  const SESSION_KEY = "mirandasChatSession";
  const $status = $("#loginStatus");

  function setStatus(message, type = "") {
    $status.removeClass("error success").text(message);
    if (type) {
      $status.addClass(type);
    }
  }

  $("#loginForm").on("submit", async function (event) {
    event.preventDefault();

    const payload = {
      username: $("#username").val().trim(),
      password: $("#password").val()
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.message || "Login failed.", "error");
        return;
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      setStatus("Login successful. Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "/view/chat.html";
      }, 500);
    } catch (_error) {
      setStatus("Unable to reach the server.", "error");
    }
  });
});