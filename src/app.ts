import express, { Application } from 'express';

const router = express.Router();
const app: Application = express();

/**
 * Sets the app to use router and auth
 */
app.use(router);

app.set('port', process.env.PORT);

export default app;
