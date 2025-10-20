import mongoose, { Document, Schema } from "mongoose";

export interface ICase extends Document {
  requestId: number;
  landId: number;
  fromAddress: string;
  toAddress: string;
  inspectorAddress?: string;

  status:
    | "pending"
    | "inspection_scheduled"
    | "inspected"
    | "approved"
    | "rejected"
    | "completed";
  documents: Array<{
    type: string;
    ipfsHash: string;
    uploadedAt: Date;
    filename?: string;
    size?: number;
  }>;
  inspectionReport?: {
    ipfsHash: string;
    submittedAt: Date;
    recommendation: "approve" | "reject";
    notes?: string;
  };
  notifications: Array<{
    message: string;
    sentAt: Date;
    recipients: string[];
    type: "info" | "warning" | "success" | "error";
  }>;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addNotification(
    message: string,
    recipients: string[],
    type?: string
  ): Promise<ICase>;
  updateStatus(newStatus: string, reason?: string): Promise<ICase>;
}

const CaseSchema: Schema = new Schema(
  {
    requestId: {
      type: Number,
      required: true,
      unique: true,
    },
    landId: {
      type: Number,
      required: true,
    },
    fromAddress: {
      type: String,
      required: true,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    toAddress: {
      type: String,
      required: true,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },
    inspectorAddress: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "inspection_scheduled",
        "inspected",
        "approved",
        "rejected",
        "completed",
      ],
      default: "pending",
    },
    documents: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            "property_deed",
            "survey_report",
            "tax_receipt",
            "identity_proof",
            "other",
          ],
        },
        ipfsHash: {
          type: String,
          required: true,
          match: /^Qm[a-zA-Z0-9]{44}$/,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        filename: String,
        size: Number,
      },
    ],
    inspectionReport: {
      ipfsHash: {
        type: String,
        match: /^Qm[a-zA-Z0-9]{44}$/,
      },
      submittedAt: Date,
      recommendation: {
        type: String,
        enum: ["approve", "reject"],
      },
      notes: String,
    },
    notifications: [
      {
        message: {
          type: String,
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        recipients: [
          {
            type: String,
            match: /^0x[a-fA-F0-9]{40}$/,
          },
        ],
        type: {
          type: String,
          enum: ["info", "warning", "success", "error"],
          default: "info",
        },
      },
    ],
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes (removed duplicate requestId index since it's already unique)
CaseSchema.index({ landId: 1 });
CaseSchema.index({ fromAddress: 1 });
CaseSchema.index({ toAddress: 1 });
CaseSchema.index({ inspectorAddress: 1 });
CaseSchema.index({ status: 1 });
CaseSchema.index({ createdAt: -1 });

// Methods
CaseSchema.methods.addNotification = function (
  message: string,
  recipients: string[],
  type: string = "info"
) {
  this.notifications.push({
    message,
    recipients,
    type,
    sentAt: new Date(),
  });
  return this.save();
};

CaseSchema.methods.updateStatus = function (
  newStatus: string,
  reason?: string
) {
  this.status = newStatus;
  if (reason) {
    this.rejectionReason = reason;
  }
  return this.save();
};

export default mongoose.model<ICase>("Case", CaseSchema);
