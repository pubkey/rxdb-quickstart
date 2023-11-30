import {
    RxCollection,
    createRxDatabase,
    defaultHashSha256,
    addRxPlugin
} from 'rxdb/plugins/core';
import {
    getRxStorageDexie
} from 'rxdb/plugins/storage-dexie';
import {
    replicateWebRTC,
    getConnectionHandlerSimplePeer
} from 'rxdb/plugins/replication-webrtc';
import {
    wrappedValidateAjvStorage
} from 'rxdb/plugins/validate-ajv';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);
import { getRoomId } from './room.js';
import { TodoDocType, todoSchema } from './todo.schema.js';
import { add as addUnload } from 'unload';

let dbPromise = (async () => {
    const roomId = getRoomId();
    const roomHash = await defaultHashSha256(roomId);
    const database = await createRxDatabase<{
        todos: RxCollection<TodoDocType, {}>
    }>({
        name: 'mydb-' + roomHash.substring(0, 10),
        storage: wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        })
    });

    await database.addCollections({
        todos: {
            schema: todoSchema
        }
    });

    // start p2p replication for all collections
    Object.values(database.collections).forEach(async (collection) => {
        const topic = (await defaultHashSha256('rxdb-todo-' + collection.name + roomId)).substring(0, 10);
        const replicatioState = await replicateWebRTC({
            collection,
            connectionHandlerCreator: getConnectionHandlerSimplePeer({}),
            topic: topic,
            secret: 'lol',
            pull: {},
            push: {}
        });
        replicatioState.error$.subscribe((err: any) => {
            console.log('replication error:');
            console.dir(err);
        });
        replicatioState.peerStates$.subscribe(s => {
            console.log('new peer states:');
            console.dir(s);
        });
        addUnload(() => replicatioState.cancel());
    })

    return database;
})();



export function getDatabase() {
    return dbPromise;
}
