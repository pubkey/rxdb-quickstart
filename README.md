# RxDB Quickstart - Local-First P2P todo list

This is a [local first](https://rxdb.info/offline-first.html) todo app that stores data locally with [RxDB](https://rxdb.info/) and replicates it [P2P with WebRTC](https://rxdb.info/replication-p2p.html) to other devices without sending the data throught any central server.

The whole app is implemented without a framework in about 200 lines of TypeScript code. To learn more about how it works, I recommend looking a the [source code](./src//index.ts) and read the [RxDB Quickstart Guide](https://rxdb.info/quickstart.html).

### Try live demo

The app is deployed with github pages at [https://pubkey.github.io/rxdb-quickstart/](https://pubkey.github.io/rxdb-quickstart/).

### Start the app locally (requires Node.js v20 installed):

- Fork&Clone the repository.
- Run `npm install` to install the npm dependencies.
- Run `npm run dev` to start the webpack dev server and leave it open.
- Open [http://localhost:8080/](http://localhost:8080/) in your browser.
