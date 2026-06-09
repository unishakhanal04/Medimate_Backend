import { connectDB } from "./src/database/mongodb";
import { CONSTANTS } from "./src/config/constant";
import app from "./src/app";

const start = async () => {
  await connectDB();
  app.listen(CONSTANTS.PORT, () => {
    console.log(`Server running on port ${CONSTANTS.PORT}`);
  });
};

start().catch(console.error);
