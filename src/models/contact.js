const { createModel } = require("../../configs/db");

const Contact = createModel("Contact", {
    name: {
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
    subject: {
        type: String,
        required: true,
    },
    courseName: {
        type: String,
    },
    message: {
        type: String,
        required: true,
    },
    archived: {
        type: Boolean,
        default: false,
        required: true,
    },
    answer: {
        type: String,
    },
});

module.exports = {
    Contact,
};
