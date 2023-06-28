"use strict";

// Buttons
let callBtn = $("#callBtn");
let callBox = $("#callBox");
let answerBtn = $("#answerBtn");
let declineBtn = $("#declineBtn");

let sendTo = callBtn.data("user");
let pc, localStream;

// Video elements
const localVideo = $("#localVideo");
const remoteVideo = $("#remoteVideo");

// Media info
const mediaConst = {
    video: true
}

// What to receive from other client
const options = {
    offerToReceiveVideo: 1,
}

const getConn = () => {
    if (!pc) {
        pc = new RTCPeerConnection();
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
        console.log("Error -> " + error);
    }
}

const createOffer = async (sendTo) => {
    sendIceCandidate(sendTo);
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

callBtn.on("click", async () => {
    await getCam();
    send("is-client-ready", null, sendTo);
});

conn.onopen = e => {
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
                send("client-already-oncall");
            } else {
                // Display popup
                displayCall();

                answerBtn.on("click", () => {
                    callBox.addClass("hidden");
                    $(".wrapper").removeClass("glass");
                    send("client-is-ready", null, sendTo);
                });

                declineBtn.on("click", () => {
                    send("client-rejected", null, sendTo);
                });
            }
            break;
        case "client-offer":
            if (!pc) {
                getConn();
            }
            if (!localStream) {
                await getCam();
            }
            await createAnswer(sendTo, data);
            break;
        case "client-answer":
            if (pc.localDescription) {
                await pc.setRemoteDescription(data);
            }
            break;
        case "client-is-ready":
            console.log("Yo") 
            await createOffer(sendTo);
            break;
        case "client-already-oncall":
            // Display popup right here
            setTimeout("window.location.reload()", 2000);
            break;
        case "client-rejected":
            alert("Client rejected the call.");
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

