const { OPCUAServer, Variant, DataType } = require("node-opcua");

async function createEnergyServer() {
    const server = new OPCUAServer({
        port: 4842,
        resourcePath: "/UA/EnergyAnalyzer",
        buildInfo: { productUri: "PowerAnalyzerSim" }
    });

    await server.initialize();
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    const analyzer = namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: "EnergyAnalyzer_01"
    });

    // --- DEĞİŞKENLER (STATE) ---
    let state = {
        voltage: 230.0,
        current: 12.5,
        powerFactor: 0.98,
        activePower: 0,
        totalEnergy: 1540.25 // kWh cinsinden başlangıç
    };

    // 1. Gerilim (Voltage)
    namespace.addVariable({
        componentOf: analyzer,
        browseName: "Voltage_L1",
        nodeId: "s=Voltage_L1",
        dataType: "Double",
        value: { get: () => new Variant({ dataType: DataType.Double, value: state.voltage }) }
    });

    // 2. Akım (Current)
    namespace.addVariable({
        componentOf: analyzer,
        browseName: "Current_L1",
        nodeId: "s=Current_L1",
        dataType: "Double",
        value: { get: () => new Variant({ dataType: DataType.Double, value: state.current }) }
    });

    // 3. Aktif Güç (Active Power)
    namespace.addVariable({
        componentOf: analyzer,
        browseName: "Active_Power",
        nodeId: "s=Active_Power",
        dataType: "Double",
        value: { get: () => new Variant({ dataType: DataType.Double, value: state.activePower }) }
    });

    // 4. Güç Faktörü (Power Factor)
    namespace.addVariable({
        componentOf: analyzer,
        browseName: "Power_Factor",
        nodeId: "s=Power_Factor",
        dataType: "Double",
        value: { get: () => new Variant({ dataType: DataType.Double, value: state.powerFactor }) }
    });

    // 5. Toplam Enerji (Total Energy - kWh)
    namespace.addVariable({
        componentOf: analyzer,
        browseName: "Total_Energy",
        nodeId: "s=Total_Energy",
        dataType: "Double",
        value: { get: () => new Variant({ dataType: DataType.Double, value: state.totalEnergy }) }
    });

    // --- SİMÜLASYON DÖNGÜSÜ ---
    setInterval(() => {
        // Rastgele yük değişimi (Akım ve Gerilim dalgalanması)
        state.voltage = 228 + Math.random() * 4; // 228-232V
        state.current = 5 + Math.random() * 25;   // 5-30A arası yük
        state.powerFactor = 0.90 + Math.random() * 0.09;

        // P = V * I * PF / 1000 (kW cinsinden)
        state.activePower = (state.voltage * state.current * state.powerFactor) / 1000;

        // Enerji birikimi (Saniyede bir çalıştığı için: kW / 3600 sn)
        state.totalEnergy += state.activePower / 3600;

        // console.log(`[ANALYZER] P: ${state.activePower.toFixed(2)} kW | Energy: ${state.totalEnergy.toFixed(4)} kWh`);
    }, 1000);

    await server.start();
    console.log("🚀 Enerji Analizörü Simülatörü Aktif!");
    console.log("📍 OPC UA Endpoint: opc.tcp://localhost:4842/UA/EnergyAnalyzer");
}

createEnergyServer();