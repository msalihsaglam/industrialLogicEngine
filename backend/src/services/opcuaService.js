const { OPCUAClient, AttributeIds, TimestampsToReturn } = require("node-opcua");
const socketManager = require("../socket/socketManager");
const { checkRules } = require("./logicEngine");

const endpointUrl = "opc.tcp://localhost:4840/UA/MyLittleServer";
const tags = [
    { name: "Pressure", node: "ns=1;s=Pressure" },
    { name: "Temperature", node: "ns=1;s=Temperature" }
];

async function startOPCUA() {
    const client = OPCUAClient.create({ endpointMustExist: false });
    const io = socketManager.getIo();

    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        const subscription = await session.createSubscription2({ 
            requestedPublishingInterval: 1000, 
            publishingEnabled: true 
        });

        for (let tag of tags) {
            const monitoredItem = await subscription.monitor(
                { nodeId: tag.node, attributeId: AttributeIds.Value },
                { samplingInterval: 500, discardOldest: true, queueSize: 1 },
                TimestampsToReturn.Both
            );

            monitoredItem.on("changed", (dataValue) => {
                const val = dataValue.value.value;
                io.emit("liveData", { tag: tag.name, value: val });
                checkRules(tag.name, val);
            });
        }
        console.log("✅ OPC UA Servisi Başlatıldı.");
    } catch (err) { console.error("OPC UA Error:", err.message); }
}

module.exports = { startOPCUA };