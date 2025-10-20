import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  surveyId: string;
  location: string;
  propertyType: 'Agricultural' | 'Residential' | 'Commercial' | 'Industrial';
  area: number;
  areaUnit: 'sq ft' | 'sq yard' | 'acre';
  priceInWei: string;
  priceInINR: number;
  owner: mongoose.Types.ObjectId;
  ownerAddress: string;
  forSale: boolean;
  status: 'active' | 'sold' | 'transferred';
  documentHashes: string[];
  hasDocuments: {
    saleDeed: boolean;
    taxReceipt: boolean;
    noc: boolean;
    propertyPhoto: boolean;
  };
  blockchainTxHash?: string;
  contractAddress?: string;
  
  // Verification fields (merged from PropertyVerification)
  verificationId?: number;
  verificationStatus?: 'pending' | 'assigned' | 'inspection_scheduled' | 'inspected' | 'verified' | 'rejected';
  inspectorAddress?: string;
  verificationDocuments?: Array<{
    type: string;
    ipfsHash: string;
    uploadedAt: Date;
    filename?: string;
    size?: number;
  }>;
  inspectionReport?: {
    ipfsHash: string;
    submittedAt: Date;
    recommendation: 'approve' | 'reject';
    notes?: string;
    gpsLocation?: string;
    visitDate?: string;
    verificationChecklist?: {
      propertyVisited: boolean;
      documentsVerified: boolean;
      boundariesChecked: boolean;
      ownershipConfirmed: boolean;
    };
  };
  verificationNotifications?: Array<{
    message: string;
    sentAt: Date;
    recipients: string[];
    type: 'info' | 'warning' | 'success' | 'error';
  }>;
  rejectionReason?: string;
  verificationCreatedAt?: Date;
  verificationUpdatedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addVerificationNotification?(message: string, recipients: string[], type?: string): Promise<IProperty>;
  updateVerificationStatus?(newStatus: string, reason?: string): Promise<IProperty>;
}

const PropertySchema: Schema = new Schema({
  surveyId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['Agricultural', 'Residential', 'Commercial', 'Industrial']
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  areaUnit: {
    type: String,
    required: true,
    enum: ['sq ft', 'sq yard', 'acre']
  },
  priceInWei: {
    type: String,
    required: true
  },
  priceInINR: {
    type: Number,
    default: 0,
    min: 0
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  forSale: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'transferred'],
    default: 'active',
    index: true
  },
  documentHashes: [{
    type: String,
    required: true
  }],
  hasDocuments: {
    saleDeed: {
      type: Boolean,
      default: false
    },
    taxReceipt: {
      type: Boolean,
      default: false
    },
    noc: {
      type: Boolean,
      default: false
    },
    propertyPhoto: {
      type: Boolean,
      default: false
    }
  },
  blockchainTxHash: {
    type: String,
    sparse: true
  },
  contractAddress: {
    type: String,
    lowercase: true
  },
  
  // Verification fields (merged from PropertyVerification)
  verificationId: {
    type: Number,
    sparse: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'assigned', 'inspection_scheduled', 'inspected', 'verified', 'rejected'],
    index: true
  },
  inspectorAddress: {
    type: String,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['property_deed', 'survey_report', 'tax_receipt', 'identity_proof', 'ownership_proof', 'other']
    },
    ipfsHash: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    filename: String,
    size: Number
  }],
  inspectionReport: {
    ipfsHash: String,
    submittedAt: Date,
    recommendation: {
      type: String,
      enum: ['approve', 'reject']
    },
    notes: String,
    gpsLocation: String,
    visitDate: String,
    verificationChecklist: {
      propertyVisited: {
        type: Boolean,
        default: false
      },
      documentsVerified: {
        type: Boolean,
        default: false
      },
      boundariesChecked: {
        type: Boolean,
        default: false
      },
      ownershipConfirmed: {
        type: Boolean,
        default: false
      }
    }
  },
  verificationNotifications: [{
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    recipients: [{
      type: String,
      match: /^0x[a-fA-F0-9]{40}$/
    }],
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info'
    }
  }],
  rejectionReason: String,
  verificationCreatedAt: Date,
  verificationUpdatedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
PropertySchema.index({ propertyType: 1, forSale: 1 });
PropertySchema.index({ location: 'text' });
PropertySchema.index({ priceInWei: 1 });
PropertySchema.index({ createdAt: -1 });

// Virtual for formatted price
PropertySchema.virtual('formattedPrice').get(function() {
  try {
    const ethers = require('ethers');
    return ethers.formatEther(this.priceInWei);
  } catch {
    return '0';
  }
});

// Pre-save middleware to validate document hashes
PropertySchema.pre('save', function(next) {
  const docHashes = this.documentHashes as string[];
  if (docHashes && docHashes.length > 0) {
    (this as any).hasDocuments.saleDeed = docHashes.length >= 1;
    (this as any).hasDocuments.taxReceipt = docHashes.length >= 2;
    (this as any).hasDocuments.noc = docHashes.length >= 3;
    (this as any).hasDocuments.propertyPhoto = docHashes.length >= 4;
  }
  next();
});

// Static method to find properties for sale
PropertySchema.statics.findForSale = function() {
  return this.find({ forSale: true, status: 'active' })
    .populate('owner', 'name walletAddress')
    .sort({ createdAt: -1 });
};

// Static method to find properties by owner
PropertySchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ owner: ownerId })
    .sort({ createdAt: -1 });
};

// Static method to search properties
PropertySchema.statics.searchProperties = function(query: any) {
  const filter: any = {};
  
  if (query.propertyType) {
    filter.propertyType = query.propertyType;
  }
  
  if (query.forSale !== undefined) {
    filter.forSale = query.forSale;
  }
  
  if (query.minPrice || query.maxPrice) {
    filter.priceInWei = {};
    if (query.minPrice) {
      filter.priceInWei.$gte = query.minPrice;
    }
    if (query.maxPrice) {
      filter.priceInWei.$lte = query.maxPrice;
    }
  }
  
  if (query.location) {
    filter.$text = { $search: query.location };
  }
  
  return this.find(filter)
    .populate('owner', 'name walletAddress')
    .sort({ createdAt: -1 });
};

// Static method to find pending verifications
PropertySchema.statics.findPendingVerifications = function() {
  return this.find({ verificationStatus: 'pending' })
    .populate('owner', 'profile walletAddress')
    .sort({ verificationCreatedAt: -1 });
};

// Static method to find properties by verification status
PropertySchema.statics.findByVerificationStatus = function(status: string) {
  return this.find({ verificationStatus: status })
    .populate('owner', 'profile walletAddress')
    .sort({ verificationUpdatedAt: -1 });
};

// Instance method to add verification notification
PropertySchema.methods.addVerificationNotification = function(message: string, recipients: string[], type: string = 'info') {
  if (!this.verificationNotifications) {
    this.verificationNotifications = [];
  }
  this.verificationNotifications.push({
    message,
    recipients,
    type,
    sentAt: new Date()
  });
  return this.save();
};

// Instance method to update verification status
PropertySchema.methods.updateVerificationStatus = function(newStatus: string, reason?: string) {
  this.verificationStatus = newStatus;
  this.verificationUpdatedAt = new Date();
  if (reason) {
    this.rejectionReason = reason;
  }
  return this.save();
};

export const Property = mongoose.model<IProperty>('Property', PropertySchema);