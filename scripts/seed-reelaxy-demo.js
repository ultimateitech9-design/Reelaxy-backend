// Seeds demo member profiles for local Reelaxy development (Discover grid).
// Safe to re-run: profiles are matched by email and updated in place.
// Usage: npm run db:seed:demo
const path = require('path');
const { randomUUID } = require('crypto');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEMO_PASSWORD = process.env.REELAXY_DEMO_PASSWORD || 'Reelaxy@123';
const EMAIL_DOMAIN = 'demo.reelaxy.test';

const CITIES = [
  ['Mumbai', 19.076, 72.8777], ['Delhi', 28.6139, 77.209], ['Bengaluru', 12.9716, 77.5946],
  ['Pune', 18.5204, 73.8567], ['Hyderabad', 17.385, 78.4867], ['Jaipur', 26.9124, 75.7873],
  ['Kolkata', 22.5726, 88.3639], ['Chennai', 13.0827, 80.2707], ['Ahmedabad', 23.0225, 72.5714],
  ['Lucknow', 26.8467, 80.9462], ['Chandigarh', 30.7333, 76.7794], ['Indore', 22.7196, 75.8577],
];
const WOMEN = ['Aanya', 'Meera', 'Ishita', 'Kavya', 'Riya', 'Sanya', 'Tanvi', 'Diya', 'Pooja', 'Nisha', 'Simran', 'Aditi', 'Neha', 'Zoya', 'Anjali', 'Shreya'];
const MEN = ['Kabir', 'Rohan', 'Arjun', 'Vihaan', 'Aditya', 'Karan', 'Rahul', 'Siddharth', 'Aman', 'Dev', 'Nikhil', 'Yash', 'Varun', 'Ishaan', 'Harsh', 'Rishi'];
const PROFESSIONS = ['Software Engineer', 'Product Designer', 'Doctor', 'Chartered Accountant', 'Teacher', 'Marketing Manager', 'Photographer', 'Architect', 'Data Analyst', 'Entrepreneur', 'Lawyer', 'Content Creator', 'Chef', 'Fitness Coach', 'Journalist', 'Banker'];
const GOALS = ['Long-term', 'Casual', 'Friendships', 'Not sure yet'];
const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Spiritual', 'Prefer not to say'];
const INTERESTS = ['Travel', 'Music', 'Movies', 'Fitness', 'Food', 'Books', 'Photography', 'Cricket', 'Dance', 'Gaming', 'Art', 'Yoga', 'Coffee', 'Trekking', 'Fashion', 'Tech'];
const PERSONALITY = ['Cheerful', 'Curious', 'Calm', 'Adventurous', 'Witty', 'Caring', 'Ambitious', 'Creative', 'Honest', 'Easygoing'];
const HOBBIES = ['Cooking', 'Guitar', 'Painting', 'Cycling', 'Reading', 'Singing', 'Badminton', 'Baking', 'Blogging', 'Gardening'];
const BIOS = [
  'Weekend trekker, weekday coffee addict. Looking for good conversations and better playlists.',
  'I talk a lot about food and travel. Tell me your favourite street snack and we are friends.',
  'Calm on the outside, planning my next trip on the inside. Say hi!',
  'New to the city and exploring one cafe at a time. Recommendations welcome.',
  'Gym in the morning, movies at night. Looking for someone who can make me laugh.',
  'Books, chai and long walks. Bonus points if you can sing badly with me.',
  'Work hard, travel harder. Let us swap stories over a video call first.',
  'Simple person, big dreams. Here to meet genuine people and see where it goes.',
];
const HEIGHTS_W = ['5\'1"', '5\'3"', '5\'4"', '5\'5"', '5\'6"', '5\'7"'];
const HEIGHTS_M = ['5\'8"', '5\'9"', '5\'10"', '5\'11"', '6\'0"', '6\'1"'];

const pick = (list, i) => list[i % list.length];
const pickMany = (list, i, count) => Array.from({ length: count }, (_, k) => list[(i * 3 + k * 5) % list.length]).filter((v, k, all) => all.indexOf(v) === k);

function birthDateFor(index) {
  const age = 21 + (index * 7) % 14; // 21..34
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  date.setMonth((index * 5) % 12, 1 + (index * 3) % 27);
  return date.toISOString().slice(0, 10);
}

function buildProfiles() {
  const profiles = [];
  const add = (name, gender, i, photoFolder) => {
    const [city, lat, lng] = pick(CITIES, i + (gender === 'Male' ? 5 : 0));
    // Spread people a few km around the city centre so distances look real.
    const jitter = (seed) => (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.12;
    profiles.push({
      name,
      email: `${name.toLowerCase()}.${gender === 'Male' ? 'm' : 'f'}${i + 1}@${EMAIL_DOMAIN}`,
      gender,
      birthDate: birthDateFor(i + (gender === 'Male' ? 3 : 0)),
      profession: pick(PROFESSIONS, i * 3 + (gender === 'Male' ? 1 : 0)),
      height: pick(gender === 'Male' ? HEIGHTS_M : HEIGHTS_W, i),
      city,
      lat: lat + jitter(i + 11),
      lng: lng + jitter(i + 29),
      interests: pickMany(INTERESTS, i + (gender === 'Male' ? 2 : 0), 4),
      personality: pickMany(PERSONALITY, i, 3),
      hobbies: pickMany(HOBBIES, i + 1, 3),
      bio: pick(BIOS, i + (gender === 'Male' ? 4 : 0)),
      goal: pick(GOALS, i),
      religion: pick(RELIGIONS, i * 2),
      photos: [`https://randomuser.me/api/portraits/${photoFolder}/${(i * 7 + 3) % 90}.jpg`],
      verified: i % 3 !== 2,
      online: i % 4 === 0,
    });
  };
  WOMEN.forEach((name, i) => add(name, 'Female', i, 'women'));
  MEN.forEach((name, i) => add(name, 'Male', i, 'men'));
  return profiles;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME || 'reelaxy',
  });
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const profiles = buildProfiles();
  let created = 0;
  let updated = 0;

  for (const p of profiles) {
    const values = [
      p.name, hash, p.birthDate, p.gender, p.profession, p.height, p.city, p.lat, p.lng,
      JSON.stringify(p.interests), JSON.stringify(p.personality), p.bio, JSON.stringify(p.photos), JSON.stringify(p.hobbies),
      p.verified ? 1 : 0, p.verified ? 1 : 0, p.online ? 1 : 0, p.goal, p.religion,
    ];
    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [p.email]);
    if (rows.length) {
      await connection.execute(
        `UPDATE users SET name=?, password=?, birthDate=?, gender=?, profession=?, height=?, city=?, locationLatitude=?, locationLongitude=?,
          interests=?, personalityWords=?, bio=?, photos=?, hobbies=?, isVerified=?, kycMatched=?, isOnline=?, relationshipGoal=?, religion=?,
          status='active', role='user', onboardingCompleted=1, isGuest=0, lastSeen=NOW()
         WHERE id=?`,
        [...values, rows[0].id],
      );
      updated += 1;
    } else {
      await connection.execute(
        `INSERT INTO users (id, email, name, password, birthDate, gender, profession, height, city, locationLatitude, locationLongitude,
          interests, personalityWords, bio, photos, hobbies, isVerified, kycMatched, isOnline, relationshipGoal, religion,
          plan, status, role, onboardingCompleted, emailVerifiedAt, lastSeen, isGuest)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'free', 'active', 'user', 1, NOW(), NOW(), 0)`,
        [randomUUID(), p.email, ...values],
      );
      created += 1;
    }
  }

  await connection.end();
  console.log(`Demo profiles ready: ${created} created, ${updated} updated (${profiles.length} total).`);
  console.log(`Log in as any of them with email like ${profiles[0].email} and password: ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error('Failed to seed Reelaxy demo profiles:', error.message);
  process.exit(1);
});
