import "dotenv/config";
import http from "http";
import app from "./src/app/app.js";
import connectDB from "./src/config/db.js";
import initializeSocket from "./src/services/socket.service.js";

const PORT = process.env.PORT || 6001;

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = initializeSocket(httpServer);
  app.set("io", io);

  httpServer.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}/api/health`);
  });
};

startServer();