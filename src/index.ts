import { randomToken, defaultHashSha256 } from 'rxdb/plugins/core';
import { replicateWebRTC, getConnectionHandlerSimplePeer, SimplePeer } from 'rxdb/plugins/replication-webrtc';
import { createTodoDatabase, TodoDocType } from './shared-database.js';
import { initTodoUI, getById } from './shared-ui.js';
import './style.css';

(async () => {
    // ensure roomId exists
    const roomId = window.location.hash;
    if (!roomId || roomId.length < 5) {
        window.location.hash = 'room-' + randomToken(10);
        window.location.reload();
    }
    const roomHash = await defaultHashSha256(roomId);

    const database = await createTodoDatabase('-' + roomHash.substring(0, 10));

    // update url in description text
    getById('copy-url').innerHTML = window.location.href;

    // setup WebRTC replication
    replicateWebRTC<TodoDocType, SimplePeer>({
        collection: database.todos,
        connectionHandlerCreator: getConnectionHandlerSimplePeer({}),
        topic: roomHash.substring(0, 10),
        pull: {},
        push: {},
    }).then(replicationState => {
        replicationState.error$.subscribe((err: any) => {
            console.log('replication error:');
            console.dir(err);
        });
        replicationState.peerStates$.subscribe(s => {
            console.log('new peer states:');
            console.dir(s);
        });
    });

    initTodoUI(database);
})();
