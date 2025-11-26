import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/user.entity';
import { Station } from './entities/station.entity';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const stations = [
  { name: 'COCO ARAMCO 1 - LIBERTY', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 2 - EMBASSY', city: 'ISLAMABAD', address: 'ISLAMABAD' },
  { name: 'COCO ARAMCO 3 - EXPO', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 4 - SHAHDRA', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 5 - HAYATABAD', city: 'PESHAWAR', address: 'PESHAWAR' },
  { name: 'COCO ARAMCO 6 - WAZIRABAD', city: 'WAZIRABAD, pakistan', address: 'WAZIRABAD, pakistan' },
  { name: 'COCO ARAMCO 7 - UCH NORTH', city: 'BAHAWALPUR', address: 'BAHAWALPUR' },
  { name: 'COCO ARAMCO 8 - UCH SOUTH', city: 'BAHAWALPUR', address: 'BAHAWALPUR' },
  { name: 'COCO ARAMCO 9 - RASHID MINHAS', city: 'KARACHI', address: 'KARACHI' },
  { name: 'COCO ARAMCO 10 - WAHDAT', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 11 - FAISALABAD', city: 'FAISALABAD', address: 'FAISALABAD' },
  { name: 'COCO ARAMCO 12 - SABZAZAR', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 13 - FAISAL TOWN', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 14 - GUJRANWALA', city: 'GUJRANWALA', address: 'GUJRANWALA' },
  { name: 'COCO ARAMCO 15 - MULTAN', city: 'MULTAN', address: 'MULTAN' },
  { name: 'COCO ARAMCO 16 - SIALKOT', city: 'SIALKOT', address: 'SIALKOT' },
  { name: 'COCO ARAMCO 17 - KAHNEWAL', city: 'KHANEWAL', address: 'KHANEWAL' },
  { name: 'COCO ARAMCO 18 - SADAR LAHORE', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 19 - LYALPUR FAISALABAD', city: 'FAISALABAD', address: 'FAISALABAD' },
  { name: 'COCO ARAMCO 20 - G1 JOHAR TOWN', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 21 SARAI ALAMGIR', city: 'SARAI ALAMGIR', address: 'SARAI ALAMGIR' },
  { name: 'COCO ARAMCO 22 SARGODHA ROAD', city: 'FAISALABAD', address: 'FAISALABAD' },
  { name: 'COCO ARAMCO 23 - WALTON', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 24 - MK', city: 'KARACHI', address: 'KARACHI' },
  { name: 'COCO ARAMCO 25 - ATTOCK', city: 'ATTOCK', address: 'ATTOCK' },
  { name: 'COCO ARAMCO 26 - TIPU ROAD', city: 'RAWALPINDI', address: 'RAWALPINDI' },
  { name: 'COCO ARAMCO 27 - LODHRAN', city: 'LODHRAN', address: 'LODHRAN' },
  { name: 'COCO ARAMCO 28 - RAIWIND', city: 'RAIWIND', address: 'RAIWIND' },
  { name: 'COCO Aramco 29 - SARGODHA', city: 'SARGODHA', address: 'SARGODHA' },
  { name: 'COCO Aramco 30 - HARRAPA', city: 'HARRAPA', address: 'HARRAPA' },
  { name: 'COCO Aramco 31 - COLLEGE ROAD', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 32 - ferozpur road', city: 'Lahore', address: 'Lahore' },
  { name: 'COCO ARAMCO 33 - Shadman', city: 'Lahore', address: 'Lahore' },
  { name: 'COCO ARAMCO 34 - Bhalwal', city: 'BHALWAL', address: 'BHALWAL' },
  { name: 'COCO Aramco 35 - CANAL ROAD', city: 'Faisalabad', address: 'Faisalabad' },
  { name: 'COCO Aramco 36 - UET', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO Aramco 37 - SARGODHA ROAD', city: 'FAISALABAD', address: 'FAISALABAD' },
  { name: 'COCO ARAMCO 38 - CHUNG', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 39 - GUJRANWALA 2', city: 'GUJRANWALA', address: 'GUJRANWALA' },
  { name: 'COCO ARAMCO 40 - Phool nagar', city: 'Phoolnagar', address: 'Phoolnagar' },
  { name: 'COCO ARAMCO 41 - Charsadda', city: 'Charsadda', address: 'Charsadda' },
  { name: 'COCO ARAMCO 42 - Bahwal Nagar', city: 'Bahawal Nagar', address: 'Bahawal Nagar' },
  { name: 'COCO ARAMCO 43 - rawalpindi PAF Jinnah complex', city: 'RAWALPINDI', address: 'RAWALPINDI' },
  { name: 'COCO ARAMCO 44 - Moon Market lahore', city: 'LAHORE', address: 'LAHORE' },
  { name: 'COCO ARAMCO 45 - Nazimabad', city: 'Karachi', address: 'Karachi' },
  { name: 'COCO ARAMCO 46- Mangalla', city: 'Mangalla adjacent to CSD Cantt', address: 'Mangalla adjacent to CSD Cantt' },
  { name: 'COCO ARAMCO 47 - Wireless Gate', city: 'Shahrah e faisal', address: 'Shahrah e faisal' },
  { name: 'COCO ARAMCO 48- Sialkot 2', city: 'Hajipura road', address: 'Hajipura road' },
  { name: 'COCO ARAMCO 49- Sahiwal', city: 'Main Faisalabad RD', address: 'Main Faisalabad RD' },
  { name: 'COCO ARAMCO 50 - Islamabad Srinagar Highway', city: 'ISLAMABAD', address: 'ISLAMABAD' },
  { name: 'COCO ARAMCO 51 - Chiniot', city: 'FAISALABAD', address: 'FAISALABAD' },
];

async function seed() {
  const logger = new Logger('DatabaseSeed');
  
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const stationRepository = AppDataSource.getRepository(Station);

    // Create admin user
    const adminEmail = 'shahnawaz.khan@gno.com.pk';
    const adminPassword = 'GOPAK';
    let adminUser = await userRepository.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
      adminUser = userRepository.create({
        email: adminEmail,
        name: 'Shahnawaz Khan',
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        isActive: true,
        isVerified: true,
        provider: 'local',
      });
      await userRepository.save(adminUser);
      logger.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      // Update password if user exists
      const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
      await userRepository.update(adminUser.id, {
        passwordHash: adminPasswordHash,
        name: 'Shahnawaz Khan',
      });
      logger.log(`ℹ️  Admin user password updated: ${adminEmail}`);
    }

    // Create stations
    let createdCount = 0;
    let existingCount = 0;

    for (const stationData of stations) {
      const stationCode = `ARAMCO-${stations.indexOf(stationData) + 1}`;
      let station = await stationRepository.findOne({ where: { stationCode } });

      if (!station) {
        station = stationRepository.create({
          name: stationData.name,
          stationCode,
          city: stationData.city,
          address: stationData.address,
          isActive: true,
        });
        await stationRepository.save(station);
        createdCount++;
      } else {
        existingCount++;
      }
    }

    logger.log(`✅ Stations: ${createdCount} created, ${existingCount} already existed`);
    logger.log('✅ Database seeding completed!');

    await AppDataSource.destroy();
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

