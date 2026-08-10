// Entrypoint para el preset Express de Vercel (runtime Bun). El detector del
// preset exige un import literal de express; la instancia real la arma NestJS.
import type { Express } from "express";
import express from "express";
import { createApp } from "./create-app";

void express; // el detector busca el import; la app viene de NestJS

const app = await createApp();
await app.init();

export default app.getHttpAdapter().getInstance() as Express;
