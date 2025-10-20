import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  role: 'user' | 'admin' | 'inspector';
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    kycDocuments: {
      aadhaar?: string; // IPFS hash
      pan?: string; // IPFS hash
      verified: boolean;
      rejectionReason?: string; // Reason for rejection if KYC is rejected
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'inspector'],
    default: 'user'
  },
  profile: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      type: String,
      trim: true,
      match: /^[+]?[\d\s\-()]+$/
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      match: /^\d{12}$/ // 12 digit Aadhaar number
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ // PAN format: ABCDE1234F
    },
    kycDocuments: {
      aadhaar: {
        type: String,
        match: /^Qm[a-zA-Z0-9]{44}$/ // IPFS hash pattern
      },
      pan: {
        type: String,
        match: /^Qm[a-zA-Z0-9]{44}$/ // IPFS hash pattern
      },
      verified: {
        type: Boolean,
        default: false
      },
      rejectionReason: {
        type: String
      }
    }
  }
}, {
  timestamps: true
});

// Indexes (removed duplicate walletAddress index since it's already unique)
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.email': 1 });

// Methods
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

export default mongoose.model<IUser>('User', UserSchema);