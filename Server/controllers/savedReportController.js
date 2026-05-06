import SavedReport from '../models/SavedReport.js';
export const getSavedReports = async (req, res) => {
    try { res.json(await SavedReport.find({})); }
    catch (error) { res.status(500).json({ message: error.message }); }
};
export const createSavedReport = async (req, res) => {
    try { res.status(201).json(await SavedReport.create(req.body)); }
    catch (error) { res.status(400).json({ message: error.message }); }
};