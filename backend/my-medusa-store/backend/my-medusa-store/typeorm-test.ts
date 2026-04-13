import "reflect-metadata";
import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "sqlite",
  database: "test.sqlite",
  synchronize: true,
  logging: false,
  entities: [],
});

AppDataSource.initialize()
  .then(() => {
    console.log("TypeORM initialized successfully.");
  })
  .catch((error) => {
    console.error("Error initializing TypeORM:", error);
  });