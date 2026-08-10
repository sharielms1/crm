// Entrypoint para el preset Express de Vercel (runtime Bun): exporta la
// instancia Express que NestJS arma en create-app. El main.ts (listen) sigue
// siendo el arranque local; este archivo es solo para Vercel.
import { createApp } from "./create-app";

const app = await createApp();
await app.init();

export default app.getHttpAdapter().getInstance();
