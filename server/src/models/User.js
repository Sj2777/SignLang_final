import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    minlength: 1,
    maxlength: 100,
  },
  organizationName: {
    type: String,
    trim: true,
    minlength: 1,
    maxlength: 120,
  },
  organizationType: {
    type: String,
    enum: ['school', 'NGO', 'company', 'interpreter agency', 'other'],
  },
  contactPersonName: {
    type: String,
    trim: true,
    minlength: 1,
    maxlength: 100,
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: 30,
  },
  website: {
    type: String,
    trim: true,
    maxlength: 2048,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  accountType: {
    type: String,
    enum: ['individual', 'organization'],
    required: true,
    immutable: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  profile: {
    type: profileSchema,
    required: true,
    validate: {
      validator(profile) {
        if (this.accountType === 'individual') {
          return Boolean(profile.fullName?.trim())
            && !profile.organizationName
            && !profile.organizationType
            && !profile.contactPersonName
            && !profile.contactPhone
            && !profile.website;
        }
        if (this.accountType === 'organization') {
          return Boolean(
            profile.organizationName?.trim()
            && profile.organizationType
            && profile.contactPersonName?.trim(),
          ) && !profile.fullName;
        }
        return false;
      },
      message: 'Profile fields must match the account type.',
    },
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export default mongoose.model('User', userSchema);
