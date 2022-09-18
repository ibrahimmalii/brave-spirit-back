module.exports = {
    schemaValidator: (Model, required = true) => {
        return (req, res, next) => {
            try {
                const error = new Model(req.body).validateSync();
                if (error)
                    for (let key in error.errors) {
                        if (
                            required ||
                            (!required &&
                                !error?.errors[key]?.message.includes(
                                    "is required"
                                ))
                        )
                            return res
                                .status(400)
                                .json({ message: error.errors[key].message });
                    }
                next();
            } catch (error) {
                return res.status(400).json({ error: error });
            }
        };
    },
};
