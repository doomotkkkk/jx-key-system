const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const SUPABASE_URL = "https://yfmggjpbrmibhfveqgjz.supabase.co";
const SUPABASE_KEY = "sb_publishable_xfyccL0la_rkeen-9lmqSg_O0Z2LE_2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "JX key system running"
    });
});

app.post("/verify", async (req, res) => {
    try {
        const { key, hwid } = req.body;

        if (!key || !hwid) {
            return res.json({
                success: false,
                message: "Missing key or HWID"
            });
        }

        const { data, error } = await supabase
            .from("license_keys")
            .select("*")
            .eq("key_text", key)
            .single();

        if (error || !data) {
            return res.json({
                success: false,
                message: "Invalid key"
            });
        }

        if (!data.active) {
            return res.json({
                success: false,
                message: "Key disabled"
            });
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return res.json({
                success: false,
                message: "Key expired"
            });
        }

        if (!data.hwid) {
            const { error: updateError } = await supabase
                .from("license_keys")
                .update({ hwid: hwid })
                .eq("id", data.id);

            if (updateError) {
                return res.json({
                    success: false,
                    message: "Failed to bind HWID"
                });
            }

            return res.json({
                success: true,
                message: "Key valid and bound to HWID"
            });
        }

        if (data.hwid !== hwid) {
            return res.json({
                success: false,
                message: "HWID mismatch"
            });
        }

        return res.json({
            success: true,
            message: "Key valid"
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
