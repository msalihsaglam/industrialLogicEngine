# industrialLogicEngine
Industrial Logic Engine
Bu proje, endüstriyel cihazlardan (PLC/Sensör) OPC UA protokolü üzerinden gerçek zamanlı veri okuyan ve bu verileri PostgreSQL veritabanında tanımlı kurallara göre işleyen bir Mantık Motoru (Logic Engine) uygulamasıdır.

🛠 Teknolojiler
Node.js: Ana uygulama ve Mantık Motoru.

OPC UA: Endüstriyel haberleşme protokolü.

PostgreSQL: Kural yönetimi ve veri saklama.

Docker: Veritabanı altyapısı.

industrialLogicEngine/
├── backend/
│   ├── index.js          # Mantık Motoru (Client)
│   ├── simulator.js      # Yerel OPC UA Sunucusu (Simulator)
│   ├── package.json      # Bağımlılıklar
├── docker-compose.yml    # Veritabanı (PostgreSQL) yapılandırması
└── README.md             # Kurulum ve kullanım kılavuzu


Kurulum ve Çalıştırma
1. Ön Gereksinimler
Bilgisayarınızda Node.js (v18+) ve Docker Desktop kurulu olmalıdır.

2. Veritabanını Başlatın
Projenin ana dizininde terminali açın ve veritabanını ayağa kaldırın:

docker-compose up -d

3. Bağımlılıkları Yükleyin
backend klasörüne gidin ve gerekli paketleri kurun:

cd backend
npm install

4. Veritabanı Şemasını Oluşturun
PostgreSQL'e bağlanın (localhost:5432) ve aşağıdaki SQL komutu ile kural tablosunu oluşturun:

CREATE TABLE rules (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50),
    threshold FLOAT,
    operator VARCHAR(5),
    alert_message TEXT,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO rules (tag_name, threshold, operator, alert_message) 
VALUES ('Pressure', 35.0, '>', '⚠️ DİKKAT: Yüksek Basınç Tespit Edildi!');

5. Uygulamayı Çalıştırın
Projenin çalışması için iki ayrı terminalde simülatörü ve ana motoru başlatmanız gerekir:

Terminal 1 (Simülatör):
node simulator.js

Terminal 2 (Logic Engine):
node index.js

Nasıl Çalışır?
Simulator, 4840 portu üzerinden rastgele "Pressure" (Basınç) verisi üretir.

Logic Engine, bu veriye abone (Subscribe) olur ve her değişimde veriyi alır.

Gelen her veri için PostgreSQL veritabanındaki aktif kurallar sorgulanır.

Eğer veri, veritabanındaki eşik değerini (threshold) aşarsa, konsola uyarı mesajı yazdırılır.


Sistemin çalışması için şu an şu 3 terminalin açık olması gerektiğini unutma:

Terminal (Docker): PostgreSQL çalışıyor olmalı (docker-compose up -d).

Terminal (Simulator): node simulator.js çalışıyor olmalı.

Terminal (Backend): node index.js çalışıyor olmalı. 

Terminal (Frontend): npm run dev çalışıyor olmalı.