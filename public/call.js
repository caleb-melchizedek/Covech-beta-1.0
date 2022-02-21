'use strict';

const baseURL = "/"

let localVideo = document.querySelector('#localVideo');
let remoteVideo = document.querySelector('#remoteVideo');

let otherUser;
let remoteRTCMessage;

let iceCandidatesFromCaller = [];
let peerConnection;
let remoteStream;
let localStream;

const qvgaConstraints = {
    video: {width: {exact: 320}, height: {exact: 240}}
  };
  
  const vgaConstraints = {
    video: {width: {exact: 640}, height: {exact: 480}}
  };
  
  const hdConstraints = {
    video: {width: {exact: 1280}, height: {exact: 720}}
  };
  
  const fullHdConstraints = {
    video: {width: {exact: 1920}, height: {exact: 1080}}
  };
  
  const televisionFourKConstraints = {
    video: {width: {exact: 3840}, height: {exact: 2160}}
  };
  
 
  

let callInProgress = false;



//event from html
function call() {
    let userToCall = document.getElementById("callName").value;
    otherUser = userToCall;

    beReady()
        .then(bool => {
            processCall(userToCall)
        })
}

//event from html
function answer() {
    //do the event firing

    beReady()
        .then(bool => {
            processAccept();
        })

    document.getElementById("answer").style.display = "none";
}

let pcConfig = {
    "iceServers":
        [
            { "url": "stun:stun.jap.bloggernepal.com:5349" },
            {
                "url": "turn:turn.jap.bloggernepal.com:5349",
                "username": "guest",
                "credential": "somepassword"
            }
        ]
};

// Set up audio and video regardless of what devices are present.
let sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

/////////////////////////////////////////////

let socket;
function connectSocket() {
    socket = io.connect(baseURL, {
        query: {
            name: myName
        }
    });

    socket.on('newCall', data => {
        //when other called you
        console.log(data);
        //show answer button

        otherUser = data.caller;
        remoteRTCMessage = data.rtcMessage

        // document.getElementById("profileImageA").src = baseURL + callerProfile.image;
        document.getElementById("callerName").innerHTML = otherUser;
        document.getElementById("call").style.display = "none";
        document.getElementById("answer").style.display = "block";
    })

    socket.on('callAnswered', data => {
        //when other accept our call
        remoteRTCMessage = data.rtcMessage
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));

        document.getElementById("calling").style.display = "none";

        console.log("Call Started. They Answered");
        // console.log(pc);

        callProgress()
    })

    socket.on('ICEcandidate', data => {
        // console.log(data);
        console.log("GOT ICE candidate");

        let message = data.rtcMessage

        let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });

        if (peerConnection) {
            console.log("ICE candidate Added");
            peerConnection.addIceCandidate(candidate);
        } else {
            console.log("ICE candidate Pushed");
            iceCandidatesFromCaller.push(candidate);
        }

    })

}

/**
 * 
 * @param {Object} data 
 * @param {number} data.name - the name of the user to call
 * @param {Object} data.rtcMessage - the rtc create offer object
 */
function sendCall(data) {
    //to send a call
    console.log("Send Call");
    socket.emit("call", data);

    document.getElementById("call").style.display = "none";
    // document.getElementById("profileImageCA").src = baseURL + otherUserProfile.image;
    document.getElementById("otherUserNameCA").innerHTML = otherUser;
    document.getElementById("calling").style.display = "block";
}

/**
 * 
 * @param {Object} data 
 * @param {number} data.caller - the caller name
 * @param {Object} data.rtcMessage - answer rtc sessionDescription object
 */
function answerCall(data) {
    //to answer a call
    socket.emit("answerCall", data);
    callProgress();
}

/**
 * 
 * @param {Object} data 
 * @param {number} data.user - the other user //either callee or caller 
 * @param {Object} data.rtcMessage - iceCandidate data 
 */
function sendICEcandidate(data) {
    //send only if we have caller, else no need to
    console.log("Send ICE candidate");
    socket.emit("ICEcandidate", data)
}

function changeResolution(reso){
    let cnstrn
    if(reso=="qvga"){
        console.log(qvgaConstraints);
        cnstrn=qvgaConstraints
    }
    else if(reso=="vga"){
        console.log(vgaConstraints);
        cnstrn=vgaConstraints

    }
    else if(reso=="hd"){
        console.log(hdConstraints);
        cnstrn=hdConstraints
    }
    else if(reso=="fhd"){
        console.log(fullHdConstraints);
        cnstrn=fullHdConstraints

    }
    else if(reso=="4k"){
        console.log(televisionFourKConstraints);
        cnstrn=televisionFourKConstraints

    }
    navigator.mediaDevices.getUserMedia(cnstrn)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        // createConnectionAndAddStream()
        console.log(peerConnection)
        // stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        peerConnection.removeStream(localStream);
        // peerConnection.addStream(localStream);
        
    })
    .catch(function (e) {
        alert('getUserMedia() error: ' + e.name + e.message);
    });
}


function beReady() {
    return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;

            return createConnectionAndAddStream()
        })
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });
}

function createConnectionAndAddStream() {
    createPeerConnection();
    peerConnection.addStream(localStream);
    return true;
}

function processCall(userName) {
    peerConnection.createOffer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        sendCall({
            name: userName,
            rtcMessage: sessionDescription
        })
    }, (error) => {
        console.log("Error");
    });
}

function processAccept() {

    peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
    peerConnection.createAnswer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);

        if (iceCandidatesFromCaller.length > 0) {
            //I am having issues with call not being processed in real world (internet, not local)
            //so I will push iceCandidates I received after the call arrived, push it and, once we accept
            //add it as ice candidate
            //if the offer rtc message contains all thes ICE candidates we can ingore this.
            for (let i = 0; i < iceCandidatesFromCaller.length; i++) {
                //
                let candidate = iceCandidatesFromCaller[i];
                console.log("ICE candidate Added From queue");
                try {
                    peerConnection.addIceCandidate(candidate).then(done => {
                        console.log(done);
                    }).catch(error => {
                        console.log(error);
                    })
                } catch (error) {
                    console.log(error);
                }
            }
            iceCandidatesFromCaller = [];
            console.log("ICE candidate queue cleared");
        } else {
            console.log("NO Ice candidate in queue");
        }

        answerCall({
            caller: otherUser,
            rtcMessage: sessionDescription
        })

    }, (error) => {
        console.log("Error");
    })
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(pcConfig);
        // peerConnection = new RTCPeerConnection();
        peerConnection.addEventListener("icecandidate",(e)=> {handleIceCandidate(e)});
        peerConnection.addEventListener("addstream",(e)=>{handleRemoteStreamAdded(e)} );
        peerConnection.addEventListener=("removestream", (e)=>{handleRemoteStreamRemoved(e)});
        console.log('Created RTCPeerConnnection');
        return;
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function handleIceCandidate(event) {
    // console.log('icecandidate event: ', event);
    if (event.candidate) {
        console.log("Local ICE candidate");
        // console.log(event.candidate.candidate);

        sendICEcandidate({
            user: otherUser,
            rtcMessage: {
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }
        })

    } else {
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
    remoteVideo.srcObject = null;
    localVideo.srcObject = null;
}

window.onbeforeunload = function () {
    if (callInProgress) {
        stop();
    }
};


function stop() {
    localStream.getTracks().forEach(track => track.stop());
    callInProgress = false;
    peerConnection.close();
    peerConnection = null;
    document.getElementById("call").style.display = "block";
    document.getElementById("answer").style.display = "none";
    document.getElementById("inCall").style.display = "none";
    document.getElementById("calling").style.display = "none";
    document.getElementById("endVideoButton").style.display = "none"
    otherUser = null;
}

function callProgress() {

    document.getElementById("videos").style.display = "block";
    document.getElementById("otherUserNameC").innerHTML = otherUser;
    document.getElementById("inCall").style.display = "block";

    callInProgress = true;
}


// set and monitor bandwidth.

// bandwidthSelector.onchange = () => {
//     bandwidthSelector.disabled = true;
//     const bandwidth = bandwidthSelector.options[bandwidthSelector.selectedIndex].value;
  
//     // In Chrome, use RTCRtpSender.setParameters to change bandwidth without
//     // (local) renegotiation. Note that this will be within the envelope of
//     // the initial maximum bandwidth negotiated via SDP.
//     if ((adapter.browserDetails.browser === 'chrome' ||
//          adapter.browserDetails.browser === 'safari' ||
//          (adapter.browserDetails.browser === 'firefox' &&
//           adapter.browserDetails.version >= 64)) &&
//         'RTCRtpSender' in window &&
//         'setParameters' in window.RTCRtpSender.prototype) {
//       const sender = pc1.getSenders()[0];
//       const parameters = sender.getParameters();
//       if (!parameters.encodings) {
//         parameters.encodings = [{}];
//       }
//       if (bandwidth === 'unlimited') {
//         delete parameters.encodings[0].maxBitrate;
//       } else {
//         parameters.encodings[0].maxBitrate = bandwidth * 1000;
//       }
//       sender.setParameters(parameters)
//           .then(() => {
//             bandwidthSelector.disabled = false;
//           })
//           .catch(e => console.error(e));
//       return;
//     }
//     // Fallback to the SDP munging with local renegotiation way of limiting
//     // the bandwidth.
//     pc1.createOffer()
//         .then(offer => pc1.setLocalDescription(offer))
//         .then(() => {
//           const desc = {
//             type: pc1.remoteDescription.type,
//             sdp: bandwidth === 'unlimited' ?
//             removeBandwidthRestriction(pc1.remoteDescription.sdp) :
//             updateBandwidthRestriction(pc1.remoteDescription.sdp, bandwidth)
//           };
//           console.log('Applying bandwidth restriction to setRemoteDescription:\n' +
//           desc.sdp);
//           return pc1.setRemoteDescription(desc);
//         })
//         .then(() => {
//           bandwidthSelector.disabled = false;
//         })
//         .catch(onSetSessionDescriptionError);
//   };