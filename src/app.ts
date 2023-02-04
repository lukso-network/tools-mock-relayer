import { createServer } from "./config/express";
import { logger } from "./config/logger";
import router from "./modules/relayer/relayer.controller";
import http from "http";
import { AddressInfo } from "net";

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "3000";

async function startServer() {
  const app = createServer();

  app.use("/", router);

  const server = http.createServer(app).listen({ host, port }, () => {
    const addressInfo = server.address() as AddressInfo;
    logger.info(
      `Server ready at http://${addressInfo.address}:${addressInfo.port}`
    );
  });

  const signalTraps: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGUSR2"];
  signalTraps.forEach((type) => {
    process.once(type, async () => {
      logger.info(`process.once ${type}`);

      server.close(() => {
        logger.debug("HTTP server closed");
      });
    });
  });
}

startServer();
