import { connectDB } from "./src/database/mongodb";
import { CONSTANTS } from "./src/config/constant";
import app from "./src/app";
import { startReminderScheduler } from "./src/services/reminder-scheduler.services";

const start = async () => {
  await connectDB();
  const port = Number(CONSTANTS.PORT);
  const host = CONSTANTS.HOST;

  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });

  startReminderScheduler();
};

start().catch(console.error);
