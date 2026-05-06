import Repository from '../models/Repository.js';

// @desc    Get all repositories
// @route   GET /api/repositories
// @access  Private
export const getRepositories = async (req, res) => {
    try {
        const repositories = await Repository.find({});
        res.status(200).json(repositories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a repository
// @route   POST /api/repositories
// @access  Private
export const createRepository = async (req, res) => {
    try {
        const repository = await Repository.create(req.body);
        res.status(201).json(repository);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};