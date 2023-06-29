"use strict";

// Buttons
let callBtn = $("#callBtn");
let callBox = $("#callBox");
let answerBtn = $("#answerBtn");
let declineBtn = $("#declineBtn");
let callTimer = $("#callTimer");
let alertBox = $("#alertBox");

let sendTo = callBtn.data("user");
let pc, localStream;

// Video elements
const localVideo = document.querySelector("#localVideo");
const remoteVideo = document.querySelector("#remoteVideo");

// Media info
const mediaConst = {
    video: true,
    audio: true
};

// Info about stun servers
const config = {
    iceServers: [
        {urls: "stun:stun1.l.google.com:19302"},
    ]
};

// What to receive from other client
const options = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1
};

const getConn = () => {
    if (!pc) {
        pc = new RTCPeerConnection(config);
    }
}

// Ask for media input
const getCam = async () => {
    let mediaStream;

    try {
        if (!pc) {
            getConn();
        }

        mediaStream = await navigator.mediaDevices.getUserMedia(mediaConst);
        localVideo.srcObject = mediaStream;
        localStream = mediaStream;
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    } catch (error) {
        console.log(error);
    }
}

const createOffer = async (sendTo) => {
    await sendIceCandidate(sendTo);
    await pc.createOffer(options);
    await pc.setLocalDescription(pc.localDescription);
    send("client-offer", pc.localDescription, sendTo);
};

const createAnswer = async (sendTo, data) => {
    if (!pc) {
        await getConn();
    }
    if (!localStream) {
        await getCam();
    }

    sendIceCandidate(sendTo);
    await pc.setRemoteDescription(data);
    await pc.createAnswer();
    await pc.setLocalDescription(pc.localDescription);

    send("client-answer", pc.localDescription, sendTo);
};

const sendIceCandidate = (sendTo) => {
    pc.onicecandidate = e => {
        if (e.candidate !== null) {
            // Send ice candidate to other client
            send("client-candidate", e.candidate, sendTo);
        }
    };

    pc.ontrack = e => {
        $("#video").removeClass("hidden");
        $("#profile").addClass("hidden");
        remoteVideo.srcObject = e.streams[0];
    }
};

const hangUp = () => {
    send("client-hangup", null, sendTo);
    pc.close();
    pc = null;
}

callBtn.on("click", async () => {
    await getCam();
    send("is-client-ready", null, sendTo);
});

$("#hangupBtn").on("click", () => {
    hangUp();
    location.reload();
});

conn.onopen = () => {
    console.log("connected to websocket")
};

conn.onmessage = async e => {
    let message = JSON.parse(e.data);
    let by = message.by;
    let data = message.data;
    let type = message.type;
    let profileImage = message.profileImage;
    let username = message.username;

    $("#username").text(username);
    $("#profileImage").attr("src", profileImage);

    switch (type) {
        case "client-candidate":
            if (pc.localDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data));
            }
            break;
        case "is-client-ready":
            if (!pc) {
                await getConn();
            }
            if (pc.iceConnectionState === "connected") {
                send("client-already-oncall", null, by);
            } else {
                // Display popup
                displayCall();

                if (window.location.href.indexOf(username) > -1) {
                    answerBtn.on("click", () => {
                        callBox.addClass("hidden");
                        $(".wrapper").removeClass("glass");
                        send("client-is-ready", null, sendTo);
                    });
                } else {
                    answerBtn.on("click", () => {
                        callBox.addClass("hidden");
                        redirectToCall(username, by);
                    });
                }

                declineBtn.on("click", () => {
                    send("client-rejected", null, sendTo);
                    location.reload();
                });
            }
            break;
        case "client-offer":
            await createAnswer(sendTo, data);
            callTimer.timer({format: "%m:%s"});
            break;
        case "client-answer":
            if (pc.localDescription) {
                await pc.setRemoteDescription(data);
                callTimer.timer({format: "%m:%s"});
            }
            break;
        case "client-is-ready":
            await createOffer(sendTo);
            break;
        case "client-already-oncall":
            // Display popup right here
            displayAlert(username, profileImage, "is on another call");
            setTimeout(() => window.location.reload(), 2000);
            break;
        case "client-rejected":
            displayAlert(username, profileImage, "is busy");
            setTimeout(() => window.location.reload(), 2000);
            break;
        case "client-hangup":
            // Display popup right here
            displayAlert(username, profileImage, "Disconnected the call");
            setTimeout(() => window.location.reload(), 2000);
            break;
    }
};

const send = (type, data, sendTo) => {
    conn.send(JSON.stringify({
        sendTo: sendTo,
        type: type,
        data: data
    }));
};

const displayCall = () => {
    callBox.removeClass("hidden");
    $(".wrapper").addClass("glass");
};

const displayAlert = (username, profileImage, message) => {
    alertBox.find("#alertName").text(username);
    alertBox.find("#alertImage").attr("src", profileImage);
    alertBox.find("#alertMessage").text(message);

    alertBox.removeClass("hidden");
    $(".wrapper").addClass("glass");
    $("#video").addClass("hidden");
    $("#profile").removeClass("hidden");
};

const redirectToCall = (username, sendTo) => {
    if (window.location.href.indexOf(username) === -1) {
        sessionStorage.setItem("redirect", "true");
        sessionStorage.setItem("sendTo", sendTo);
        window.location.href = "/Video-Chat-Application/".concat(username);
    }
};

if (sessionStorage.getItem("redirect") === "true") {
    sendTo = sessionStorage.getItem("sendTo");

    let watForWs = setInterval(() => {
        if (conn.readyState === 1) {
            send("client-is-ready", null, sendTo);
            clearInterval(watForWs);
        }
    }, 500);

    sessionStorage.removeItem("redirect");
    sessionStorage.removeItem("sendTo");
}

// pc.oniceconnectionstatechange = () => {
//     if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
//         // User disconnected or lost connection
//         location.reload();
//     }
// };