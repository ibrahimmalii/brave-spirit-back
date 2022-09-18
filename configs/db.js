const mongoose = require("mongoose");
console.log(`${process.env.MONGO_CONNECTION_STRING}`);
async function connection() {
    await mongoose
        .connect(
            // `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}/${process.env.DB_NAME}`
            `${process.env.MONGO_CONNECTION_STRING}`
        )
        .then(() => {
            //in case of successful connection
            console.log("MongoDB connection Success !!!")
        })
        .catch((error) => {
            console.log("Database connection error : ", error);
        });
}

function createSchema(schema) {
    return new mongoose.Schema(schema, {
        timestamps: true,
    });
}

function createModel(name, schemaStructor) {
    let schema = createSchema(schemaStructor);
    schema.plugin(require("mongoose-autopopulate"));
    return mongoose.model(name, schema);
}

function createInheritedModel(name, Model, schema) {
    return Model.discriminator(name, createSchema(schema));
}

module.exports = {
    connection,
    createModel,
    createInheritedModel
};