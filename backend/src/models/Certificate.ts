import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  landId: number;
  ownerAddress: string;
  certificateHash: string; // IPFS hash of PDF
  blockchainTxHash: string;
  issuedAt: Date;
  metadata: {
    landArea: string;
    location: string;
    surveyNumber: string;
    registrationDate: Date;
    previousOwner?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema: Schema = new Schema({
  landId: {
    type: Number,
    required: true,
    unique: true
  },
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  certificateHash: {
    type: String,
    required: true,
    match: /^Qm[a-zA-Z0-9]{44}$/ // IPFS hash pattern
  },
  blockchainTxHash: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{64}$/ // Ethereum transaction hash
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    landArea: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    surveyNumber: {
      type: String,
      required: true
    },
    registrationDate: {
      type: Date,
      required: true
    },
    previousOwner: {
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/
    }
  }
}, {
  timestamps: true
});

// Indexes
CertificateSchema.index({ landId: 1 });
CertificateSchema.index({ ownerAddress: 1 });
CertificateSchema.index({ blockchainTxHash: 1 });
CertificateSchema.index({ issuedAt: -1 });

// Methods
CertificateSchema.methods.toJSON = function() {
  const certificate = this.toObject();
  delete certificate.__v;
  return certificate;
};

// Static methods
CertificateSchema.statics.findByOwner = function(ownerAddress: string) {
  return this.find({ ownerAddress: ownerAddress.toLowerCase() });
};

CertificateSchema.statics.findByLand = function(landId: number) {
  return this.findOne({ landId });
};

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);