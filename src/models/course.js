const { createModel } = require("../../configs/db");

const Course = createModel("Course", {
    name: {
        ar: {
            type: String,
            required: true,
            unique: true,
        },
        en: {
            type: String,
        },
    },
    description: {
        ar: {
            type: String,
            required: true,
        },
        en: {
            type: String,
        },
    },
    zipped_description: {
        ar: {
            type: String,
            required: true,
        },
        en: {
            type: String,
        },
    },
    cover: {
        type: String,
        required: true,
    },
    images: [String],
    chapters: [
        {
            title: {
                ar: {
                    type: String,
                },
                en: {
                    type: String,
                },
            },
            description: {
                ar: {
                    type: String,
                },
                en: {
                    type: String,
                },
            },
            files: [
                {
                    title: {
                        ar: {
                            type: String,
                        },
                        en: {
                            type: String,
                        },
                    },
                    link: {
                        type: String,
                    },
                    file: {
                        type: String,
                    },
                    attachments: [String],
                },
            ],
        },
    ],
    price: {
        euro: {
            type: Number,
            default: 0,
        },
        dzd: {
            type: Number,
            default: 0,
        },
    },
    discount: {
        type: Number,
        default: 0,
    },
    read_count: {
        type: Number,
        default: 0,
    },
    published: {
        type: Boolean,
        default: false,
    },
});

module.exports = {
    Course,
};
