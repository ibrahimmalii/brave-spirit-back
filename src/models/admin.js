const { createModel } = require("../../configs/db");

const Admin = createModel("Admin", {
    firstname: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 50,
    },
    lastname: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 50,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Veuillez insérer un mail valide.",
        ],
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    refreshtoken: {
        type: String,
    },
});

module.exports = {
    Admin,
};
