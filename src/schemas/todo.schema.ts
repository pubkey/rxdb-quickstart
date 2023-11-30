import {
    toTypedRxJsonSchema,
    ExtractDocumentTypeFromTypedRxJsonSchema,
    RxJsonSchema,
    RxDocument
} from 'rxdb';
export const todoSchemaLiteral = {
    title: 'todo schema',
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
} as const; // <- It is important to set 'as const' to preserve the literal type
const schemaTyped = toTypedRxJsonSchema(todoSchemaLiteral);

// aggregate the document type from the schema
export type TodoDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export type RxTodoDocument = RxDocument<TodoDocType>;

// create the typed RxJsonSchema from the literal typed object.
export const todoSchema: RxJsonSchema<TodoDocType> = todoSchemaLiteral;
