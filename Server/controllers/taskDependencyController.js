import TaskDependency from '../models/TaskDependency.js';

export const getTaskDependencies = async (req, res) => {
  try {
    const filter = req.query.task_id ? { task_id: req.query.task_id } : {};
    const dependencies = await TaskDependency.find(filter);
    res.status(200).json(dependencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskDependencyById = async (req, res) => {
  try {
    const dependency = await TaskDependency.findById(req.params.id);
    if (dependency) {
      res.status(200).json(dependency);
    } else {
      res.status(404).json({ message: 'Dependency not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTaskDependency = async (req, res) => {
  try {
    const dependency = await TaskDependency.create(req.body);
    res.status(201).json(dependency);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTaskDependency = async (req, res) => {
  try {
    const dependency = await TaskDependency.findById(req.params.id);
    if (dependency) {
      await dependency.deleteOne();
      res.status(200).json({ message: 'Dependency removed' });
    } else {
      res.status(404).json({ message: 'Dependency not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};