// =========================================
// JARVIS P.WEB
// CONTROL ENGINE
// =========================================

let sessionId =
    globalThis.crypto?.randomUUID?.() ||
    String(Date.now());


// =========================================
// CONFIG
// =========================================

// Temporary local robot address.
// Kal ESP8266 Wi-Fi test ke time use hoga.
const ROBOT_URL = "http://192.168.4.1";

// Temporary Communication Core address.
const CORE_URL = "http://192.168.1.9:8000";


// =========================================
// DEVICE INFO
// =========================================

function getDeviceInfo() {

    return {
        platform: navigator.platform || "Unknown",

        userAgent: navigator.userAgent || "Unknown",

        language: navigator.language || "Unknown",

        screen:
            `${window.screen.width}x${window.screen.height}`,

        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone || "Unknown",

        sessionId: sessionId
    };
}


// =========================================
// SEND EVENT TO COMMUNICATION CORE
// =========================================

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

        console.log(
            "Communication Core unavailable."
        );

    }
}


// =========================================
// MODE DATA
// =========================================

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
        title:
            "CAR CONTROL / CAMERA / MIC / SENSOR",
        camera: true,
        mic: true,
        sensor: true
    }

};


// =========================================
// SELECT MODE
// =========================================

function selectMode(mode) {

    const selected = modes[mode];

    if (!selected) {
        return;
    }


    // Opening screen hide
    const modeScreen =
        document.getElementById("modeScreen");

    // Control screen show
    const controlScreen =
        document.getElementById("controlScreen");


    if (modeScreen) {
        modeScreen.classList.remove("active");
    }

    if (controlScreen) {
        controlScreen.classList.add("active");
    }


    // Title
    const title =
        document.getElementById(
            "selectedModeTitle"
        );

    if (title) {
        title.textContent =
            selected.title;
    }


    // Camera
    const camera =
        document.getElementById(
            "cameraPanel"
        );

    if (camera) {

        camera.classList.toggle(
            "hidden",
            !selected.camera
        );

    }


    // Microphone
    const mic =
        document.getElementById(
            "micPanel"
        );

    if (mic) {

        mic.classList.toggle(
            "hidden",
            !selected.mic
        );

    }


    // Sensors
    const sensor =
        document.getElementById(
            "sensorPanel"
        );

    if (sensor) {

        sensor.classList.toggle(
            "hidden",
            !selected.sensor
        );

    }


    sendEvent(
        "MODE_SELECTED",
        mode
    );

}


// =========================================
// BACK
// =========================================

function goBack() {

    stopCar();


    const controlScreen =
        document.getElementById(
            "controlScreen"
        );

    const modeScreen =
        document.getElementById(
            "modeScreen"
        );


    if (controlScreen) {
        controlScreen.classList.remove(
            "active"
        );
    }

    if (modeScreen) {
        modeScreen.classList.add(
            "active"
        );
    }


    sendEvent(
        "CONTROL_SCREEN_CLOSED"
    );

}


// =========================================
// ROBOT CONNECTION TEST
// =========================================

async function testRobotConnection() {

    const status =
        document.getElementById(
            "robotStatus"
        );

    const text =
        document.getElementById(
            "connectionText"
        );


    if (status) {
        status.textContent =
            "TESTING ROBOT...";
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
                "Robot unavailable"
            );
        }


        if (status) {
            status.textContent =
                "ROBOT CONNECTION DETECTED";
        }

        if (text) {
            text.textContent =
                "Robot responded successfully.";
        }


    } catch (error) {

        if (status) {
            status.textContent =
                "ROBOT NOT DETECTED";
        }

        if (text) {
            text.textContent =
                "Connect your phone/laptop to the robot Wi-Fi first.";
        }


        console.log(
            "Robot test:",
            error
        );

    }

}


// =========================================
// SEND CAR COMMAND
// =========================================

async function sendCarCommand(command) {

    const allowed =
        ["F", "B", "L", "R", "S"];


    if (!allowed.includes(command)) {
        return;
    }


    console.log(
        "CAR COMMAND:",
        command
    );


    // Button animation

    const buttonIds = {

        F: "btn-F",

        B: "btn-B",

        L: "btn-L",

        R: "btn-R",

        S: "btn-S"

    };


    const button =
        document.getElementById(
            buttonIds[command]
        );


    if (button) {

        button.classList.add(
            "active-key"
        );

        setTimeout(() => {

            button.classList.remove(
                "active-key"
            );

        }, 160);

    }


    // Send to ESP8266

    try {

        const response =
            await fetch(
                `${ROBOT_URL}/?State=${command}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Robot rejected command"
            );

        }


        console.log(
            "COMMAND SENT:",
            command
        );


    } catch (error) {

        console.log(
            "Robot command failed:",
            error
        );

    }


    sendEvent(
        "CAR_COMMAND",
        "CAR"
    );

}


// =========================================
// STOP
// =========================================

function stopCar() {

    sendCarCommand("S");

}


// =========================================
// KEYBOARD
// =========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.repeat) {
            return;
        }


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
            D: "R",

            " ": "S"

        };


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


// =========================================
// KEY RELEASE
// =========================================

document.addEventListener(
    "keyup",
    function (event) {

        const movementKeys = [

            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",

            "w",
            "W",

            "s",
            "S",

            "a",
            "A",

            "d",
            "D"

        ];


        if (
            movementKeys.includes(
                event.key
            )
        ) {

            sendCarCommand("S");

        }

    }
);


// =========================================
// PAGE LOAD
// =========================================

window.addEventListener(
    "load",
    function () {

        console.log(
            "JARVIS P.WEB ONLINE"
        );

        sendEvent(
            "PWEB_OPENED"
        );

    }
);