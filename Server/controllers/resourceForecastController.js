import ResourceForecast from '../models/ResourceForecast.js';
export const getResourceForecasts = async (req, res) => {
    try { res.json(await ResourceForecast.find({})); }
    catch (error) { res.status(500).json({ message: error.message }); }
};
export const createResourceForecast = async (req, res) => {
    try { res.status(201).json(await ResourceForecast.create(req.body)); }
    catch (error) { res.status(400).json({ message: error.message }); }
};