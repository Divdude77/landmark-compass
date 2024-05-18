// {"p1":{"icon":"fa-house","latitude":51.54754416819623,"longitude":-0.11829843380452111,"color":"#793900"}, "p2":{"icon":"fa-warehouse","latitude":51.546502446086556,"longitude": -0.11842552408933969,"color":"#793900"}, "p3":{"icon":"fa-train","latitude":51.53269507062452,"longitude": -0.12432409228021538, "color":"#793900"}, "p4":{"icon":"fa-football","latitude":51.55571100462829,"longitude":-0.10807005611263243,"color":"#793900"}}
// [{"icon":"fa-house","latitude":51.54754416819623,"longitude":-0.11829843380452111,"color":"#793900"}, {"icon":"fa-warehouse","latitude":51.546502446086556,"longitude": -0.11842552408933969,"color":"#793900"}, {"icon":"fa-train","latitude":51.53269507062452,"longitude": -0.12432409228021538, "color":"#793900"}, {"icon":"fa-football","latitude":51.55571100462829,"longitude":-0.10807005611263243,"color":"#793900"}]
circle = document.querySelector("#circle");
pointersContainer = document.querySelector("#pointers-container");
addPointerButton = document.querySelector("#add-pointer");

icons = null;
fetch('solid_icons.json')
    .then(response => response.json())
    .then(data => {
        icons = data;
        populateIcons();
    })
    .catch((error) => console.error('Error:', error));
activeIcons = [];

arrow = document.createElement("div");
arrow.classList.add("arrow");
bin = document.createElement("i");
bin.classList.add("fa-solid");
bin.classList.add("fa-trash");
bin.classList.add("del");

accuracy = null;
user = {
    latitude: null,
    longitude: null
}

minDistance = null;
minPointer = null;
maxDistance = null;
maxPointer = null;
active = null;
prevHeading = null;

window.onload = function() {
    document.querySelector("#start").style.display = "flex";
    pointers = JSON.parse(localStorage.getItem("compassPointers"));

    if (pointers === null) {
        pointers = [];
    }

    pointers.forEach((pointer, index) => {
        addPointer(index, pointer);
    });
}

document.querySelector("#start").onclick = function(e) {
    document.querySelector("#start").style.opacity = "0";
    document.querySelector("#circle").style.display = "block";
    document.querySelector("#top-bar").style.display = "flex";

    e.preventDefault();

    if (
        DeviceMotionEvent &&
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        DeviceMotionEvent.requestPermission();
      }

    window.addEventListener("deviceorientation", handleOrientation);
    
    navigator.geolocation.watchPosition((position) => {
        accuracy = position.coords.accuracy;
        document.querySelector("#accuracy").innerHTML = accuracy.toFixed(2) + "m";
        document.querySelector("#accuracy-text").style.display = "none";
        if (accuracy > 100) {
            document.querySelector("#accuracy-text").style.display = "block";
        }
        else {
            user.latitude = position.coords.latitude;
            user.longitude = position.coords.longitude;
            updateDistance();
        }
    }, (error) => {
        console.log(error);
    }, {
        enableHighAccuracy: true,
        timeout: 27000,
    });
};

function handleOrientation(event) {
    for (let key in pointers) {
        pointer = pointers[key];
        pointerBearing = calculateInitialBearing(user.latitude, pointer.latitude, user.longitude, pointer.longitude) - event.webkitCompassHeading - 90;
        pointerElement = document.querySelector(`#p${key}`);
        if (!pointerElement.classList.contains("active")) {
            pointerElement.style.transform = `rotate(${pointerBearing}deg)`;
            document.querySelector(`#p${key} i`).style.transform = `rotate(${-pointerBearing}deg)`;
        }
    }

    let north = event.webkitCompassHeading - 90;
    document.querySelector("#N").style.transform = `rotate(${north}deg)`;
    document.querySelector("#N p").style.transform = `rotate(${-north}deg)`;

    document.querySelector("#E").style.transform = `rotate(${north + 90}deg)`;
    document.querySelector("#E p").style.transform = `rotate(${-north - 90}deg`;

    document.querySelector("#S").style.transform = `rotate(${north + 180}deg)`;
    document.querySelector("#S p").style.transform = `rotate(${-north - 180}deg`;

    document.querySelector("#W").style.transform = `rotate(${north + 270}deg)`;
    document.querySelector("#W p").style.transform = `rotate(${-north - 270}deg`;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

function calculateInitialBearing(lat1, lat2, lon1, lon2) {
    const phi1 = degreesToRadians(lat1);
    const phi2 = degreesToRadians(lat2);
    const deltaLambda = degreesToRadians(lon2 - lon1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    let initialBearing = Math.atan2(y, x);
    initialBearing = radiansToDegrees(initialBearing);
    initialBearing = (initialBearing + 360) % 360; // Convert to a compass bearing (0-360 degrees)
    
    return initialBearing;
}

function getDistance(lat1, lat2, lon1, lon2) {
    // Haversine formula
    const R = 6371e3; // Raidus of the earth in metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    
    return d;
}

function updateDistance() {
    active = null;

    let sortedPointers = [];

    for (let key in pointers) {
        let pointer = pointers[key];
        let distance = getDistance(user.latitude, pointer.latitude, user.longitude, pointer.longitude);
        sortedPointers.push({pointer: pointer, distance: distance, key: `p${key}`});
    }
    sortedPointers.sort((a, b) => a.distance - b.distance);

    if (sortedPointers.length != 0) {
        minDistance = sortedPointers[0].distance;
        minPointer = sortedPointers[0].pointer;
        maxDistance = sortedPointers[sortedPointers.length - 1].distance;
        maxPointer = sortedPointers[sortedPointers.length - 1].pointer;
    }

    let zindex = 1;
    for (let i = 0; i < sortedPointers.length; i++) {
        let distance = sortedPointers[i].distance;
        let key = sortedPointers[i].key;
        let pointerElement = document.querySelector(`#${key}`);
        pointerElement.classList.remove("active");
        pointerElement.style.fontSize = "0.6em";
        if (distance <= 1000 && accuracy < 50) {
            if (parseInt(distance)-(accuracy/2) <= 20 && active === null) {
                pointerElement.classList.add("active");
                active = true;
            }
            else {
                pointerElement.style.fontSize = `${0.6 + ((1000 - parseInt(distance)-(accuracy/2)) / 800) * 0.9}em`; // Map 0.6 to 1.5 from 1000 to accuracy
                pointerElement.style.zIndex = zindex;
                zindex++;
            }
        }
        else {
            pointerElement.style.zIndex = zindex;
            zindex++;
        }
    }

    if (minPointer === null) {
        document.querySelector("#nearest").innerHTML = "-";
        document.querySelector("#nearest-icon").classList = "";
        return
    }

    document.querySelector("#nearest").innerHTML = ` (${minDistance.toFixed(2)}m)`;
    document.querySelector("#nearest-icon").classList = "fa-solid";
    document.querySelector("#nearest-icon").classList.add(minPointer.icon);
    document.querySelector("#nearest-icon").style.color = minPointer.color;
}

function addPointer(id, pointer) {
    // Add pointer to compass
    let pointerElement = document.createElement("div");
    pointerElement.id = `p${id}`;
    pointerElement.classList.add("pointer");
    let icon = document.createElement("i");
    icon.style.color = pointer.color;
    icon.classList.add("fa-solid");
    icon.classList.add(pointer.icon);
    pointerElement.appendChild(icon);
    pointerArrow = arrow.cloneNode(true);
    pointerArrow.style.borderColor = 'transparent transparent transparent ' + pointer.color;
    pointerElement.appendChild(pointerArrow);
    circle.appendChild(pointerElement);

    // Add pointer to settings
    let pointerSettingsElement = document.createElement("div");
    pointerSettingsElement.id = `p${id}-settings`;
    let settingsIcon = icon.cloneNode(true);
    pointerSettingsElement.appendChild(settingsIcon);
    let colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = pointer.color;
    colorInput.oninput = () => {
        pointer.color = colorInput.value;
        icon.style.color = pointer.color;
        settingsIcon.style.color = pointer.color;
        pointerArrow.style.borderColor = 'transparent transparent transparent ' + pointer.color;
        console.log(pointerArrow);
        if (minPointer === pointer) {
            document.querySelector("#nearest-icon").style.color = minPointer.color;
        }
        localStorage.setItem("compassPointers", JSON.stringify(pointers));
    }
    pointerSettingsElement.appendChild(colorInput);
    let coords = document.createElement("div");
    let lat = pointer.latitude.toFixed(15).toString()
    let lon = pointer.longitude.toFixed(15).toString()
    if (lat.length > lon.length) {
        lon = lon.padEnd(lat.length, "0");
    }
    else if (lon.length > lat.length) {
        lat = lat.padEnd(lon.length, "0");
    }
    coords.innerHTML = `<div><span>Lat: </span><input id=p${id}-lat type='number' min=-90 max=90 value=${lat}></div><div><span>Lon: </span><input id=p${id}-lon type='number' min=-180 max=180 value=${lon}></div>`;

    pointerSettingsElement.appendChild(coords);
    let del = bin.cloneNode(true);
    del.onclick = () => removePointer(id);
    pointerSettingsElement.appendChild(del);
    pointersContainer.insertBefore(pointerSettingsElement, addPointerButton);

    document.getElementById(`p${id}-lat`).onfocusout = () => changeLat(id);
    document.getElementById(`p${id}-lon`).onfocusout = () => changeLon(id);

    activeIcons.push(pointer.icon);
}

function newPointer(icon) {
    document.querySelector("#icon-error").innerHTML = ""
    
    if (activeIcons.includes(icon)) {
        document.querySelector("#icon-error").innerHTML = "Icon already in use!";
        return;
    }

    let pointer = {
        icon: icon,
        latitude: user.latitude,
        longitude: user.longitude,
        color: "#FFFFFF"
    }
    
    key = pointers.length;

    pointers.push(pointer);
    localStorage.setItem("compassPointers", JSON.stringify(pointers));
    addPointer(key, pointer);
    document.querySelector("#icon-menu").style.display = "none";
    document.querySelector("#icon-search").value = "";
    document.querySelector("#icon-error").innerHTML = "";
    updateDistance();
    populateIcons();
}

function removePointer(id) {
    if(minPointer === pointers[id]) {
        minPointer = null;
        minPointerColor = null;
        minDistance = null;
    }
    document.querySelector(`#p${id}`).remove();
    document.querySelector(`#p${id}-settings`).remove();
    for (let i = id + 1; i < pointers.length; i++) {
        document.querySelector(`#p${i}`).id = `p${i-1}`;
        document.querySelector(`#p${i}-settings`).id = `p${i-1}-settings`;
    }
    activeIcons = activeIcons.filter(icon => icon !== pointers[id].icon);
    pointers.splice(id, 1);
    localStorage.setItem("compassPointers", JSON.stringify(pointers));
    updateDistance();
}

document.querySelector("#settings").onclick = () => document.querySelector("#settings-menu").style.display = "flex";
document.querySelector("#close-settings").onclick = () => document.querySelector("#settings-menu").style.display = "none";
document.querySelector("#close-icons").onclick = () => {
    document.querySelector("#icon-menu").style.display = "none";
    document.querySelector("#icon-search").value = "";
    populateIcons();
    document.querySelector("#icon-error").innerHTML = "";
};
document.querySelector("#add-pointer").onclick = () => document.querySelector("#icon-menu").style.display = "flex";

function populateIcons() {
    let search = document.querySelector("#icon-search").value;
    let newIcon = document.createElement("i");
    newIcon.classList.add("fa-solid");
    let iconsContainer = document.querySelector("#icon-container");
    iconsContainer.innerHTML = "";

    for (let key in icons) {
        if (search === "" || icons[key].filter(icon => icon.includes(search)).length > 0) {
            let div = document.createElement("div");
            div.innerHTML = `<i class="fa-solid ${key}"></i>`;
            div.onclick = () => newPointer(key);
            iconsContainer.appendChild(div);
        }
    }
}

document.querySelector("#icon-search").oninput = populateIcons;

function changeLat(id) {
    const latInput = document.querySelector(`#p${id}-lat`);
    const latValue = parseFloat(latInput.value);

    if (isNaN(latValue) || latValue < -90 || latValue > 90) {
        latInput.value = pointers[id].latitude;
    }

    if (!latInput.value.includes(".")) {
        latInput.value += ".0";
    }

    let lat = document.querySelector(`#p${id}-lat`).value;
    let lon = document.querySelector(`#p${id}-lon`).value;

    if (lat.length > lon.length) {
        lon = lon.padEnd(lat.length, "0");
    }
    else if (lon.length > lat.length) {
        lat = lat.padEnd(lon.length, "0");
    }
    document.querySelector(`#p${id}-lat`).value = lat;
    document.querySelector(`#p${id}-lon`).value = lon;

    pointers[id].latitude = latValue;
    localStorage.setItem("compassPointers", JSON.stringify(pointers));
    updateDistance();
}

function changeLon(id) {
    const lonInput = document.querySelector(`#p${id}-lon`);
    const lonValue = parseFloat(lonInput.value);
    
    if (isNaN(lonValue) || lonValue < -180 || lonValue > 180) {
        lonInput.value = pointers[id].longitude;
    }

    if (!lonInput.value.includes(".")) {
        lonInput.value += ".0";
    }

    let lat = document.querySelector(`#p${id}-lat`).value;
    let lon = document.querySelector(`#p${id}-lon`).value;
    if (lon.length > lat.length) {
        lat = lat.padEnd(lon.length, "0");
    }
    else if (lat.length > lon.length) {
        lon = lon.padEnd(lat.length, "0");
    }

    document.querySelector(`#p${id}-lat`).value = lat;
    document.querySelector(`#p${id}-lon`).value = lon;

    pointers[id].longitude = lonValue;
    localStorage.setItem("compassPointers", JSON.stringify(pointers));
    updateDistance();
}

// Prevent double-tap to zoom
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Prevent pinch-to-zoom
document.addEventListener('gesturestart', function(event) {
    event.preventDefault();
});

// Additional safety: prevent zooming with touchmove events
document.addEventListener('touchmove', function(event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });