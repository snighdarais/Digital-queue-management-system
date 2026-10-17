const app = require("./app");
const { db, ready } = require("./database");

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || "127.0.0.1";

if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer from 0 to 65535.");
}

let server;

ready.then(() => {
    server = app.listen(port, host, () => {
        const address = server.address();
        console.log(`Website running at http://${host}:${address.port}`);
    });
    server.on("error", (error) => {
        console.error("Website server failed:", error.message);
        db.close(() => {
            process.exitCode = 1;
        });
    });
}).catch((error) => {
    console.error("Database initialization failed:", error.message);
    db.close(() => {
        process.exitCode = 1;
    });
});

function shutdown() {
    if (server) {
        server.close(() => db.close());
    } else {
        db.close();
    }
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
