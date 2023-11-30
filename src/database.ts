import {
    RxCollection,
    createRxDatabase,
    defaultHashSha256,
    addRxPlugin,
    randomCouchString,
    RxDocument
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

export type TodoDocType = {
    id: string;
    name: string;
    state: 'open' | 'done';
    lastChange: number;
}
export type RxTodoDocument = RxDocument<TodoDocType>;

export const databasePromise = (async () => {
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
            schema: {
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        maxLength: 20
                    },
                    name: {
                        type: 'string'
                    },
                    state: {
                        type: 'string',
                        enum: [
                            'open',
                            'done'
                        ],
                        maxLength: 10
                    },
                    lastChange: {
                        type: 'number',
                        minimum: 1701307494132,
                        maximum: 2701307494132,
                        multipleOf: 1
                    }
                },
                required: ['id', 'name', 'state', 'lastChange'],
                indexes: [
                    'state',
                    ['state', 'lastChange']
                ]
            }
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
    })

    return database;
})();


export function getRoomId(): string {
    let hash = window.location.hash;
    if (!hash || hash.length < 5) {
        hash = randomCouchString(12);
        window.location.hash = hash;
        window.location.reload();
    }
    return hash;
}
