const { createModel } = require("../../configs/db");

const Book = createModel("Book", {
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Veuillez insérer un mail valide.",
        ],
    },
});

module.exports = {
    Book,
};
