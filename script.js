const input = document.getElementById("input");
const enter = document.getElementById("enter");
const inputmenu = document.getElementById("inputmenu");
const menuToggle = document.getElementById("menu");
const history = document.getElementById("history");
const close = document.getElementById("close");
const historymenu = document.getElementById("historymenu");
const chatBox = document.getElementById("chatBox");

const serverUrl = "https://1c2d7caf9621.ngrok-free.app";

menuToggle.onclick = () => {
  history.style.transform = "translateX(0)";
  historymenu.style.transform = "translateX(0)";
  close.style.opacity = "1";
};

close.onclick = () => {
  history.style.transform = "translateX(-500px)";
  historymenu.style.transform = "translateX(-500px)";
  close.style.opacity = "0";
};

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

input.addEventListener("input", () => {
  if (input.value !== "") {
    enter.classList.remove("hilang");
  } else {
    enter.classList.add("hilang");
  }
});

async function sendMessage(message) {
  if (!message) return;
  addBubble(message, "me");
  showTyping();
  if (window.cordova && cordova.plugin && cordova.plugin.http) {
    cordova.plugin.http.setDataSerializer("json");
    cordova.plugin.http.post(
      `${serverUrl}/chat`,
      { text: message },
      { "Content-Type": "application/json" },
      (response) => {
        hideTyping();
        try {
          const data = JSON.parse(response.data);
          if (data.reply) {
            addBubble(data.reply, "other");
          } else {
            addBubble("⚠️ Server tidak kirim reply", "other");
          }
        } catch (err) {
          console.error("JSON parse error:", err);
          addBubble("⚠️ Response bukan JSON valid", "other");
        }
      },
      (error) => {
        hideTyping();
        console.error("HTTP Error:", error);
        addBubble("⚠️ Gagal koneksi ke server Python", "other");
      }
    );
  } else {
    try {
      const res = await fetch(`${serverUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
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
      console.error("Fetch error:", err);
      addBubble("⚠️ Gagal koneksi ke server Python", "other");
    }
  }
}

enter.addEventListener("click", (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg) sendMessage(msg);
  input.value = "";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg) sendMessage(msg);
    input.value = "";
  }
});
