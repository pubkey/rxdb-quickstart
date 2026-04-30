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
    RxStorage,
    RxDatabase
} from 'rxdb/plugins/core';
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
export type TodoCollection = RxCollection<TodoDocType, {}>;
export type TodoDatabase = RxDatabase<{ todos: TodoCollection }>;

// set by webpack as global
declare var mode: 'production' | 'development';
console.log('mode: ' + mode);

let storage: RxStorage<any, any> = getRxStorageDexie();

export async function createTodoDatabase(dbNameSuffix?: string): Promise<TodoDatabase> {
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

    const suffix = dbNameSuffix || '';
    const database = await createRxDatabase<{ todos: TodoCollection }>({
        name: 'tpdp-' + RXDB_VERSION.replace(/\./g, '-') + suffix,
        storage
    });

    // handle replication conflicts (keep the document with the newest timestamp)
    const conflictHandler: RxConflictHandler<TodoDocType> = {
        isEqual(a, b) {
            return deepEqual(a, b);
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
                        enum: ['open', 'done'],
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
            state: 'open' as const
        }))
    );
    // TODO: remove cast once RxDBWebMCPPlugin provides TypeScript type augmentation for RxDatabase
    (database as any).registerWebMCP();
    return database;
}
