import mongoose from 'mongoose';

const savedReportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    report_type: { type: String, required: true },
    schedule: { type: String, default: 'none' },
    is_pinned: { type: Boolean, default: false },
    email_recipients: [String]
});

export default mongoose.model('SavedReport', savedReportSchema);