import {
    ensureNotFalsy,
    randomCouchString
} from 'rxdb/plugins/core';
import {
    RxTodoDocument,
    databasePromise
} from './database.js';

import './style.css';

async function start() {
    const database = await databasePromise;
    await addEventHandlers();
    await updateDisplayUrl();

    // render reactive todo list
    const $todoList = ensureNotFalsy(document.getElementById('todo-list'));
    database.todos.find({
        sort: [
            { state: 'desc' },
            { lastChange: 'desc' }
        ]
    }).$.subscribe(todos => {
        $todoList.innerHTML = '';
        todos.forEach(todo => $todoList.append(getHtmlByTodo(todo)));
    });
}


async function addEventHandlers() {
    const database = await databasePromise;

    // add todo
    const $insertInput = ensureNotFalsy(document.getElementById('insert-todo')) as HTMLInputElement;
    $insertInput.onkeydown = async (event) => {
        if (
            event.code === 'Enter' &&
            $insertInput.value.length > 0
        ) {
            await database.todos.insert({
                id: randomCouchString(10),
                name: $insertInput.value,
                state: 'open',
                lastChange: Date.now()
            });
            $insertInput.value = '';
        }
    }

    // clear completed
    const $clearCompletedButton = ensureNotFalsy(document.getElementById('clear-completed')) as HTMLButtonElement;
    $clearCompletedButton.onclick = async () => {
        await database.todos.find({
            selector: {
                state: 'done'
            }
        }).remove();
    }
}


function getHtmlByTodo(todo: RxTodoDocument): HTMLLIElement {
    const escapeForHTML = (s: string) => s.replace(/[&<]/g, c => c === '&' ? '&amp;' : '&lt;');

    const $liElement = document.createElement('li');
    $liElement.setAttribute('data-id', todo.id);

    const $viewDiv = document.createElement('div');
    $liElement.append($viewDiv);

    const $checkbox = document.createElement('input');
    $viewDiv.append($checkbox);
    $checkbox.type = 'checkbox';
    $checkbox.classList.add('toggle');
    $checkbox.onclick = () => {
        const newState = todo.state === 'done' ? 'open' : 'done';
        todo.incrementalPatch({ state: newState, lastChange: Date.now() });
    }

    const $label = document.createElement('label');
    $label.contentEditable = 'true';
    $label.onkeyup = (ev) => {
        if (ev.code === 'Enter') {
            const newName = $label.innerHTML.replace(/<br>/g, '').replace(/\&nbsp;/g, ' ').trim();
            todo.incrementalPatch({ name: newName, lastChange: Date.now() });
        }
    }
    $viewDiv.append($label);
    $label.innerHTML = escapeForHTML(todo.name);

    const $deleteButton = document.createElement('button');
    $viewDiv.append($deleteButton);
    $deleteButton.classList.add('destroy');
    $deleteButton.onclick = () => todo.remove();

    if (todo.state === 'done') {
        $checkbox.checked = true;
        $liElement.classList.add('completed');
    }

    return $liElement;
}

function updateDisplayUrl() {
    ensureNotFalsy(document.getElementById('copy-url')).innerHTML = window.location.href;
}


start();
