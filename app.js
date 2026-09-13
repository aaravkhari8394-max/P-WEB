let sessionId =
  (crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now());

const CORE_URL = "http://192.168.1.9:8000";

function getDeviceInfo() {
  return {
    platform: navigator.platform || "Unknown",
    userAgent: navigator.userAgent || "Unknown",
    language: navigator.language || "Unknown",
    screen: `${screen.width}x${screen.height}`,
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
    sessionId: sessionId
  };
}

async function sendEvent(event, mode = null) {
  try {
    await fetch(`${CORE_URL}/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "P.WEB",
        event: event,
        mode: mode,
        device: getDeviceInfo()
      })
    });
  } catch (error) {
    console.log("Communication Core offline");
  }
}

function selectMode(mode) {
  document.querySelectorAll(".mode").forEach((button, index) => {
    button.classList.toggle(
      "active",
      ["CAR", "CAMERA", "SENSOR", "MIC"][index] === mode
    );
  });

  const messages = {
    CAR: "🚗 CAR CONTROL selected.",
    CAMERA: "🚗📷 CAR + ROBOT CAMERA selected.",
    SENSOR: "🚗📷📡 CAR + CAMERA + SENSORS selected.",
    MIC: "🚗📡🎤 CAR + SENSORS + ROBOT MIC selected."
  };

  const selectedElem = document.getElementById("selected");
  const modeElem = document.getElementById("current-mode");

  if (selectedElem) selectedElem.textContent = messages[mode] || `${mode} selected.`;
  if (modeElem) modeElem.textContent = mode;

  sendEvent("MODE_SELECTED", mode);
}

function sendCarCommand(command) {
  console.log("CAR COMMAND:", command);

  // Button Animation trigger
  const btnMap = { 'F': 'btn-F', 'L': 'btn-L', 'S': 'btn-S', 'R': 'btn-R', 'B': 'btn-B' };
  const targetBtn = document.getElementById(btnMap[command]);
  if (targetBtn) {
    targetBtn.classList.add('active-key');
    setTimeout(() => targetBtn.classList.remove('active-key'), 180);
  }

  // Car connection ko next phase mein attach karenge.
  sendEvent("CAR_COMMAND", "CAR");
}

// Keyboard Support (WASD & Arrow Keys)
document.addEventListener("keydown", (e) => {
  const keyMap = {
    'ArrowUp': 'F', 'w': 'F', 'W': 'F',
    'ArrowLeft': 'L', 'a': 'L', 'A': 'L',
    'ArrowRight': 'R', 'd': 'R', 'D': 'R',
    'ArrowDown': 'B', 's': 'B', 'S': 'B',
    ' ': 'S'
  };

  if (keyMap[e.key]) {
    sendCarCommand(keyMap[e.key]);
  }
});

window.addEventListener("load", () => {
  selectMode("CAR");
  sendEvent("PWEB_OPENED");
});