function selectMode(mode) {
    const selected = document.getElementById("selected");

    if (mode === "CAR") {
        selected.textContent = "🚗 CAR CONTROL selected.";
    }

    else if (mode === "CAMERA") {
        selected.textContent = "🚗📷 CAR + ROBOT CAMERA CONTROL selected.";
    }

    else if (mode === "SENSOR") {
        selected.textContent = "🚗📷📡 CAR + ROBOT CAMERA + SENSORS selected.";
    }

    else if (mode === "MIC") {
        selected.textContent = "🚗📡🎤 CAR + ROBOT SENSORS + ROBOT MIC selected.";
    }

    console.log("Selected mode:", mode);
}
