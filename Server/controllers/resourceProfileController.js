import ResourceProfile from '../models/ResourceProfile.js';

export const getResourceProfiles = async (req, res) => {
  try {
    const profiles = await ResourceProfile.find({});
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResourceProfileById = async (req, res) => {
  try {
    const profile = await ResourceProfile.findById(req.params.id);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ message: 'Resource Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createResourceProfile = async (req, res) => {
  try {
    const profile = await ResourceProfile.create(req.body);
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateResourceProfile = async (req, res) => {
  try {
    const profile = await ResourceProfile.findById(req.params.id);
    if (profile) {
      Object.assign(profile, req.body);
      const updatedProfile = await profile.save();
      res.status(200).json(updatedProfile);
    } else {
      res.status(404).json({ message: 'Resource Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteResourceProfile = async (req, res) => {
  try {
    const profile = await ResourceProfile.findById(req.params.id);
    if (profile) {
      await profile.deleteOne();
      res.status(200).json({ message: 'Resource Profile removed' });
    } else {
      res.status(404).json({ message: 'Resource Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};