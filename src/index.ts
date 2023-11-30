import {
    ensureNotFalsy,
    randomCouchString
} from 'rxdb/plugins/core';
import { getDatabase } from './database.js';

import "./style.css";
import { escapeForHTML } from './utils.js';
import { RxTodoDocument } from './schemas/todo.schema.js';


async function start() {
    console.log('# START');
    const database = await getDatabase();
    console.log('# database created');
    await addEventHandlers();
    console.log('# added event handlers');


    const $todoList = ensureNotFalsy(document.getElementById('todo-list')) as HTMLUListElement;
    database.todos.find({
        sort: [
            { state: 'desc' }
        ]
    }).$.subscribe(todos => {
        console.log('emitted todos:');
        console.dir(todos);
        $todoList.innerHTML = '';
        todos.forEach(todo => {
            const $el = getHtmlByTodo(todo);
            $todoList.append($el);
        });
    });
}


async function addEventHandlers() {
    const database = await getDatabase();

    // add todo
    const $insertInput = ensureNotFalsy(document.getElementById('insert-todo')) as HTMLInputElement;
    $insertInput.onkeydown = async (event) => {
        if (event.code === 'Enter') {
            const value = $insertInput.value;
            console.log('add todo ' + value);
            await database.todos.insert({
                id: randomCouchString(10),
                name: value,
                state: 'open',
                lastChange: Date.now()
            });
            $insertInput.value = '';
        }
    }

    // toggle state
    window.addEventListener('click', () => {

    });

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


function getHtmlByTodo(todo: RxTodoDocument) {

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
        todo.incrementalPatch({ state: newState });
    }

    const $label = document.createElement('label');
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

    // $todoList.innerHTML += `
    // <li data-id="${todo.id}"${completed ? ' class="completed"' : ''}>
    //     <div class="view">
    //         <input class="toggle" type="checkbox" ${completed ? 'checked' : ''}>
    //         <label>${escapeForHTML(todo.name)}</label>
    //         <button class="destroy"></button>
    //     </div>
    // </li>`

    return $liElement;
}


start();
