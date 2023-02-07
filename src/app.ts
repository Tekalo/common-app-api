import express, { Application } from 'express';

const router = express.Router();
const app: Application = express();

/**
 * Sets the app to use router and auth
 */
app.use(router);

app.set('port', 3000);

export default app;
