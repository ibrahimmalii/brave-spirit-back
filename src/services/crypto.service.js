const crypto = require("crypto-js");

module.exports = {
    cipherEncrypt: async (data) => {
        const encryptedData = crypto.AES.encrypt(
            data,
            process.env.CIPHER_KEY
        ).toString();
        return encryptedData;
    },
    cipherDecrypt: async (data) => {
        var decryptedData = crypto.AES.decrypt(data, process.env.CIPHER_KEY);
        decryptedData = decryptedData.toString(crypto.enc.Utf8);
        return decryptedData;
    },
};
