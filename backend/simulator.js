const { OPCUAServer, Variant, DataType, StatusCodes } = require("node-opcua");

async function createServer() {
    const server = new OPCUAServer({
        port: 4840,
        resourcePath: "/UA/MyLittleServer",
        buildInfo: { productUri: "MySimulator" }
    });

    await server.initialize();
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    const device = namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: "MyDevice"
    });

    // Sürekli değişen bir değişken ekleyelim (Basınç Sensörü)
    let variableValue = 10;
    namespace.addVariable({
        componentOf: device,
        browseName: "Pressure",
        nodeId: "s=Pressure", // ns=1;s=Pressure
        dataType: "Double",
        value: {
            get: () => new Variant({ dataType: DataType.Double, value: variableValue })
        }
    });

    // Değeri her saniye rastgele değiştir
    setInterval(() => {
        variableValue = 10 + Math.random() * 50;
    }, 1000);

    await server.start();
    console.log("🚀 Simülatör (PLC) 4840 portunda çalışıyor!");
    console.log("Adres: opc.tcp://localhost:4840/UA/MyLittleServer");
}

createServer();