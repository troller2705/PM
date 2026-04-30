import SystemSettings from '../models/SystemSettings.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.find({});
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSetting = async (req, res) => {
  try {
    const setting = await SystemSettings.create(req.body);
    res.status(201).json(setting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const setting = await SystemSettings.findById(req.params.id);
    if (setting) {
      Object.assign(setting, req.body);
      const updatedSetting = await setting.save();
      res.status(200).json(updatedSetting);
    } else {
      res.status(404).json({ message: 'Setting not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSetting = async (req, res) => {
  try {
    const setting = await SystemSettings.findById(req.params.id);
    if (setting) {
      await setting.deleteOne();
      res.status(200).json({ message: 'Setting removed' });
    } else {
      res.status(404).json({ message: 'Setting not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};