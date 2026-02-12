//Name: Gustavo Miranda
//StudentID: 101488574

$(function () {
  const SESSION_KEY = "mirandasChatSession";
  const rawSession = localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    window.location.href = "/view/login.html";
    return;
  }

  let sessionUser = null;
  try {
    sessionUser = JSON.parse(rawSession);
  } catch (_error) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "/view/login.html";
    return;
  }

  if (!sessionUser || !sessionUser.username) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "/view/login.html";
    return;
  }

  const currentUser = {
    username: String(sessionUser.username).trim().toLowerCase(),
    firstname: sessionUser.firstname || "",
    lastname: sessionUser.lastname || ""
  };

  let currentRoom = "";
  let privateRecipient = "";
  let privateTypingTimeout = null;

  const socket = io();

  const $status = $("#chatStatus");
  const $groupMessages = $("#groupMessages");
  const $privateMessages = $("#privateMessages");
  const $privateTyping = $("#privateTyping");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message, type = "") {
    $status.removeClass("error success").text(message || "");
    if (type) {
      $status.addClass(type);
    }
  }

  function createMessageItem({ sender, message, dateSent, isSystem }) {
    const senderLabel = isSystem ? "System" : escapeHtml(sender || "unknown");
    const textLabel = escapeHtml(message || "");
    const dateLabel = escapeHtml(dateSent || "");

    return `
      <li class="message-item${isSystem ? " system" : ""}">
        <div><strong>${senderLabel}</strong></div>
        <div>${textLabel}</div>
        <div class="message-meta">${dateLabel}</div>
      </li>
    `;
  }

  function appendGroupMessage(payload, isSystem = false) {
    $groupMessages.append(
      createMessageItem({
        sender: isSystem ? "System" : payload.from_user,
        message: payload.message,
        dateSent: payload.date_sent,
        isSystem
      })
    );
    $groupMessages.scrollTop($groupMessages.prop("scrollHeight"));
  }

  function appendPrivateMessage(payload) {
    $privateMessages.append(
      createMessageItem({
        sender: payload.from_user,
        message: payload.message,
        dateSent: payload.date_sent,
        isSystem: false
      })
    );
    $privateMessages.scrollTop($privateMessages.prop("scrollHeight"));
  }

  async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }
    return data;
  }

  async function loadRooms() {
    try {
      const data = await fetchJSON("/api/chat/rooms");
      const options = data.rooms
        .map((room) => `<option value="${escapeHtml(room)}">${escapeHtml(room)}</option>`)
        .join("");

      $("#roomSelect").html(options);
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function loadUsers() {
    try {
      const data = await fetchJSON(`/api/chat/users?exclude=${encodeURIComponent(currentUser.username)}`);
      if (!data.users.length) {
        $("#privateRecipient").html('<option value="">No users available</option>');
        privateRecipient = "";
        $privateMessages.empty();
        return;
      }

      const options = ['<option value="">Select user</option>']
        .concat(
          data.users.map((user) => `<option value="${escapeHtml(user.username)}">${escapeHtml(user.username)}</option>`)
        )
        .join("");

      $("#privateRecipient").html(options);
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function loadRoomMessages(room) {
    try {
      const data = await fetchJSON(`/api/chat/messages/room/${encodeURIComponent(room)}`);
      $groupMessages.empty();
      data.messages.forEach((msg) => appendGroupMessage(msg));
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function loadPrivateMessages(otherUser) {
    if (!otherUser) {
      $privateMessages.empty();
      return;
    }

    try {
      const data = await fetchJSON(
        `/api/chat/messages/private?user1=${encodeURIComponent(currentUser.username)}&user2=${encodeURIComponent(otherUser)}`
      );

      $privateMessages.empty();
      data.messages.forEach((msg) => appendPrivateMessage(msg));
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function doLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_error) {
    }

    localStorage.removeItem(SESSION_KEY);
    window.location.href = "/view/login.html";
  }

  $("#welcomeLine").text(`Logged in as ${currentUser.username}`);

  socket.on("connect", () => {
    socket.emit("register-user", { username: currentUser.username });
  });

  socket.on("group-message", (payload) => {
    if (payload.room !== currentRoom) return;
    appendGroupMessage(payload);
  });

  socket.on("room-notice", (payload) => {
    if (payload.room !== currentRoom) return;
    appendGroupMessage(
      {
        from_user: "system",
        message: payload.message,
        date_sent: payload.date_sent
      },
      true
    );
  });

  socket.on("private-message", (payload) => {
    const involvesCurrentUser = payload.from_user === currentUser.username || payload.to_user === currentUser.username;
    if (!involvesCurrentUser) return;

    const isCurrentConversation =
      (payload.from_user === currentUser.username && payload.to_user === privateRecipient) ||
      (payload.from_user === privateRecipient && payload.to_user === currentUser.username);

    if (isCurrentConversation) {
      appendPrivateMessage(payload);
      return;
    }

    if (payload.to_user === currentUser.username) {
      setStatus(`New private message from ${payload.from_user}.`, "success");
    }
  });

  socket.on("typing-private", (payload) => {
    if (payload.to_user !== currentUser.username) return;
    if (payload.from_user !== privateRecipient) return;

    if (payload.isTyping) {
      $privateTyping.text(`${payload.from_user} is typing...`);
    } else {
      $privateTyping.text("");
    }
  });

  socket.on("socket-error", (payload) => {
    setStatus(payload.message || "Socket error.", "error");
  });

  socket.on("online-update", () => {
    loadUsers();
  });

  $("#joinRoomBtn").on("click", async function () {
    const selectedRoom = $("#roomSelect").val();
    if (!selectedRoom) {
      setStatus("Please select a room.", "error");
      return;
    }

    currentRoom = selectedRoom;
    $("#currentRoom").text(currentRoom);

    socket.emit("join-room", {
      room: currentRoom,
      username: currentUser.username
    });

    await loadRoomMessages(currentRoom);
    setStatus(`Joined room: ${currentRoom}`, "success");
  });

  $("#leaveRoomBtn").on("click", function () {
    if (!currentRoom) {
      setStatus("You are not in a room.", "error");
      return;
    }

    socket.emit("leave-room", {
      room: currentRoom,
      username: currentUser.username
    });

    currentRoom = "";
    $("#currentRoom").text("None");
    $groupMessages.empty();
    setStatus("You left the room.", "success");
  });

  $("#sendGroupBtn").on("click", function () {
    if (!currentRoom) {
      setStatus("Join a room before sending group messages.", "error");
      return;
    }

    const message = $("#groupMessageInput").val().trim();
    if (!message) return;

    socket.emit("group-message", {
      room: currentRoom,
      from_user: currentUser.username,
      message
    });

    $("#groupMessageInput").val("");
  });

  $("#groupMessageInput").on("keypress", function (event) {
    if (event.which === 13) {
      event.preventDefault();
      $("#sendGroupBtn").trigger("click");
    }
  });

  $("#privateRecipient").on("change", async function () {
    privateRecipient = $(this).val();
    $privateTyping.text("");
    await loadPrivateMessages(privateRecipient);
  });

  $("#sendPrivateBtn").on("click", function () {
    if (!privateRecipient) {
      setStatus("Select a user for private chat.", "error");
      return;
    }

    const message = $("#privateMessageInput").val().trim();
    if (!message) return;

    socket.emit("private-message", {
      from_user: currentUser.username,
      to_user: privateRecipient,
      message
    });

    socket.emit("typing-private", {
      from_user: currentUser.username,
      to_user: privateRecipient,
      isTyping: false
    });

    $("#privateMessageInput").val("");
    $privateTyping.text("");
  });

  $("#privateMessageInput").on("keypress", function (event) {
    if (event.which === 13) {
      event.preventDefault();
      $("#sendPrivateBtn").trigger("click");
    }
  });

  $("#privateMessageInput").on("input", function () {
    if (!privateRecipient) return;

    socket.emit("typing-private", {
      from_user: currentUser.username,
      to_user: privateRecipient,
      isTyping: true
    });

    clearTimeout(privateTypingTimeout);
    privateTypingTimeout = setTimeout(() => {
      socket.emit("typing-private", {
        from_user: currentUser.username,
        to_user: privateRecipient,
        isTyping: false
      });
    }, 800);
  });

  $("#logoutBtn").on("click", async function () {
    await doLogout();
  });

  window.addEventListener("beforeunload", () => {
    if (currentRoom) {
      socket.emit("leave-room", { room: currentRoom, username: currentUser.username });
    }
  });

  loadRooms();
  loadUsers();
});