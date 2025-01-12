import {
    ensureNotFalsy,
    randomToken
} from 'rxdb/plugins/core';
import {
    RxTodoDocument,
    databasePromise
} from './database.js';
import './style.css';

(async () => {
    const database = await databasePromise;

    // update url in description text
    getById('copy-url').innerHTML = window.location.href;

    // render reactive todo list
    const $todoList = getById('todo-list');
    database.todos.find({
        sort: [
            { state: 'desc' },
            { lastChange: 'desc' }
        ]
    }).$.subscribe(todos => {
        $todoList.innerHTML = '';
        todos.forEach(todo => $todoList.append(getHtmlByTodo(todo)));
    });

    // event: add todo
    const $insertInput = getById<HTMLInputElement>('insert-todo');
    const addTodo = async () => {
        if ($insertInput.value.length < 1) { return; }
        await database.todos.insert({
            id: randomToken(10),
            name: $insertInput.value,
            state: 'open',
            lastChange: Date.now()
        });
        $insertInput.value = '';
    };
    $insertInput.onkeydown = async (event) => {
        if (isEnterEvent(event)) { addTodo(); }
    }
    $insertInput.onblur = () => addTodo();

    // event: clear completed
    getById('clear-completed').onclick = () => database.todos.find({ selector: { state: 'done' } }).remove();
})();

function getById<T = HTMLElement>(id: string): T { return ensureNotFalsy(document.getElementById(id)) as any; }
const escapeForHTML = (s: string) => s.replace(/[&<]/g, c => c === '&' ? '&amp;' : '&lt;');
const isEnterEvent = (ev: KeyboardEvent) => ev.code === 'Enter' || ev.keyCode === 13;
function getHtmlByTodo(todo: RxTodoDocument): HTMLLIElement {
    const $liElement = document.createElement('li');
    const $viewDiv = document.createElement('div');
    const $checkbox = document.createElement('input');
    const $label = document.createElement('label');
    const $deleteButton = document.createElement('button');
    $liElement.append($viewDiv);
    $viewDiv.append($checkbox);
    $viewDiv.append($label);
    $viewDiv.append($deleteButton);

    // event: toggle todo state
    $checkbox.onclick = () => todo.incrementalPatch({ state: todo.state === 'done' ? 'open' : 'done' });
    $checkbox.type = 'checkbox';
    $checkbox.classList.add('toggle');

    // event: change todo name
    $label.contentEditable = 'true';
    const updateName = async () => {
        let newName = $label.innerText || $label.textContent as string;
        newName = newName.replace(/<br>/g, '').replace(/\&nbsp;/g, ' ').trim();
        if (newName !== todo.name) {
            await todo.incrementalPatch({ name: newName });
        }
    }
    $label.onblur = () => updateName();
    $label.onkeyup = async (ev) => {
        if (isEnterEvent(ev)) {
            updateName();
        }
    }
    $label.innerHTML = escapeForHTML(todo.name);

    // event: delete todo
    $deleteButton.classList.add('destroy');
    $deleteButton.onclick = () => todo.remove();

    if (todo.state === 'done') {
        $liElement.classList.add('completed');
        $checkbox.checked = true;
    }

    return $liElement;
}
