const mongoose = require('mongoose');
require('dotenv').config();

const RollNumberSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const RollNumber = mongoose.models.RollNumber || mongoose.model('RollNumber', RollNumberSchema);

async function seedRollNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedback');
    console.log('Connected to MongoDB');

    // Clear existing roll numbers
    await RollNumber.deleteMany({});
    console.log('Cleared existing roll numbers');

    // Create 20 roll number records
    const rollNumbers = Array.from({ length: 40 }, (_, i) => ({
      rollNumber: String(i + 1),
      feedbackCount: 0,
    }));

    const result = await RollNumber.insertMany(rollNumbers);
    console.log(`✓ Successfully seeded ${result.length} roll number records (1-20)`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedRollNumbers();
