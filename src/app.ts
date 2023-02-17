import express, { Application } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import spec from '@App/resources/spec.json' assert { type: 'json' };
import healthRoutes from '@App/routes/health.js';

const router = express.Router();
const app: Application = express();

/**
 * Sets the app to use router and auth
 */
app.use(router);

/**
 * Swagger UI documentation endpoint
 */
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(spec));

router.get('/health', healthRoutes);

app.set('port', process.env.PORT);

export default app;
