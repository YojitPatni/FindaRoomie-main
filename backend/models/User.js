const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number']
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18'],
    max: [100, 'Age cannot be more than 100']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please specify gender']
  },
  occupation: {
    type: String,
    maxlength: [100, 'Occupation cannot be more than 100 characters']
  },
  preferences: {
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100000 }
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot be more than 100 characters']
    },
    roomType: {
      type: String,
      enum: ['single', 'shared', 'any'],
      default: 'any'
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ 'preferences.location': 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastActive = function() {
  this.lastActive = Date.now();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
