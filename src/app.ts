import express, { Application } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import spec from '@App/resources/spec.json' assert { type: 'json' };
import {
  applicantRoutes,
  healthRoutes,
  opportunitiesRoutes,
} from '@App/routes/index.js';
import errorHandler from './middleware/ErrorHandler.js';

const router = express.Router();
const app: Application = express();

app.use(express.json());

/**
 * Sets the app to use router and auth
 */
app.use(router);

app.use('/applicants', applicantRoutes);
app.use('/opportunities', opportunitiesRoutes);
app.use('/health', healthRoutes);
/**
 * Swagger UI documentation endpoint
 */
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(spec));

router.get('/health', healthRoutes);

app.use(errorHandler);
app.set('port', process.env.PORT);

export default app;
