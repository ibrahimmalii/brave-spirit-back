const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const fsx = require('fs-extra');
const srcDir = path.join(__dirname, "../../cppublic");
const destDir = path.join(__dirname, "../../public");


module.exports = {
    getHome: async (req, res) => {
        try {
            if (
                !fs.existsSync(
                    path.join(__dirname, "../../public/home/home.json")
                )
            ) {
                return res
                    .status(404)
                    .json({ error: "Home json file is missing" });
            }
            return res.status(200).json(
                JSON.parse(
                    fs
                        .readFileSync(
                            path.join(__dirname, "../../public/home/home.json")
                        )
                        .toString()
                )
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
    updateHome: async (req, res) => {
        try {
            let body = JSON.parse(JSON.stringify(req.body)); // take a copy of the body

            //body verification
            const bodyVerification = Joi.object()
                .keys({
                    target: Joi.string().optional(),
                    content: Joi.any().required(),
                    // names: Joi.array().min(0).optional(),
                    names: Joi.any().optional(),
                })
                .validate(body);
            if (bodyVerification.error) {
                return res.status(400).json({
                    error: bodyVerification.error,
                });
            }

            //parse the content
            body.content = JSON.parse(body.content);
            //write the new update on the json home file
            fs.writeFileSync(
                path.join(__dirname, "../../public/home/home.json"),
                JSON.stringify(body.content)
            );

            //verify if the folder doesn't exists so we create it to send files inside
            if (
                !fs.existsSync(
                    path.join(__dirname, "../../public/home", body.target)
                )
            ) {
                fs.mkdirSync(
                    path.join(__dirname, "../../public/home", body.target)
                );
            }
            //parse the names
            const names = JSON.parse(body.names);

            if (Object.keys(req.files).length !== names.length) {
                return res.status(400).json({
                    error: "The number of files and names is not compatible",
                });
            }

            let index = 0;
            //loop and copy all filed with their names
            for (const key in req.files) {
                fs.copyFileSync(
                    req.files[key].path,
                    path.join(
                        __dirname,
                        "../../public/home",
                        body.target,
                        names[index].ar
                    )
                );
                fs.copyFileSync(
                    req.files[key].path,
                    path.join(
                        __dirname,
                        "../../public/home",
                        body.target,
                        names[index].en
                    )
                );
                index++;
            }

            return res.status(200).json({ message: "done" });
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    resetHome: async (req, res) => {
        await fsx.copy(srcDir, destDir);
        return res.status(200).json(
            JSON.parse(
                fs
                    .readFileSync(
                        path.join(__dirname, "../../public/home/home.json")
                    )
                    .toString()
            )
        );
    },
    getImage: async (req, res) => {
        try {
            if (
                !fs.existsSync(
                    path.join(
                        __dirname,
                        "../../public/home",
                        req.params.target,
                        req.params.name
                    )
                )
            ) {
                return res.status(404).json({ error: "File not found" });
            }
            return res.sendFile(
                path.join(
                    __dirname,
                    "../../public/home",
                    req.params.target,
                    req.params.name
                ),
                (error) => {
                    if (error) {
                        return res.status(500).json({ error: error });
                    }
                }
            );
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    },
};



// "{'ar':{'title':'أحصل على دعم نفسي شامل وتمتع بشعور أفضل','description':'<p>دورات تطبيقية لكي تتغلب على مخاوفك\\nوتنهي معاناتك النفسية.<br></p>','image':'banner/لافتة.jpg','alt_image':'لافتة'},'en':{'title':'test','description':null,'image':'banner/banner.jpg','alt_image':'banner'}}"