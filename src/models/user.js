const { createModel } = require("../../configs/db");

const User = createModel("User", {
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
    },
    phone: {
        type: String,
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
        minlength: 8,
    },
    country: {
        type: String,
    },
    adress: {
        type: String,
    },
    birthdate: {
        type: Date,
    },
    gender: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0,
    },
    active: {
        type: Boolean,
        default: true,
    },
    confirmed: {
        type: Boolean,
        default: false,
    },
    refreshtoken: {
        type: String,
    },
    google_id: {
        type: String,
    },
    image: {
        type: String,
        default:"default.png"
    },
});

module.exports = {
    User,
};
