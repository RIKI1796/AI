const input = document.getElementById("input");
const enter = document.getElementById("enter");
const inputmenu = document.getElementById("inputmenu");
const history = document.getElementById("history");
const close = document.getElementById("close");
const historymenu = document.getElementById("historymenu");
const chatBox = document.getElementById("chatBox");

const serverUrl = "https://1c2d7caf9621.ngrok-free.app";

let isWaiting = false;
let controller = null;

function addBubble(text, sender) {
  const div = document.createElement("div");
  div.className = sender === "me" ? "bubble me" : "bubble other";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "bubble other typing";
  typingDiv.innerHTML = `<span></span><span></span><span></span>`;
  typingDiv.id = "typing";
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
  const typingDiv = document.getElementById("typing");
  if (typingDiv) typingDiv.remove();
}

function lockInput() {
  isWaiting = true;
  enter.classList.remove("bi-arrow-up");
  enter.classList.add("bi-stop-fill");
  input.disabled = true;
}

function unlockInput() {
  isWaiting = false;
  enter.classList.remove("bi-stop-fill");
  enter.classList.add("bi-arrow-up");
  input.disabled = false;
  input.focus();
}

input.addEventListener("input", () => {
  if (input.value !== "" && !isWaiting) {
    enter.classList.remove("hilang");
  } else {
    enter.classList.add("hilang");
  }
});

async function sendMessage(message) {
  if (!message || isWaiting) return;

  addBubble(message, "me");
  showTyping();
  lockInput();

  controller = new AbortController();
  const signal = controller.signal;

  try {
    const res = await fetch(`${serverUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
      signal,
    });
    const data = await res.json();
    hideTyping();

    if (data.reply) {
      addBubble(data.reply, "other");
      if (data.audio_id) {
        const audio = new Audio(`${serverUrl}/audio/${data.audio_id}`);
        audio.play();
      }
    } else {
      addBubble("⚠️ Server tidak kirim reply", "other");
    }
  } catch (err) {
    hideTyping();
    if (err.name === "AbortError") {
      addBubble("⛔ Pesan dibatalkan", "other");
    } else {
      console.error("Fetch error:", err);
      addBubble("⚠️ Gagal koneksi ke server Python", "other");
    }
  }

  unlockInput();
}

enter.addEventListener("click", (e) => {
  e.preventDefault();
  if (isWaiting && controller) {
    controller.abort();
    unlockInput();
    hideTyping();
    return;
  }
  const msg = input.value.trim();
  if (msg && !isWaiting) {
    sendMessage(msg);
    input.value = "";
    enter.classList.add("hilang");
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !isWaiting) {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg) sendMessage(msg);
    input.value = "";
    enter.classList.add("hilang");
  }
});

