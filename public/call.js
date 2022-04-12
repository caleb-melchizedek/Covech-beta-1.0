'use strict';

const baseURL = "/"

let localVideo = document.querySelector('#localVideo');
let remoteVideo = document.querySelector('#remoteVideo');

let onlineUsersList = document.querySelector('#onlineUsers')

let otherUser;
let remoteRTCMessage;

let iceCandidatesFromCaller = [];
let peerConnection;
let remoteStream;
let localStream;

const codecPreferences = document.querySelector('#codecPreferences');
const bandwidthSelect = document.querySelector('#bandwidthSelect');
const bandwidthSelector = document.querySelector('select#bandwidth');
const dataStats = document.querySelector('#dataStats');

const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
  'setCodecPreferences' in window.RTCRtpTransceiver.prototype;

  const resoCOnstrs={
    qvgaConstraints: {
        video: {width: {exact: 320}, height: {exact: 240}}
    },
    vgaConstraints: {
        video: {width: {exact: 640}, height: {exact: 480}}
    },
    hdConstraints: {
        video: {width: {exact: 1280}, height: {exact: 720}}
    },
    fullHdConstraints :{
        video: {width: {exact: 1920}, height: {exact: 1080}}
    },
    televisionFourKConstraints: {
        video: {width: {exact: 3840}, height: {exact: 2160}}
    }
}
 
  

let callInProgress = false;



//event from html
function call() {
    let userToCall = document.getElementById("callName").value;
    otherUser = userToCall;
    codecPreferences.disabled = true;
    beReady()
        .then(bool => {
            processCall(userToCall)
        })
    bandwidthSelect.style.display="";
    dataStats.style.display="flex";
}

//event from html
function answer() {
    //do the event firing
    codecPreferences.disabled = true;
    beReady()
        .then(bool => {
            processAccept();
        })

    document.getElementById("answer").style.display = "none";
    bandwidthSelect.style.display="";
    dataStats.style.display="flex";
    
}

let pcConfig = {
    "iceServers":
        [
            // { "url": "stun:stun.jap.bloggernepal.com:5349" },
            // {
            //     "url": "turn:turn.jap.bloggernepal.com:5349",
            //     "username": "guest",
            //     "credential": "somepassword"
            // },
            // {"url":'stun:stun.l.google.com:19302'},
            // {"url": "stun:stun.numb.viagenie.ca"},

            {
                urls: "turn:numb.viagenie.ca",
                username: " codeprogrammer25112018@gmail.com",
                credential: "CodeProgrammer25112018"
            }
        ]
};

// Set up audio and video regardless of what devices are present.
// let sdpConstraints = {
//     offerToReceiveAudio: true,
//     offerToReceiveVideo: true
// };

/////////////////////////////////////////////

let socket;
function connectSocket() {
    socket = io.connect(baseURL, {
        query: {
            name: myName
        }
    });
    socket.on('updateUsersOnline',data=>{
        updateOnlineUsersList(data.usersOnline)
    })
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

    socket.on('remoteICEcandidate', data => {
        console.log("GOT remote ICE candidate");
        let message = data.rtcMessage;
        console.log(message.candidate);

        let candidate = new RTCIceCandidate(
           message.candidate
        );
            console.log('remote ICE candidate: '+candidate);
        // peerConnection.addIceCandidate(candidate);
        // console.log("ICE candidate Added");

        if (peerConnection) {
            peerConnection.addIceCandidate(candidate);
            console.log("ICE candidate Added");
        } else {
            console.log("ICE candidate Pushed");
            iceCandidatesFromCaller.push(candidate);
            console.log(iceCandidatesFromCaller);
        }

    })

    socket.on("userDisconected",(data)=>{

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




//functions

function login() {
    let userName = document.getElementById("userNameInput").value;
    myName = userName;
    document.getElementById("userName").style.display = "none";
    document.getElementById("call").style.display = "block";

    document.getElementById("nameHere").innerHTML = userName;
    document.getElementById("userInfo").style.display = "block";

    connectSocket();

    document.getElementById("codecs").style.display = "";
    showCodecsAvailable();
    document.getElementById("onlineUserContainer").style.display = "";
    
}

function updateOnlineUsersList(list){
    while (onlineUsersList.firstChild) {
        onlineUsersList.removeChild(onlineUsersList.firstChild);
      }
    console.log(list); 

    list.forEach(e=>{
        let userDiv = document.createElement('div');
        let pfImg = document.createElement('img');
        pfImg.src='/profile.png';
        
        userDiv.setAttribute('class','onlineUserDiv');
        userDiv.addEventListener('click',function(e){
            document.querySelector('#callName').value= userDiv.innerText
        })

        onlineUsersList.appendChild(userDiv);
        userDiv.innerHTML=`${e}`;
        userDiv.innerText=`${e}`;
        userDiv.appendChild(pfImg);
    });
}

function beReady() {
    return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;

            return createConnectionAndAddStream(stream)
        })
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });
        
}


function processCall(userName) {
    peerConnection.createOffer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        console.log(sessionDescription);
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
                console.log("Adding ICE candidate From queue");
                try {
                    peerConnection.addIceCandidate(candidate).then(() => {
                        console.log(peerConnection.iceCandidate);
                    }).catch(error => {
                        console.log(error);
                    })
                } catch (error) {
                    console.log(error);
                }
            }
            // iceCandidatesFromCaller = [];
            // console.log("ICE candidate queue cleared");
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

function createConnectionAndAddStream(stream) {
    createPeerConnection();
    stream.getTracks().forEach(function (track) {
    peerConnection.addTrack(track,stream)});

    return true;
}

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(pcConfig);
        // peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.ontrack = handleRemoteStreamAdded;

        // peerConnection.addEventListener("icecandidate",(e)=> {handleIceCandidate(e)});
        // peerConnection.addEventListener("track",(e)=>{handleRemoteStreamAdded(e)} );

        peerConnection.addEventListener=("removestream", (e)=>{handleRemoteStreamRemoved(e)});
        console.log('Created RTCPeerConnnection');
        return;
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function toggleDataStats(){
    let graphs=document.querySelector(".dataStatsContainer")
    console.log(graphs.style)
    if(graphs.style.display==="none"){
        graphs.style.display="block"
    }else{
        graphs.style.display="none"
    }
}
function showCodecsAvailable(){
    if (supportsSetCodecPreferences) {
    const {codecs} = RTCRtpSender.getCapabilities('video');
    codecs.forEach(codec => {
      if (['video/red', 'video/ulpfec', 'video/rtx'].includes(codec.mimeType)) {
        return;
      }
      const option = document.createElement('option');
      option.value = (codec.mimeType + ' ' + (codec.sdpFmtpLine || '')).trim();
      option.innerText = option.value;
      codecPreferences.appendChild(option);
    });
    codecPreferences.disabled = false;
  }
}



/**
 * 
 * @param {Object} data 
 * @param {number} data.user - the other user //either callee or caller 
 * @param {Object} data.rtcMessage - iceCandidate data 
 */


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

        stream.getTracks().forEach(function (track) {
        peerConnection.addTrack(track,stream)});

        console.log(peerConnection)
        
        
    })
    .catch(function (e) {
        alert('getUserMedia() error: ' + e.name + e.message);
    });
}







function answerCall(data) {
    //to answer a call
    socket.emit("answerCall", data);
    callProgress();
    
}


/////////////////////////////////////////////////////////



function handleIceCandidate(event) {
// example reference code
    // if (e.candidate) {
    //     const payload = {
    //         target: otherUser.current,
    //         candidate: e.candidate,
    //     }
    //     socketRef.current.emit("ice-candidate", payload);
    // }


    if (event.candidate) {
        console.log("Local ICE candidate",event.candidate);
        const payload = {
            user: otherUser,
            rtcMessage: {
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate
            }
        }
        socket.emit("localICEcandidate", payload)

    } else {
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event) {
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
    console.log('Remote stream added.');
    // let inboundStream =null
    //     if (ev.streams && event.streams[0]) {
    //         remoteStream = event.streams[0];
    // remoteVideo.srcObject = remoteStream;
    //     } else {
    //       if (!inboundStream) {
    //         inboundStream = new MediaStream();
    //         videoElem.srcObject = inboundStream;
    //       }
    //       inboundStream.addTrack(ev.track);
    //     }
    //   ;

    
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
    codecPreferences.disabled = true;
}

    
// bandwidth Regulator code

let bitrateGraph;
let bitrateSeries;
let headerrateSeries;

let packetGraph;
let packetSeries;

let lastResult;

let lastRemoteStart = 0;




bitrateSeries = new TimelineDataSeries();
bitrateGraph = new TimelineGraphView('bitrateGraph', 'bitrateCanvas');
bitrateGraph.updateEndDate();

headerrateSeries = new TimelineDataSeries();
headerrateSeries.setColor('green');

packetSeries = new TimelineDataSeries();
packetGraph = new TimelineGraphView('packetGraph', 'packetCanvas');
packetGraph.updateEndDate();


// set and monitor bandwidth.

bandwidthSelector.onchange = () => {
    bandwidthSelector.disabled = true;
    const bandwidth = bandwidthSelector.options[bandwidthSelector.selectedIndex].value;
  
    // In Chrome, use RTCRtpSender.setParameters to change bandwidth without
    // (local) renegotiation. Note that this will be within the envelope of
    // the initial maximum bandwidth negotiated via SDP.
    if ((adapter.browserDetails.browser === 'chrome' ||
         adapter.browserDetails.browser === 'safari' ||
         adapter.browserDetails.browser === 'edge' ||
         (adapter.browserDetails.browser === 'firefox' &&
          adapter.browserDetails.version >= 64)) &&
        'RTCRtpSender' in window &&
        'setParameters' in window.RTCRtpSender.prototype) {
      const sender = peerConnection.getSenders()[0];
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      if (bandwidth === 'unlimited') {
        delete parameters.encodings[0].maxBitrate;
      } else {
        parameters.encodings[0].maxBitrate = bandwidth * 1000;
      }
      sender.setParameters(parameters)
          .then(() => {
            bandwidthSelector.disabled = false;
          })
          .catch(e => console.error(e));
      return;
    }
    // Fallback to the SDP munging with local renegotiation way of limiting
    // the bandwidth.
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
          const desc = {
            type: peerConnection.remoteDescription.type,
            sdp: bandwidth === 'unlimited' ?
            removeBandwidthRestriction(peerConnection.remoteDescription.sdp) :
            updateBandwidthRestriction(peerConnection.remoteDescription.sdp, bandwidth)
          };
          console.log('Applying bandwidth restriction to setRemoteDescription:\n' +
          desc.sdp);
          return peerConnection.setRemoteDescription(desc);
        })
        .then(() => {
          bandwidthSelector.disabled = false;
        })
        .catch(onSetSessionDescriptionError);
  };





function updateBandwidthRestriction(sdp, bandwidth) {
    let modifier = 'AS';
    if (adapter.browserDetails.browser === 'firefox') {
      bandwidth = (bandwidth >>> 0) * 1000;
      modifier = 'TIAS';
    }
    if (sdp.indexOf('b=' + modifier + ':') === -1) {
      // insert b= after c= line.
      sdp = sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
    } else {
      sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
    }
    return sdp;
  }
  
  function removeBandwidthRestriction(sdp) {
    return sdp.replace(/b=AS:.*\r\n/, '').replace(/b=TIAS:.*\r\n/, '');
  }
  
  // query getStats every second
  window.setInterval(() => {
    if (!peerConnection) {
      return;
    }
    const sender = peerConnection.getSenders()[0];
    if (!sender) {
      return;
    }
    sender.getStats().then(res => {
      res.forEach(report => {
        let bytes;
        let headerBytes;
        let packets;
        if (report.type === 'outbound-rtp') {
          if (report.isRemote) {
            return;
          }
          const now = report.timestamp;
          bytes = report.bytesSent;
          headerBytes = report.headerBytesSent;
  
          packets = report.packetsSent;
          if (lastResult && lastResult.has(report.id)) {
            // calculate bitrate
            const bitrate = 8 * (bytes - lastResult.get(report.id).bytesSent) /
              (now - lastResult.get(report.id).timestamp);
            const headerrate = 8 * (headerBytes - lastResult.get(report.id).headerBytesSent) /
              (now - lastResult.get(report.id).timestamp);
  
            // append to chart
            bitrateSeries.addPoint(now, bitrate);
            headerrateSeries.addPoint(now, headerrate);
            bitrateGraph.setDataSeries([bitrateSeries, headerrateSeries]);
            bitrateGraph.updateEndDate();
            
            let packetrate =packets - lastResult.get(report.id).packetsSent; 
            // calculate number of packets and append to chart
            packetSeries.addPoint(now, packetrate);
            packetGraph.setDataSeries([packetSeries]);
            packetGraph.updateEndDate();
          }
        }
      });
      lastResult = res;
    });
  }, 1000);
  
  // Return a number between 0 and maxValue based on the input number,
  // so that the output changes smoothly up and down.
  function triangle(number, maxValue) {
    const modulus = (maxValue + 1) * 2;
    return Math.abs(number % modulus - maxValue);
  }