import {
    RxCollection,
    createRxDatabase,
    defaultHashSha256,
    addRxPlugin,
    randomToken,
    RxDocument,
    RxJsonSchema,
    deepEqual,
    RxConflictHandler,
    RXDB_VERSION,
    RxStorage
} from 'rxdb/plugins/core';
import { replicateWebRTC, getConnectionHandlerSimplePeer, SimplePeer } from 'rxdb/plugins/replication-webrtc';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBWebMCPPlugin } from 'rxdb/plugins/webmcp';
addRxPlugin(RxDBWebMCPPlugin);

export type TodoDocType = {
    id: string;
    name: string;
    state: 'open' | 'done';
    lastChange: number;
}
export type RxTodoDocument = RxDocument<TodoDocType>;

// set by webpack as global
declare var mode: 'production' | 'development';
console.log('mode: ' + mode);

let storage: RxStorage<any, any> = getRxStorageDexie();

export const databasePromise = (async () => {
    // import dev-mode plugins
    if (mode === 'development') {
        await import('rxdb/plugins/dev-mode').then(
            module => addRxPlugin(module.RxDBDevModePlugin)
        );
        await import('rxdb/plugins/validate-ajv').then(
            module => {
                storage = module.wrappedValidateAjvStorage({ storage });
            }
        );
    }

    // ensure roomId exists
    const roomId = window.location.hash;
    if (!roomId || roomId.length < 5) {
        window.location.hash = 'room-' + randomToken(10);
        window.location.reload();
    }
    const roomHash = await defaultHashSha256(roomId);
    const database = await createRxDatabase<{
        todos: RxCollection<TodoDocType, {}>
    }>({
        name: 'tpdp-' + RXDB_VERSION.replace(/\./g, '-') + '-' + roomHash.substring(0, 10),
        storage
    });

    // handle replication conflicts (keep the document with the newest timestamp)
    const conflictHandler: RxConflictHandler<TodoDocType> = {
        isEqual(a, b) {
            return deepEqual(
                a,
                b
            );
        },
        resolve(input) {
            const ret = input.newDocumentState.lastChange > input.realMasterState.lastChange
                ? input.newDocumentState
                : input.realMasterState;
            return Promise.resolve(ret);
        }
    };
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
                        minimum: 0,
                        maximum: 2701307494132,
                        multipleOf: 1
                    }
                },
                required: ['id', 'name', 'state', 'lastChange'],
                indexes: [
                    'state',
                    ['state', 'lastChange']
                ]
            } as RxJsonSchema<TodoDocType>,
            conflictHandler
        }
    });
    database.todos.preSave(d => {
        d.lastChange = Date.now();
        return d;
    }, true);
    await database.todos.bulkInsert(
        [
            'touch your 👃 with your 👅',
            'solve rubik\'s cube 🎲 blindfolded',
            'invent new 🍔'
        ].map((name, idx) => ({
            id: 'todo-' + idx,
            name,
            lastChange: 0,
            state: 'open'
        }))
    );
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
    // TODO: remove cast once RxDBWebMCPPlugin provides TypeScript type augmentation for RxDatabase
    (database as any).registerWebMCP();
    return database;
})();
