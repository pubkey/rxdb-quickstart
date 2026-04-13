import { replicateGoogleDrive } from 'rxdb/plugins/replication-google-drive';
import { createTodoDatabase, TodoDocType } from './shared-database.js';
import { initTodoUI, getById } from './shared-ui.js';
import './style.css';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let authToken: string | null = null;

function getTokenFromHash(): string | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
}

function loginWithGoogle() {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
        '?client_id=' + encodeURIComponent(GOOGLE_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&response_type=token' +
        '&scope=' + encodeURIComponent(SCOPES);
    window.location.href = authUrl;
}

function updateLoginUI(loggedIn: boolean) {
    const $loginBtn = getById('google-login-btn');
    const $status = getById('login-status');
    if (loggedIn) {
        $loginBtn.style.display = 'none';
        $status.textContent = 'Connected to Google Drive';
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
        // clean the hash so it does not interfere
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const $loginBtn = getById('google-login-btn');
    $loginBtn.onclick = () => loginWithGoogle();

    updateLoginUI(!!authToken);

    const database = await createTodoDatabase('-gdrive');
    initTodoUI(database);

    if (authToken) {
        const replicationState = await replicateGoogleDrive<TodoDocType>({
            collection: database.todos,
            replicationIdentifier: 'google-drive-todos',
            googleDrive: {
                oauthClientId: GOOGLE_CLIENT_ID,
                authToken: authToken,
                folderPath: 'rxdb-quickstart/todos'
            },
            pull: {},
            push: {},
            live: true
        });
        replicationState.error$.subscribe((err: any) => {
            console.log('Google Drive replication error:');
            console.dir(err);
        });
    }
})();
