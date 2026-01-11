const pool = require("../config/db");
const socketManager = require("../socket/socketManager");

async function checkRules(tagName, currentValue) {
    try {
        const res = await pool.query("SELECT * FROM rules WHERE tag_name = $1 AND is_active = true", [tagName]);
        const io = socketManager.getIo();

        res.rows.forEach(rule => {
            let isTriggered = false;
            if (rule.operator === '>' && currentValue > rule.threshold) isTriggered = true;
            if (rule.operator === '<' && currentValue < rule.threshold) isTriggered = true;

            if (isTriggered) {
                io.emit("alarm", { 
                    message: rule.alert_message, 
                    value: currentValue, 
                    time: new Date().toLocaleTimeString() 
                });
            }
        });
    } catch (err) { console.error("Logic Engine Hatası:", err); }
}

module.exports = { checkRules };