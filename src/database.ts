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
import { getRoomId } from './room.js';
import { TodoDocType, todoSchema } from './schemas/todo.schema.js';


import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);

let dbPromise = (async () => {
    const roomId = getRoomId();
    const roomHash = await defaultHashSha256(roomId);

    console.log('... 1');

    const database = await createRxDatabase<{
        todos: RxCollection<TodoDocType, {}>
    }>({
        name: 'mydb-' + roomHash,
        storage: wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        }),
        multiInstance: true
    });
    console.log('... 2');

    await database.addCollections({
        todos: {
            schema: todoSchema
        }
    });
    console.log('... 3');


    // start p2p replication for all collections
    Object.values(database.collections).forEach(async (collection) => {
        const topic = (await defaultHashSha256('rxdb-todo-' + collection.name + roomId)).substring(0, 10);
        const replicatioState = await replicateWebRTC({
            collection,
            connectionHandlerCreator: getConnectionHandlerSimplePeer({}),
            topic: topic,
            secret: 'lol'
        });
        replicatioState.error$.subscribe((err: any) => {
            console.log('replication error:');
            console.dir(err);
        });
    })

    console.log('... 4');
    return database;
})();



export async function getDatabase() {
    return dbPromise;
}
