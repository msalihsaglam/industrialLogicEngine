const calculateEnergyKPIs = (tags, liveData) => {
    // Roller üzerinden tagleri bul
    const voltageTag = tags.find(t => t.tag_role === 'voltage');
    const currentTag = tags.find(t => t.tag_role === 'current');
    const powerTag = tags.find(t => t.tag_role === 'power');

    // Eğer gerekli roller tamsa hesaplamaya geç
    if (voltageTag && currentTag && powerTag) {
        const v = liveData[voltageTag.id]?.value;
        const i = liveData[currentTag.id]?.value;
        const p = liveData[powerTag.id]?.value;

        // 🚀 Örnek Modüler Hesaplama: Güç Faktörü (Cosφ)
        const cosPhi = (p / (v * i * Math.sqrt(3))).toFixed(2);
        return { cosPhi, status: cosPhi < 0.95 ? 'LOW_PF_WARNING' : 'HEALTHY' };
    }
};