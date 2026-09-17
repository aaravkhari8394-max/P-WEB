// =====================================================
// JARVIS P.WEB v0.5
// UNIVERSAL ROBOT CONTROLLER
// =====================================================


// =====================================================
// ROBOT ADDRESS
// =====================================================

let ROBOT_URL = "";


// Camera will later use the user's own camera ESP32.

let CAMERA_URL = "";

let CAMERA_STREAM_URL = "";

const CAMERA_COMMAND_PATH = "/camera";


// JARVIS Communication Core

const CORE_URL =
  "http://192.168.1.9:8000";


let sessionId =
  globalThis.crypto?.randomUUID?.() ||
  String(Date.now());


let sensorTimer = null;


// =====================================================
// MODES
// =====================================================

const modes = {

  CAR:{
    title:"CAR CONTROL",
    camera:false,
    mic:false,
    sensor:false
  },

  CAMERA:{
    title:"CAR CONTROL / CAMERA",
    camera:true,
    mic:false,
    sensor:false
  },

  MIC:{
    title:"CAR CONTROL / CAMERA / MIC",
    camera:true,
    mic:true,
    sensor:false
  },

  SENSOR:{
    title:"FULL ROBOT SYSTEM",
    camera:true,
    mic:true,
    sensor:true
  }

};


// =====================================================
// DEVICE INFO
// =====================================================

function getDeviceInfo(){

  return{

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

async function sendEvent(
  event,
  mode=null
){

  try{

    await fetch(
      `${CORE_URL}/event`,
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            source:"P.WEB",

            event,

            mode,

            device:
              getDeviceInfo()

          })
      }
    );

  }catch{

    console.log(
      "Communication Core unavailable."
    );

  }

}


// =====================================================
// ROBOT ADDRESS
// =====================================================

function getRobotAddress(){

  const select =
    document.getElementById(
      "robotAddress"
    );

  const custom =
    document.getElementById(
      "customRobotAddress"
    );


  if(
    select.value === "CUSTOM"
  ){

    let value =
      custom.value.trim();


    if(!value){

      return "";

    }


    if(
      !value.startsWith("http://") &&
      !value.startsWith("https://")
    ){

      value =
        "http://" + value;

    }


    return value
      .replace(/\/+$/,"");

  }


  return select.value
    .replace(/\/+$/,"");

}


// =====================================================
// CUSTOM ADDRESS UI
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function(){

    const select =
      document.getElementById(
        "robotAddress"
      );

    const custom =
      document.getElementById(
        "customRobotAddress"
      );


    select?.addEventListener(
      "change",
      function(){

        if(
          select.value === "CUSTOM"
        ){

          custom.classList
            .remove("hidden");

          custom.focus();

        }else{

          custom.classList
            .add("hidden");

        }

      }
    );

  }
);


// =====================================================
// CONNECT ROBOT
// =====================================================

async function connectRobot(){

  const address =
    getRobotAddress();


  const status =
    document.getElementById(
      "robotStatus"
    );

  const header =
    document.getElementById(
      "headerStatus"
    );


  if(!address){

    status.textContent =
      "ENTER A ROBOT ADDRESS";

    return;

  }


  ROBOT_URL =
    address;


  status.textContent =
    "CONNECTING...";


  header.textContent =
    "CONNECTING";


  try{

    const response =
      await fetch(
        `${ROBOT_URL}/`,
        {
          method:"GET",
          cache:"no-store"
        }
      );


    if(!response.ok){

      throw new Error(
        "Robot did not respond."
      );

    }


    status.textContent =
      `ROBOT ONLINE — ${ROBOT_URL}`;


    header.textContent =
      "ROBOT ONLINE";


    sendEvent(
      "ROBOT_CONNECTED"
    );


    console.log(
      "JARVIS ROBOT:",
      ROBOT_URL
    );


  }catch(error){

    status.textContent =
      `ROBOT NOT DETECTED — ${ROBOT_URL}`;


    header.textContent =
      "OFFLINE";


    console.log(
      "Robot connection failed:",
      error
    );

  }

}


// =====================================================
// AUTO SCAN
// =====================================================
//
// Browser security may prevent some addresses from
// being scanned from a public HTTPS page.
// Therefore this is a best-effort scanner.
// =====================================================

async function autoScanRobot(){

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


  scanStatus.textContent =
    "SCANNING COMMON ROBOT ADDRESSES...";


  robotStatus.textContent =
    "AUTO SCAN ACTIVE";


  header.textContent =
    "SCANNING";


  const addresses = [

    "http://192.168.4.1",
    "http://192.168.4.2",
    "http://192.168.4.3",
    "http://192.168.4.10",
    "http://192.168.4.20",

    "http://192.168.1.1",
    "http://192.168.1.100",
    "http://192.168.1.101",

    "http://192.168.0.1",
    "http://192.168.0.100"

  ];


  for(
    const address of addresses
  ){

    scanStatus.textContent =
      `TESTING ${address}...`;


    try{

      const controller =
        new AbortController();


      const timeout =
        setTimeout(
          () => controller.abort(),
          700
        );


      const response =
        await fetch(
          `${address}/`,
          {
            method:"GET",
            cache:"no-store",
            signal:
              controller.signal
          }
        );


      clearTimeout(timeout);


      if(response.ok){

        ROBOT_URL =
          address;


        document
          .getElementById(
            "robotAddress"
          )
          .value =
          address;


        robotStatus.textContent =
          `ROBOT FOUND — ${address}`;


        header.textContent =
          "ROBOT ONLINE";


        scanStatus.textContent =
          "AUTO SCAN COMPLETE";


        sendEvent(
          "ROBOT_AUTO_DETECTED"
        );


        return;

      }

    }catch{

      // Continue scanning.

    }

  }


  robotStatus.textContent =
    "NO ROBOT FOUND";


  header.textContent =
    "WAITING";


  scanStatus.textContent =
    "AUTO SCAN COMPLETE — NO ROBOT DETECTED";

}


// =====================================================
// MODE
// =====================================================

function selectMode(mode){

  const selected =
    modes[mode];


  if(!selected)
    return;


  document
    .getElementById("modeScreen")
    ?.classList
    .remove("active");


  document
    .getElementById("controlScreen")
    ?.classList
    .add("active");


  document
    .getElementById(
      "selectedModeTitle"
    )
    .textContent =
    selected.title;


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


  if(selected.camera){

    setupCamera();

  }else{

    stopCamera();

  }


  if(selected.sensor){

    startSensors();

  }else{

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

function goBack(){

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

async function sendCarCommand(
  command
){

  const allowed =
    [
      "F",
      "B",
      "L",
      "R",
      "S"
    ];


  if(!allowed.includes(command))
    return;


  if(!ROBOT_URL){

    console.log(
      "Robot not connected."
    );

    return;

  }


  const buttonMap = {

    F:"btn-F",
    B:"btn-B",
    L:"btn-L",
    R:"btn-R",
    S:"btn-S"

  };


  const button =
    document.getElementById(
      buttonMap[command]
    );


  if(button){

    button.classList
      .add("active-key");


    setTimeout(
      () =>
        button.classList
          .remove("active-key"),

      120
    );

  }


  try{

    const response =
      await fetch(
        `${ROBOT_URL}/?State=${command}`,
        {
          method:"GET",
          cache:"no-store"
        }
      );


    if(!response.ok)
      throw new Error(
        "Robot rejected command."
      );


  }catch(error){

    console.log(
      "Robot command failed:",
      error
    );

  }


  sendEvent(
    "CAR_COMMAND",
    command
  );

}


function stopCar(){

  if(ROBOT_URL){

    sendCarCommand("S");

  }

}


// =====================================================
// CAR HOLD CONTROLS
// =====================================================

const movementButtons = {

  "btn-F":"F",
  "btn-B":"B",
  "btn-L":"L",
  "btn-R":"R"

};


function setupMovementControls(){

  Object.entries(
    movementButtons
  ).forEach(
    ([id,command]) => {

      const button =
        document.getElementById(id);


      if(!button ||
         button.dataset.ready)
        return;


      button.dataset.ready =
        "true";


      button.addEventListener(
        "pointerdown",
        event => {

          event.preventDefault();

          button.setPointerCapture?.(
            event.pointerId
          );

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
// KEYBOARD
// =====================================================

const keyMap = {

  ArrowUp:"F",
  ArrowDown:"B",
  ArrowLeft:"L",
  ArrowRight:"R",

  w:"F",
  W:"F",

  s:"B",
  S:"B",

  a:"L",
  A:"L",

  d:"R",
  D:"R"

};


document.addEventListener(
  "keydown",
  event => {

    if(event.repeat)
      return;


    if(event.key === " "){

      event.preventDefault();

      stopCar();

      return;

    }


    const command =
      keyMap[event.key];


    if(!command)
      return;


    event.preventDefault();

    sendCarCommand(
      command
    );

  }
);


document.addEventListener(
  "keyup",
  event => {

    if(keyMap[event.key]){

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

    if(document.hidden){

      stopCar();

    }

  }
);


// =====================================================
// CAMERA
// =====================================================

function setupCamera(){

  const feed =
    document.getElementById(
      "cameraFeed"
    );

  const screen =
    document.querySelector(
      ".camera-screen"
    );

  const state =
    document.getElementById(
      "cameraState"
    );


  if(!feed || !screen)
    return;


  if(!CAMERA_STREAM_URL){

    screen.classList
      .remove("live");


    state.textContent =
      "STANDBY";


    return;

  }


  feed.onload =
    () => {

      screen.classList
        .add("live");


      state.textContent =
        "LIVE";

    };


  feed.onerror =
    () => {

      screen.classList
        .remove("live");


      state.textContent =
        "OFFLINE";

    };


  feed.src =
    CAMERA_STREAM_URL;

}


function stopCamera(){

  const feed =
    document.getElementById(
      "cameraFeed"
    );

  const screen =
    document.querySelector(
      ".camera-screen"
    );

  const state =
    document.getElementById(
      "cameraState"
    );


  if(feed){

    feed.removeAttribute(
      "src"
    );

  }


  screen
    ?.classList
    .remove("live");


  if(state){

    state.textContent =
      "STANDBY";

  }

}


// =====================================================
// CAMERA PAN / TILT
// =====================================================

async function sendCameraCommand(
  command
){

  const status =
    document.getElementById(
      "cameraCommandStatus"
    );


  if(!CAMERA_URL){

    status.textContent =
      `CAMERA ${command} — ESP32 NOT CONNECTED`;

    return;

  }


  try{

    const response =
      await fetch(
        `${CAMERA_URL}${CAMERA_COMMAND_PATH}?cmd=${command}`,
        {
          method:"GET",
          cache:"no-store"
        }
      );


    if(!response.ok)
      throw new Error();


    status.textContent =
      `CAMERA SERVO: ${command}`;


    sendEvent(
      "CAMERA_COMMAND",
      command
    );


  }catch{

    status.textContent =
      "CAMERA SERVO OFFLINE";

  }

}


// =====================================================
// CAMERA CONTROLS
// =====================================================

function setupCameraControls(){

  document
    .querySelectorAll(
      "[data-camera-command]"
    )
    .forEach(
      button => {

        if(button.dataset.ready)
          return;


        button.dataset.ready =
          "true";


        const command =
          button.dataset
            .cameraCommand;


        let timer = null;


        function start(event){

          event.preventDefault();


          button.setPointerCapture?.(
            event.pointerId
          );


          sendCameraCommand(
            command
          );


          if(
            command !== "CENTER"
          ){

            timer =
              setInterval(
                () =>
                  sendCameraCommand(
                    command
                  ),
                180
              );

          }

        }


        function stop(event){

          event
            ?.preventDefault?.();


          if(timer){

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
// SENSORS
// =====================================================

function startSensors(){

  stopSensors();


  if(!CAMERA_URL)
    return;


  updateSensors();


  sensorTimer =
    setInterval(
      updateSensors,
      500
    );

}


function stopSensors(){

  if(sensorTimer){

    clearInterval(
      sensorTimer
    );

  }


  sensorTimer = null;

}


async function updateSensors(){

  if(!CAMERA_URL)
    return;


  try{

    const response =
      await fetch(
        `${CAMERA_URL}/sensors`,
        {
          cache:"no-store"
        }
      );


    if(!response.ok)
      throw new Error();


    const data =
      await response.json();


    if(
      data.distance_cm != null
    ){

      document
        .getElementById(
          "sensor-distance"
        )
        .textContent =
        `${data.distance_cm} cm`;

    }


    if(
      data.obstacle != null
    ){

      document
        .getElementById(
          "sensor-obstacle"
        )
        .textContent =
        data.obstacle
          ? "YES"
          : "NO";


      document
        .getElementById(
          "sensor-obstacle-state"
        )
        .textContent =
        data.obstacle
          ? "OBSTACLE"
          : "CLEAR";

    }


    if(
      data.battery_v != null
    ){

      document
        .getElementById(
          "sensor-battery"
        )
        .textContent =
        `${data.battery_v} V`;

    }


    if(data.system != null){

      document
        .getElementById(
          "sensor-system"
        )
        .textContent =
        data.system;

    }


  }catch{

    console.log(
      "Sensor system waiting..."
    );

  }

}


// =====================================================
// MICROPHONE
// =====================================================

async function testBrowserMicrophone(){

  const status =
    document.getElementById(
      "micStatus"
    );

  const text =
    document.getElementById(
      "micText"
    );


  try{

    const stream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio:true
        });


    stream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );


    status.textContent =
      "DEVICE MIC ACCESS OK";


    text.textContent =
      "Microphone permission is working.";

  }catch{

    status.textContent =
      "MIC ACCESS DENIED";

  }

}


// =====================================================
// START
// =====================================================

window.addEventListener(
  "load",
  () => {

    setupMovementControls();

    setupCameraControls();


    console.log(
      "JARVIS P.WEB v0.5 ONLINE"
    );


    sendEvent(
      "PWEB_OPENED"
    );

  }
);
