import {
    randomCouchString
} from 'rxdb/plugins/core';

export function getRoomId(): string {
    let hash = window.location.hash;
    if (!hash || hash.length < 5) {
        hash = randomCouchString(12);
        window.location.hash = hash;
        window.location.reload();
    }
    return hash;
}
