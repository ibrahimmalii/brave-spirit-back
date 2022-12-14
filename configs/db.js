const mongoose = require("mongoose");
// console.log(`${process.env.DB_ROOT}://${process.env.DB_HOST}/${process.env.DB_NAME}`)
async function connection() {
    return mongoose
        .connect(
            `${process.env.DB_ROOT}://${process.env.DB_HOST}/${process.env.DB_NAME}`
        )
        .then((res) => {
            //in case of successful connection
            console.log("MongoDB connection Success !!!")
            res.startSession();
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