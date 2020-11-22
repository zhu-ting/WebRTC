window.addEventListener('load', () => {
    // Chat platform
    const chatTemplate = Handlebars.compile($('#chat-template').html());
    const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
    const chatEl = $('#chat');
    const formEl = $('.form');
    const messages = [];
    let username;

    const localImageEl = $('#local-image');
    const localVideoEl = $('#local-video');

    const remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
    const remoteVideoEl = $('#remote-videos');
    let remoteVideosCount = 0;

    formEl.form({
        fields: {
            roomName: 'empty',
            username: 'empty',
        }
    });

    const webrtc = new SimpleWebRTC({
        localVideoEl: 'local-video',
        remoteVideoEl: 'remote-videos',
        autoRequestMedia: true,
    });

    webrtc.on('localStream', () => {
        localImageEl.hide();
        localVideoEl.show();
    });

    $('.submit').on('click', (event) => {
        if (!formEl.form('is valid')){
            return false;
        }
        username = $('#username').val();
        const roomName = $('#roomName').val().toLowerCase();
        if (event.target.id === 'create-btn'){
            createRoom(roomName);
        } else {
            joinRoom(roomName);
        }
        return false;
    });

    const createRoom = (roomName) => {
        console.info(`Creating new room: ${roomName}`);
        webrtc.createRoom(roomName, (err, name) => {
            showChatRoom(name);
            postMessage(`${username} created chatroom`)
        });
    }

    const joinRoom = (roomName) => {
        console.log(`Joining Room: ${roomName}`);
        webrtc.joinRoom(roomName);
        showChatRoom(roomName);
        postMessage(`${username} joined chatroom`);
    }

    const postMessage = (message) => {
        const chatMessage = {
            username,
            message,
            postedOn: new Date().toLocaleString('en-GB'),
        };
        webrtc.sendToAll('chat', chatMessage);
        messages.push(chatMessage);
        $('#post-message').val(' ');
        updateChatMessages();
    };

    const showChatRoom = (room) => {
        formEl.hide();
        const html = chatTemplate({ room });
        chatEl.html(html);
        const postForm = $('form');
        postForm.form({
            message: 'empty',
        });
        $('#post-btn').on('click', event => {
            if (event.key === 13){
                const message = $('#post-message').val();
                postMessage(message);
            }
        });
    };

    const updateChatMessages = () => {
        const html = chatContentTemplate({ messages });
        const chatContentEl = $('#chat-content');
        chatContentEl.html(html);
        const scrollHeight = chatContentEl.prop('scrollHeight');
        chatContentEl.animate({ scrollTop: scrollHeight }, 'slow');
    };

    webrtc.connection.on('message', (data) => {
        if (data.type === 'chat'){
            const message = data.payload;
            message.push(message);
            updateChatMessages();
        }
    });

    webrtc.on('videoAdded', (video, peer) => {
        const id = webrtc.getDomId(peer);
        const html = remoteVideoTemplate({ id });
        if (remoteVideosCount === 0) {
            remoteVideoEl.html(html);
        } else {
            remoteVideoEl.append(html);
        }
        $('#${id}').html(video);
        $(`#${id} video`).addClass('ui image medium');
        remoteVideosCount += 1;
    });
});
