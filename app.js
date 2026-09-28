// =====================================================
// JARVIS P.WEB
// ORIGINAL UI + ESP8266 CAR + SERVO SUPPORT
// =====================================================

// =========================
// CONNECTION
// =========================

let ROBOT_URL = "http://192.168.4.1";

// ESP8266 = car + Arduino UNO bridge
let ESP8266_URL = "http://192.168.4.1";

// Optional ESP32
let ESP32_URL = "";

// Camera stream - fill later when A9 URL is known
let CAMERA_STREAM_URL = "";

// Camera/servo controller
let CAMERA_URL = ESP8266_URL;

const CAMERA_COMMAND_PATH = "/servo";


// =========================
// JARVIS CORE
// =========================

const CORE_URL = "http://192.168.1.9:8000";

let sessionId =
  globalThis.crypto?.randomUUID?.() ||
  String(Date.now());

let sensorTimer = null;


// =====================================================
// MODES
// =====================================================

const modes = {

  CAR: {
    title: "CAR CONTROL",
    camera: false,
    mic: false,
    sensor: false
  },

  CAMERA: {
    title: "CAR CONTROL / CAMERA",
    camera: true,
    mic: false,
    sensor: false
  },

  MIC: {
    title: "CAR CONTROL / CAMERA / MIC",
    camera: true,
    mic: true,
    sensor: false
  },

  SENSOR: {
    title: "FULL ROBOT SYSTEM",
    camera: true,
    mic: true,
    sensor: true
  }

};


// =====================================================
// DEVICE INFO
// =====================================================

function getDeviceInfo() {

  return {

    platform:
      navigator.platform || "Unknown",

    userAgent:
      navigator.userAgent || "Unknown",

    language:
      navigator.language || "Unknown",

    screen:
      `${window.screen.width}x${window.screen.height}`,

    timezone:
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || "Unknown",

    sessionId

  };

}


// =====================================================
// CORE EVENT
// =====================================================

async function sendEvent(event, mode = null) {

  try {

    await fetch(
      `${CORE_URL}/event`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          source: "P.WEB",

          event,

          mode,

          device:
            getDeviceInfo()

        })
      }
    );

  } catch {

    console.log(
      "Communication Core unavailable."
    );

  }

}


// =====================================================
// ROBOT ADDRESS
// =====================================================

function getRobotAddress() {

  const select =
    document.getElementById(
      "robotAddress"
    );

  const custom =
    document.getElementById(
      "customRobotAddress"
    );

  // If old HTML has no selector,
  // automatically use ESP8266.

  if (!select) {
    return ESP8266_URL;
  }

  if (select.value === "CUSTOM") {

    let value =
      custom?.value.trim() || "";

    if (!value) {
      return "";
    }

    if (
      !value.startsWith("http://") &&
      !value.startsWith("https://")
    ) {

      value =
        "http://" + value;

    }

    return value.replace(/\/+$/, "");

  }

  return select.value
    .replace(/\/+$/, "");

}


// =====================================================
// CUSTOM ADDRESS UI
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const select =
      document.getElementById(
        "robotAddress"
      );

    const custom =
      document.getElementById(
        "customRobotAddress"
      );

    if (!select) {
      return;
    }

    select.addEventListener(
      "change",
      function () {

        if (
          select.value === "CUSTOM"
        ) {

          custom?.classList
            .remove("hidden");

          custom?.focus();

        } else {

          custom?.classList
            .add("hidden");

        }

      }
    );

  }
);


// =====================================================
// CONNECT ROBOT
// =====================================================

async function connectRobot() {

  let address =
    getRobotAddress();

  const status =
    document.getElementById(
      "robotStatus"
    );

  const header =
    document.getElementById(
      "headerStatus"
    );

  // Fallback to ESP8266
  if (!address) {

    address =
      ESP8266_URL;

  }

  ROBOT_URL =
    address.replace(/\/+$/, "");

  if (status) {
    status.textContent =
      "CONNECTING...";
  }

  if (header) {
    header.textContent =
      "CONNECTING";
  }

  try {

    const response =
      await fetch(
        `${ROBOT_URL}/`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Robot did not respond"
      );
    }

    if (status) {

      status.textContent =
        `ROBOT ONLINE — ${ROBOT_URL}`;

    }

    if (header) {
      header.textContent =
        "ROBOT ONLINE";
    }

    sendEvent(
      "ROBOT_CONNECTED"
    );

    console.log(
      "JARVIS ROBOT:",
      ROBOT_URL
    );

  } catch (error) {

    if (status) {

      status.textContent =
        `ROBOT NOT DETECTED — ${ROBOT_URL}`;

    }

    if (header) {
      header.textContent =
        "OFFLINE";
    }

    console.log(
      "Robot connection failed:",
      error
    );

  }

}


// =====================================================
// AUTO SCAN
// =====================================================

async function autoScanRobot() {

  const scanStatus =
    document.getElementById(
      "scanStatus"
    );

  const robotStatus =
    document.getElementById(
      "robotStatus"
    );

  const header =
    document.getElementById(
      "headerStatus"
    );

  if (scanStatus) {
    scanStatus.textContent =
      "SCANNING...";
  }

  if (robotStatus) {
    robotStatus.textContent =
      "AUTO SCAN ACTIVE";
  }

  if (header) {
    header.textContent =
      "SCANNING";
  }

  // ESP8266 first
  const addresses = [

    "http://192.168.4.1",
    "http://192.168.4.2",
    "http://192.168.4.3",

    "http://192.168.1.1",
    "http://192.168.1.100",
    "http://192.168.1.101",

    "http://192.168.0.1",
    "http://192.168.0.100"

  ];

  for (
    const address of addresses
  ) {

    if (scanStatus) {

      scanStatus.textContent =
        `TESTING ${address}...`;

    }

    try {

      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () => controller.abort(),
          1000
        );

      const response =
        await fetch(
          `${address}/ping`,
          {
            method: "GET",
            cache: "no-store",
            signal:
              controller.signal
          }
        );

      clearTimeout(timeout);

      if (response.ok) {

        ROBOT_URL =
          address;

        ESP8266_URL =
          address;

        const select =
          document.getElementById(
            "robotAddress"
          );

        if (select) {
          select.value =
            address;
        }

        if (robotStatus) {

          robotStatus.textContent =
            `ROBOT FOUND — ${address}`;

        }

        if (header) {
          header.textContent =
            "ROBOT ONLINE";
        }

        if (scanStatus) {
          scanStatus.textContent =
            "AUTO SCAN COMPLETE";
        }

        sendEvent(
          "ROBOT_AUTO_DETECTED"
        );

        return;

      }

    } catch {

      // continue

    }

  }

  if (robotStatus) {
    robotStatus.textContent =
      "NO ROBOT FOUND";
  }

  if (header) {
    header.textContent =
      "WAITING";
  }

  if (scanStatus) {
    scanStatus.textContent =
      "AUTO SCAN COMPLETE — NO ROBOT DETECTED";
  }

}


// =====================================================
// MODE
// =====================================================

function selectMode(mode) {

  const selected =
    modes[mode];

  if (!selected) {
    return;
  }

  document
    .getElementById("modeScreen")
    ?.classList
    .remove("active");

  document
    .getElementById("controlScreen")
    ?.classList
    .add("active");

  const title =
    document.getElementById(
      "selectedModeTitle"
    );

  if (title) {

    title.textContent =
      selected.title;

  }

  document
    .getElementById("cameraPanel")
    ?.classList
    .toggle(
      "hidden",
      !selected.camera
    );

  document
    .getElementById("micPanel")
    ?.classList
    .toggle(
      "hidden",
      !selected.mic
    );

  document
    .getElementById("sensorPanel")
    ?.classList
    .toggle(
      "hidden",
      !selected.sensor
    );

  if (selected.camera) {

    setupCamera();

  } else {

    stopCamera();

  }

  if (selected.sensor) {

    startSensors();

  } else {

    stopSensors();

  }

  sendEvent(
    "MODE_SELECTED",
    mode
  );

}


// =====================================================
// BACK
// =====================================================

function goBack() {

  stopCar();

  stopCamera();

  stopSensors();

  document
    .getElementById("controlScreen")
    ?.classList
    .remove("active");

  document
    .getElementById("modeScreen")
    ?.classList
    .add("active");

  sendEvent(
    "CONTROL_SCREEN_CLOSED"
  );

}


// =====================================================
// CAR COMMAND
// =====================================================

async function sendCarCommand(command) {

  const allowed = [
    "F",
    "B",
    "L",
    "R",
    "S"
  ];

  if (
    !allowed.includes(command)
  ) {
    return;
  }

  if (!ROBOT_URL) {

    ROBOT_URL =
      ESP8266_URL;

  }

  const buttonMap = {

    F: "btn-F",
    B: "btn-B",
    L: "btn-L",
    R: "btn-R",
    S: "btn-S"

  };

  const button =
    document.getElementById(
      buttonMap[command]
    );

  if (button) {

    button.classList
      .add("active-key");

    setTimeout(
      () => {

        button.classList
          .remove("active-key");

      },
      120
    );

  }

  try {

    // EXACT ESP8266 API
    const url =
      `${ROBOT_URL}/?State=${encodeURIComponent(command)}`;

    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    console.log(
      "CAR:",
      command
    );

  } catch (error) {

    console.error(
      "CAR COMMAND FAILED:",
      error
    );

    const status =
      document.getElementById(
        "robotStatus"
      );

    if (status) {

      status.textContent =
        "CAR CONNECTION FAILED";

    }

  }

  sendEvent(
    "CAR_COMMAND",
    command
  );

}


// =====================================================
// STOP
// =====================================================

function stopCar() {

  if (ROBOT_URL) {

    sendCarCommand("S");

  }

}


// =====================================================
// CAR BUTTONS
// =====================================================

const movementButtons = {

  "btn-F": "F",
  "btn-B": "B",
  "btn-L": "L",
  "btn-R": "R"

};


function setupMovementControls() {

  Object.entries(
    movementButtons
  ).forEach(
    ([id, command]) => {

      const button =
        document.getElementById(id);

      if (
        !button ||
        button.dataset.ready
      ) {
        return;
      }

      button.dataset.ready =
        "true";

      button.addEventListener(
        "pointerdown",
        event => {

          event.preventDefault();

          sendCarCommand(
            command
          );

        }
      );

      button.addEventListener(
        "pointerup",
        event => {

          event.preventDefault();

          stopCar();

        }
      );

      button.addEventListener(
        "pointercancel",
        stopCar
      );

      button.addEventListener(
        "pointerleave",
        stopCar
      );

    }
  );

}


// =====================================================
// KEYBOARD CONTROL
// =====================================================

const keyMap = {

  ArrowUp: "F",
  ArrowDown: "B",
  ArrowLeft: "L",
  ArrowRight: "R",

  w: "F",
  W: "F",

  s: "B",
  S: "B",

  a: "L",
  A: "L",

  d: "R",
  D: "R"

};


document.addEventListener(
  "keydown",
  event => {

    if (event.repeat) {
      return;
    }

    if (event.key === " ") {

      event.preventDefault();

      stopCar();

      return;

    }

    const command =
      keyMap[event.key];

    if (!command) {
      return;
    }

    event.preventDefault();

    sendCarCommand(
      command
    );

  }
);


document.addEventListener(
  "keyup",
  event => {

    if (
      keyMap[event.key]
    ) {

      stopCar();

    }

  }
);


// =====================================================
// SAFETY STOP
// =====================================================

window.addEventListener(
  "blur",
  stopCar
);

document.addEventListener(
  "visibilitychange",
  () => {

    if (document.hidden) {

      stopCar();

    }

  }
);


// =====================================================
// SERVO / CAMERA CONTROL
// =====================================================

async function sendCameraCommand(
  command
) {

  const status =
    document.getElementById(
      "cameraCommandStatus"
    );

  if (!CAMERA_URL) {

    CAMERA_URL =
      ROBOT_URL ||
      ESP8266_URL;

  }

  if (!CAMERA_URL) {

    if (status) {
      status.textContent =
        "SERVO CONTROLLER OFFLINE";
    }

    return;

  }

  try {

    const response =
      await fetch(
        `${CAMERA_URL}${CAMERA_COMMAND_PATH}?cmd=${encodeURIComponent(command)}`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error();
    }

    if (status) {

      status.textContent =
        `SERVO: ${command}`;

    }

    console.log(
      "SERVO:",
      command
    );

    sendEvent(
      "SERVO_COMMAND",
      command
    );

  } catch (error) {

    if (status) {

      status.textContent =
        "SERVO OFFLINE";

    }

    console.error(
      "SERVO ERROR:",
      error
    );

  }

}


// =====================================================
// CAMERA/SERVO BUTTONS
// =====================================================

function setupCameraControls() {

  document
    .querySelectorAll(
      "[data-camera-command]"
    )
    .forEach(
      button => {

        if (button.dataset.ready) {
          return;
        }

        button.dataset.ready =
          "true";

        const command =
          button.dataset
            .cameraCommand;

        let timer = null;

        function start(event) {

          event.preventDefault();

          sendCameraCommand(
            command
          );

          if (
            command !== "CENTER"
          ) {

            timer =
              setInterval(
                () => {

                  sendCameraCommand(
                    command
                  );

                },
                180
              );

          }

        }

        function stop(event) {

          event
            ?.preventDefault?.();

          if (timer) {

            clearInterval(
              timer
            );

          }

          timer = null;

        }

        button.addEventListener(
          "pointerdown",
          start
        );

        button.addEventListener(
          "pointerup",
          stop
        );

        button.addEventListener(
          "pointercancel",
          stop
        );

        button.addEventListener(
          "pointerleave",
          stop
        );

      }
    );

}


// =====================================================
// SENSOR SYSTEM
// =====================================================

function startSensors() {

  stopSensors();

  updateSensors();

  sensorTimer =
    setInterval(
      updateSensors,
      500
    );

}


function stopSensors() {

  if (sensorTimer) {

    clearInterval(
      sensorTimer
    );

  }

  sensorTimer = null;

}


async function updateSensors() {

  const url =
    ROBOT_URL ||
    ESP8266_URL;

  if (!url) {
    return;
  }

  try {

    const response =
      await fetch(
        `${url}/sensors`,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error();
    }

    const data =
      await response.json();

    // Sensor 1
    const s1 =
      document.getElementById(
        "sensor1"
      );

    if (s1 && data.sensor1 != null) {

      s1.textContent =
        data.sensor1;

    }

    // Sensor 2
    const s2 =
      document.getElementById(
        "sensor2"
      );

    if (s2 && data.sensor2 != null) {

      s2.textContent =
        data.sensor2;

    }

    // Existing distance card
    const distance =
      document.getElementById(
        "sensor-distance"
      );

    if (
      distance &&
      data.distance_cm != null
    ) {

      distance.textContent =
        `${data.distance_cm} cm`;

    }

    // Obstacle
    const obstacle =
      document.getElementById(
        "sensor-obstacle"
      );

    if (
      obstacle &&
      data.obstacle != null
    ) {

      obstacle.textContent =
        data.obstacle
          ? "YES"
          : "NO";

    }

    const obstacleState =
      document.getElementById(
        "sensor-obstacle-state"
      );

    if (
      obstacleState &&
      data.obstacle != null
    ) {

      obstacleState.textContent =
        data.obstacle
          ? "OBSTACLE"
          : "CLEAR";

    }

    // Battery
    const battery =
      document.getElementById(
        "sensor-battery"
      );

    if (
      battery &&
      data.battery_v != null
    ) {

      battery.textContent =
        `${data.battery_v} V`;

    }

    // System
    const system =
      document.getElementById(
        "sensor-system"
      );

    if (
      system &&
      data.system != null
    ) {

      system.textContent =
        data.system;

    }

  } catch {

    console.log(
      "Sensor system waiting..."
    );

  }

}


// =====================================================
// MICROPHONE
// =====================================================

async function testBrowserMicrophone() {

  const status =
    document.getElementById(
      "micStatus"
    );

  const text =
    document.getElementById(
      "micText"
    );

  try {

    const stream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio: true
        });

    stream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    if (status) {

      status.textContent =
        "DEVICE MIC ACCESS OK";

    }

    if (text) {

      text.textContent =
        "Microphone permission is working.";

    }

  } catch {

    if (status) {

      status.textContent =
        "MIC ACCESS DENIED";

    }

  }

}


// =====================================================
// START
// =====================================================

window.addEventListener(
  "load",
  () => {

    // Default ESP8266
    ROBOT_URL =
      ESP8266_URL;

    CAMERA_URL =
      ESP8266_URL;

    setupMovementControls();

    setupCameraControls();

    console.log(
      "JARVIS P.WEB ONLINE"
    );

    console.log(
      "ESP8266:",
      ESP8266_URL
    );

    sendEvent(
      "PWEB_OPENED"
    );

    // Automatically test ESP8266
    connectRobot();

  }
);
