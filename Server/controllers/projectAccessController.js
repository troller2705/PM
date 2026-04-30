import ProjectAccess from '../models/ProjectAccess.js';

export const getProjectAccess = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project_id) filter.project_id = req.query.project_id;
    if (req.query.user_id) filter.user_id = req.query.user_id;
    
    const access = await ProjectAccess.find(filter);
    res.status(200).json(access);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProjectAccess = async (req, res) => {
  try {
    const access = await ProjectAccess.create(req.body);
    res.status(201).json(access);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProjectAccess = async (req, res) => {
  try {
    const access = await ProjectAccess.findById(req.params.id);
    if (access) {
      Object.assign(access, req.body);
      const updatedAccess = await access.save();
      res.status(200).json(updatedAccess);
    } else {
      res.status(404).json({ message: 'Project Access not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProjectAccess = async (req, res) => {
  try {
    const access = await ProjectAccess.findById(req.params.id);
    if (access) {
      await access.deleteOne();
      res.status(200).json({ message: 'Project Access removed' });
    } else {
      res.status(404).json({ message: 'Project Access not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};