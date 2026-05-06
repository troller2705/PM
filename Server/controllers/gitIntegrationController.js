import GitIntegration from '../models/GitIntegration.js';
export const getGitIntegrations = async (req, res) => {
    try { res.json(await GitIntegration.find({})); }
    catch (error) { res.status(500).json({ message: error.message }); }
};
export const createGitIntegration = async (req, res) => {
    try { res.status(201).json(await GitIntegration.create(req.body)); }
    catch (error) { res.status(400).json({ message: error.message }); }
};