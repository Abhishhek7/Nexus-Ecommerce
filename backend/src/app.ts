import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import { security } from './middlewares/security';
import { router } from './routes';
import { notFound, errorHandler } from './middlewares/error';
import { logger } from './utils/logger';

export const app = express();

app.use(...security);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.get('/health', (_req, res) =>
  res.json({ success: true, message: 'API healthy', data: { status: 'up', timestamp: new Date().toISOString() } }),
);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', router);

app.use(notFound);
app.use(errorHandler);