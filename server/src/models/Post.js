import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500,
  },
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
