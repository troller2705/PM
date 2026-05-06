import TimeLog from '../models/TimeLog.js';

// @desc    Get all time logs
// @route   GET /api/time-logs
// @access  Private
export const getTimeLogs = async (req, res) => {
    try {
        const timeLogs = await TimeLog.find({});
        res.status(200).json(timeLogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a time log
// @route   POST /api/time-logs
// @access  Private
export const createTimeLog = async (req, res) => {
    try {
        const timeLog = await TimeLog.create(req.body);
        res.status(201).json(timeLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};