require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

mongoose.connect(mongoURI);

const usrlsSchema = new mongoose.Schema(
    {
        originalUrl: String,
        shortUrl: Number,
    },
    { collection: "Urls" }
);

const Urls = mongoose.model("Urls", usrlsSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(express.static("public"));

app.post("/api/shorturl", async (req, res) => {
    try {
        const url = new URL(req.body.url);
        const urlsCount = await Urls.countDocuments();

        dns.lookup(url.hostname, async (err) => {
            if (err) res.json({ error: "invalid url" });
            else {
                let currentUrl = await Urls.findOne({ originalUrl: url });

                if (!currentUrl) {
                    currentUrl = await Urls.create({
                        originalUrl: url,
                        shortUrl: urlsCount,
                    });
                }

                res.json({
                    original_url: currentUrl.originalUrl,
                    short_url: currentUrl.shortUrl,
                });
            }
        });
    } catch {
        res.json({ error: "invalid url" });
    }
});

app.get("/api/shorturl/:index", async (req, res) => {
    const index = req.params.index;
    const url = await Urls.findOne({ shortUrl: +index });

    if (url) res.redirect(url.originalUrl);
    else res.json({ error: "No short URL found for the given input" });
});

app.get("/api/shorturl", (req, res) => {
    res.send("Not found");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
