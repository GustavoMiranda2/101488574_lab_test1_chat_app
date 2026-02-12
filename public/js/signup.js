//Name: Gustavo Miranda
//StudentID: 101488574

$(function () {
  const $status = $("#signupStatus");

  function setStatus(message, type = "") {
    $status.removeClass("error success").text(message);
    if (type) {
      $status.addClass(type);
    }
  }

  $("#signupForm").on("submit", async function (event) {
    event.preventDefault();

    const payload = {
      username: $("#username").val().trim(),
      firstname: $("#firstname").val().trim(),
      lastname: $("#lastname").val().trim(),
      password: $("#password").val()
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.message || "Signup failed.", "error");
        return;
      }

      setStatus("Signup successful. Redirecting to login...", "success");
      setTimeout(() => {
        window.location.href = "/view/login.html";
      }, 1000);
    } catch (_error) {
      setStatus("Unable to reach the server.", "error");
    }
  });
});