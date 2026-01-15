const { OPCUAServer, Variant, DataType, StatusCodes } = require("node-opcua");

async function createServer() {
    const server = new OPCUAServer({
        port: 4841,
        resourcePath: "/UA/MyLittleServer2",
        buildInfo: { productUri: "MySimulator2" }
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

    // Sürekli değişen bir değişken ekleyelim (Sıcaklık Sensörü)
    let variableValueTemperature = 20;
    namespace.addVariable({
        componentOf: device,
        browseName: "Temperature",
        nodeId: "s=Temperature", // ns=1;s=Temperature
        dataType: "Double",
        value: {
            get: () => new Variant({ dataType: DataType.Double, value: variableValueTemperature })
        }
    });

    // Sürekli değişen bir değişken ekleyelim (Makine Hızı)
    let variableValueMachineSpeed = 1;
    namespace.addVariable({
        componentOf: device,
        browseName: "Speed",
        nodeId: "s=Speed", // ns=1;s=Speed
        dataType: "Double",
        value: {
            get: () => new Variant({ dataType: DataType.Double, value: variableValueMachineSpeed })
        }
    });

    // Değeri her saniye rastgele değiştir
    setInterval(() => {
        variableValue = 10 + Math.random() * 50;
    }, 1000);

    // Değeri her saniye rastgele değiştir
    setInterval(() => {
        variableValueTemperature = 20 + Math.random() * 50;
    }, 1000);

        // Değeri her saniye rastgele değiştir
    setInterval(() => {
        variableValueMachineSpeed = 20 + Math.random() * 4;
    }, 1000);

    await server.start();
    //console.log("🚀 Simülatör (PLC) 4840 portunda çalışıyor!");
    //console.log("Adres: opc.tcp://localhost:4840/UA/MyLittleServer");
}

createServer();