import Milestone from '../models/Milestone.js';

// @desc    Get all milestones
// @route   GET /api/milestones
// @access  Private
export const getMilestones = async (req, res) => {
  try {
    const filter = req.query.project_id ? { project_id: req.query.project_id } : {};
    const milestones = await Milestone.find(filter);
    res.status(200).json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single milestone by ID
// @route   GET /api/milestones/:id
// @access  Private
export const getMilestoneById = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (milestone) {
      res.status(200).json(milestone);
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new milestone
// @route   POST /api/milestones
// @access  Private
export const createMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.create(req.body);
    res.status(201).json(milestone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a milestone
// @route   PUT /api/milestones/:id
// @access  Private
export const updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (milestone) {
      Object.assign(milestone, req.body);
      const updatedMilestone = await milestone.save();
      res.status(200).json(updatedMilestone);
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a milestone
// @route   DELETE /api/milestones/:id
// @access  Private
export const deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (milestone) {
      await milestone.deleteOne();
      res.status(200).json({ message: 'Milestone removed' });
    } else {
      res.status(404).json({ message: 'Milestone not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};