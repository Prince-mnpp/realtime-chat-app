import mongoose from "mongoose";

const connectdb = async () => {
  const url = process.env.MONGO_URL;

  if(!url) {
    throw new Error("Mongo url not found");
  }

  try {
    await mongoose.connect(url, {
      dbName: "chatappmicroservice",
    })
    console.log("mongoDB connection done successfully")
  } catch (error) {
    console.error("failed to connect to mongodb", error);
    process.exit(1);
  }
};

export default connectdb;
