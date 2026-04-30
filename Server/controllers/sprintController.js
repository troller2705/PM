import Sprint from '../models/Sprint.js';

export const getSprints = async (req, res) => {
  try {
    const filter = req.query.project_id ? { project_id: req.query.project_id } : {};
    const sprints = await Sprint.find(filter);
    res.status(200).json(sprints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (sprint) {
      res.status(200).json(sprint);
    } else {
      res.status(404).json({ message: 'Sprint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSprint = async (req, res) => {
  try {
    const sprint = await Sprint.create(req.body);
    res.status(201).json(sprint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (sprint) {
      Object.assign(sprint, req.body);
      const updatedSprint = await sprint.save();
      res.status(200).json(updatedSprint);
    } else {
      res.status(404).json({ message: 'Sprint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (sprint) {
      await sprint.deleteOne();
      res.status(200).json({ message: 'Sprint removed' });
    } else {
      res.status(404).json({ message: 'Sprint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};