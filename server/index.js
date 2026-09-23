import { createApp } from './app.js';

const port = Number(process.env.PORT || process.env.API_PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const { app } = createApp({ logger: true });

try {
  await app.listen({ port, host });
  console.log(`RotaPro API em http://${host}:${port}`);
  console.log('Persistência: memória' + (process.env.ROTA_STORE_FILE ? ` + snapshot JSON em ${process.env.ROTA_STORE_FILE}` : ''));
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
