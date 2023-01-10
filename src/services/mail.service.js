const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URL;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     secure: true,
//     auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//     },
// });

module.exports = {
    sendMail: async (to, code, subject) => {
        try {
            // const accessToken = await oAuth2Client.getAccessToken();

            // const transporter = nodemailer.createTransport({
            //     service: "gmail",
            //     secure: true,
            //     auth: { 
            //         type: "OAuth2",
            //         user: process.env.MAIL_USER,
            //         clientId: CLIENT_ID,
            //         clientSecret: CLIENT_SECRET,
            //         refreshToken: REFRESH_TOKEN,
            //         // accessToken: accessToken,
            //     },
            //     tls: {
            //         rejectUnauthorized: false,
            //     },
            // });
            // It's my object => Ibrahim Ali
            let transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS
                }
            });

            const template = fs.readFileSync(
                path.join(__dirname, "../../public/mail/template.html"),
                "utf8"
            );
            let template_content = template.replace("subject", code);
       
            let mailOptions = {
                from: process.env.MAIL_USER, // sender address
                to, // list of receivers
                subject, // Subject line
                // text: 'zabati elvideo lazbotek', // plain text body
                html: template_content // html body
            };

            return transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('error');
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
        
    },
};
