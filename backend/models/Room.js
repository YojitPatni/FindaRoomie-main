const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a room title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a room description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide an address'],
      maxlength: [200, 'Address cannot be more than 200 characters']
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      required: [true, 'Please provide a state'],
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'Please provide a zip code'],
      match: [/^\d{6}$/, 'Please provide a valid 6-digit zip code']
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  rent: {
    amount: {
      type: Number,
      required: [true, 'Please provide rent amount'],
      min: [0, 'Rent cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    period: {
      type: String,
      enum: ['monthly', 'weekly', 'daily'],
      default: 'monthly'
    }
  },
  roomDetails: {
    type: {
      type: String,
      enum: ['single', 'shared', 'studio', '1bhk', '2bhk', '3bhk'],
      required: [true, 'Please specify room type']
    },
    size: {
      type: Number,
      min: [50, 'Room size must be at least 50 sq ft']
    },
    furnished: {
      type: String,
      enum: ['fully', 'semi', 'unfurnished'],
      default: 'unfurnished'
    },
    bathrooms: {
      type: Number,
      min: [1, 'Must have at least 1 bathroom'],
      default: 1
    },
    balcony: {
      type: Boolean,
      default: false
    },
    parking: {
      type: Boolean,
      default: false
    }
  },
  amenities: [{
    type: String,
    enum: [
      'wifi', 'ac', 'washing_machine', 'refrigerator', 'microwave',
      'tv', 'gym', 'swimming_pool', 'security', 'elevator',
      'power_backup', 'water_supply', 'cleaning_service'
    ]
  }],
  preferences: {
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    },
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 60 }
    },
    occupation: {
      type: String,
      enum: ['student', 'professional', 'any'],
      default: 'any'
    },
    smoking: {
      type: String,
      enum: ['allowed', 'not_allowed', 'outside_only'],
      default: 'not_allowed'
    },
    drinking: {
      type: String,
      enum: ['allowed', 'not_allowed', 'social_only'],
      default: 'social_only'
    },
    pets: {
      type: String,
      enum: ['allowed', 'not_allowed', 'cats_only', 'dogs_only'],
      default: 'not_allowed'
    }
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, maxlength: 100 }
  }],
  availability: {
    availableFrom: {
      type: Date,
      required: [true, 'Please provide availability date']
    },
    leaseDuration: {
      min: { type: Number, default: 1 }, 
      max: { type: Number, default: 12 }
    }
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'pending', 'inactive'],
    default: 'available'
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  capacity: {
    type: Number,
    default: 1,
    min: 1
  },
  tenants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

roomSchema.index({ 'location.city': 1, 'location.state': 1 });
roomSchema.index({ 'rent.amount': 1 });
roomSchema.index({ 'roomDetails.type': 1 });
roomSchema.index({ status: 1, isActive: 1 });
roomSchema.index({ owner: 1 });
roomSchema.index({ createdAt: -1 });

roomSchema.index({
  title: 'text',
  description: 'text',
  'location.address': 'text',
  'location.city': 'text'
});

roomSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}`;
});

roomSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('Room', roomSchema);
