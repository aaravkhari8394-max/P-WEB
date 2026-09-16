// =========================================
// JARVIS P.WEB — CONTROL SYSTEM
// =========================================

let sessionId =
    globalThis.crypto?.randomUUID?.() ||
    String(Date.now());


// =========================================
// CONFIGURATION
// =========================================

// Communication Core
// Local development only.
// Public deployment ke liye later secure HTTPS endpoint use hoga.
const CORE_URL = "http://192.168.1.9:8000";

// Universal robot endpoint.
// User apne robot ke Wi-Fi se connected hone ke baad
// compatible ESP8266 robot ko local network par access karega.
const ROBOT_URL = "http://192.168.4.1";


// =========================================
// DEVICE INFORMATION
// =========================================

function getDeviceInfo() {

    return {
        platform: navigator.platform || "Unknown",

        userAgent:
            navigator.userAgent || "Unknown",

        language:
            navigator.language || "Unknown",

        screen:
            `${screen.width}x${screen.height}`,

        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone || "Unknown",

        sessionId:
            sessionId
    };
}


// =========================================
// COMMUNICATION CORE
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
// MODE SELECTION
// =========================================

function selectMode(mode) {

    const modeData = {

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


    const selected = modeData[mode];

    if (!selected) return;


    // Mode screen hide
    document
        .getElementById("modeScreen")
        .classList.remove("active");


    // Control screen show
    document
        .getElementById("controlScreen")
        .classList.add("active");


    // Title
    const title =
        document.getElementById(
            "selectedModeTitle"
        );

    if (title) {
        title.textContent = selected.title;
    }


    // Camera
    const cameraPanel =
        document.getElementById(
            "cameraPanel"
        );

    if (cameraPanel) {

        cameraPanel.classList.toggle(
            "hidden",
            !selected.camera
        );

    }


    // Mic
    const micPanel =
        document.getElementById(
            "micPanel"
        );

    if (micPanel) {

        micPanel.classList.toggle(
            "hidden",
            !selected.mic
        );

    }


    // Sensor
    const sensorPanel =
        document.getElementById(
            "sensorPanel"
        );

    if (sensorPanel) {

        sensorPanel.classList.toggle(
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
// BACK BUTTON
// =========================================

function goBack() {

    stopCar();

    document
        .getElementById("controlScreen")
        .classList.remove("active");


    document
        .getElementById("modeScreen")
        .classList.add("active");


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
            "TESTING ROBOT CONNECTION...";

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


        if (response.ok) {

            if (status) {

                status.textContent =
                    "ROBOT CONNECTION DETECTED";

            }

            if (text) {

                text.textContent =
                    "Compatible robot endpoint responded.";

            }

        } else {

            throw new Error(
                "Robot did not respond."
            );

        }

    } catch (error) {

        if (status) {

            status.textContent =
                "ROBOT NOT DETECTED";

        }

        if (text) {

            text.textContent =
                "Make sure your phone/laptop is connected to your robot's Wi-Fi network.";

        }

        console.log(
            "Robot connection test failed:",
            error
        );

    }

}


// =========================================
// CAR COMMAND
// =========================================

async function sendCarCommand(command) {

    const allowedCommands =
        ["F", "B", "L", "R", "S"];


    if (!allowedCommands.includes(command)) {
        return;
    }


    console.log(
        "CAR COMMAND:",
        command
    );


    // Button animation
    const btnMap = {

        F: "btn-F",

        B: "btn-B",

        L: "btn-L",

        R: "btn-R",

        S: "btn-S"

    };


    const targetButton =
        document.getElementById(
            btnMap[command]
        );


    if (targetButton) {

        targetButton.classList.add(
            "active-key"
        );


        setTimeout(() => {

            targetButton.classList.remove(
                "active-key"
            );

        }, 180);

    }


    // =====================================
    // SEND COMMAND TO ESP8266
    // =====================================

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
                "Robot command rejected."
            );

        }


        console.log(
            "ROBOT COMMAND SENT:",
            command
        );


    } catch (error) {

        console.log(
            "Robot command failed:",
            error
        );

    }


    // Communication Core event
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
// KEYBOARD CONTROL
// =========================================

document.addEventListener(
    "keydown",
    function(event) {

        // Prevent repeated commands
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


        if (command) {

            event.preventDefault();

            sendCarCommand(
                command
            );

        }

    }
);


// =========================================
// KEY RELEASE = STOP
// =========================================

document.addEventListener(
    "keyup",
    function(event) {

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
// MOBILE TOUCH / POINTER CONTROL
// =========================================

document.addEventListener(
    "pointerup",
    function() {

        // Safety stop
        // Touch/pointer release ke baad robot stop.
        sendCarCommand("S");

    }
);


// =========================================
// PAGE LOAD
// =========================================

window.addEventListener(
    "load",
    function() {

        console.log(
            "JARVIS P.WEB loaded."
        );


        sendEvent(
            "PWEB_OPENED"
        );

    }
);