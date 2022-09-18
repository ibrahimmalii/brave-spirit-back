const errorMessages = {
    11000: "Duplicate fields : ",
};

module.exports = {
    errorHandler: (req, res, error) => {
        try {
            if (error & error.keyPattern)
                for (let key in error.keyPattern) {
                    if (errorMessages[error.code]) {
                        return res.status(400).json({
                            message: `${errorMessages[error.code]}${key}`,
                        });
                        break;
                    } else
                        res.status(400).json({
                            message: error,
                        });
                }
            else
                return res.status(400).json({
                    message: error,
                });
        } catch (error) {
            return res.status(400).json({
                error: error,
            });
        }
    },
};
