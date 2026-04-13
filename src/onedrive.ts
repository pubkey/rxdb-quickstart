import { replicateMicrosoftOneDrive } from 'rxdb/plugins/replication-microsoft-onedrive';
import { createTodoDatabase, TodoDocType } from './shared-database.js';
import { initTodoUI, getById } from './shared-ui.js';
import './style.css';

const MICROSOFT_CLIENT_ID = 'YOUR_MICROSOFT_CLIENT_ID';
const SCOPES = 'Files.ReadWrite';

let authToken: string | null = null;

function getTokenFromHash(): string | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
}

function loginWithMicrosoft() {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
        '?client_id=' + encodeURIComponent(MICROSOFT_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&response_type=token' +
        '&scope=' + encodeURIComponent(SCOPES);
    window.location.href = authUrl;
}

function updateLoginUI(loggedIn: boolean) {
    const $loginBtn = getById('onedrive-login-btn');
    const $status = getById('login-status');
    if (loggedIn) {
        $loginBtn.style.display = 'none';
        $status.textContent = 'Connected to OneDrive';
        $status.style.color = '#4CAF50';
    } else {
        $loginBtn.style.display = 'inline-block';
        $status.textContent = 'Not connected';
        $status.style.color = '#999';
    }
}

(async () => {
    // check for OAuth token in URL hash
    authToken = getTokenFromHash();
    if (authToken) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const $loginBtn = getById('onedrive-login-btn');
    $loginBtn.onclick = () => loginWithMicrosoft();

    updateLoginUI(!!authToken);

    const database = await createTodoDatabase('-onedrive');
    initTodoUI(database);

    if (authToken) {
        const replicationState = await replicateMicrosoftOneDrive<TodoDocType>({
            collection: database.todos,
            replicationIdentifier: 'onedrive-todos',
            oneDrive: {
                authToken: authToken,
                folderPath: 'rxdb-quickstart/todos'
            },
            pull: {},
            push: {},
            live: true
        });
        replicationState.error$.subscribe((err: any) => {
            console.log('OneDrive replication error:');
            console.dir(err);
        });
    }
})();
