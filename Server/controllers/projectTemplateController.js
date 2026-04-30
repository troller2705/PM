import ProjectTemplate from '../models/ProjectTemplate.js';

export const getProjectTemplates = async (req, res) => {
  try {
    const templates = await ProjectTemplate.find({}).sort({ created_date: -1 });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectTemplateById = async (req, res) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);
    if (template) {
      res.status(200).json(template);
    } else {
      res.status(404).json({ message: 'Project Template not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProjectTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.create(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProjectTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);
    if (template) {
      Object.assign(template, req.body);
      const updatedTemplate = await template.save();
      res.status(200).json(updatedTemplate);
    } else {
      res.status(404).json({ message: 'Project Template not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProjectTemplate = async (req, res) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);
    if (template) {
      await template.deleteOne();
      res.status(200).json({ message: 'Project Template removed' });
    } else {
      res.status(404).json({ message: 'Project Template not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};