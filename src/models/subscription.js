const { createModel } = require("../../configs/db");
const mongoose = require("mongoose");

const Subscription = createModel("Subscription", {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        autopopulate: false,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        autopopulate: false,
    },
    price: {
        euro: {
            type: Number,
            required: true,
        },
        dzd: {
            type: Number,
            required: true,
        },
    },
    order_id: {
        type: String,
    },
    seller_transaction_id: {
        type: String,
    },
    method: {
        type: String,
        enum: ["visa", "paypal", "cib", "free"],
        default: "free",
    },
    request: {
        type: {
            type: String,
            enum: ["cib", "help"],
        },
        file: {
            type: String,
        },
        reason: {
            type: String,
        },
    },
    state: {
        type: String,
        enum: ["received", "completed", "declined", "error"],
        default: "received",
        required: true,
    },
});


module.exports = {
    Subscription,
};
