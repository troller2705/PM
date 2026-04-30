import LDAPGroup from '../models/LDAPGroup.js';

export const getLDAPGroups = async (req, res) => {
  try {
    const groups = await LDAPGroup.find({});
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLDAPGroup = async (req, res) => {
  try {
    const group = await LDAPGroup.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLDAPGroup = async (req, res) => {
  try {
    const group = await LDAPGroup.findById(req.params.id);
    if (group) {
      Object.assign(group, req.body);
      const updatedGroup = await group.save();
      res.status(200).json(updatedGroup);
    } else {
      res.status(404).json({ message: 'LDAP Group not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLDAPGroup = async (req, res) => {
  try {
    const group = await LDAPGroup.findById(req.params.id);
    if (group) {
      await group.deleteOne();
      res.status(200).json({ message: 'LDAP Group removed' });
    } else {
      res.status(404).json({ message: 'LDAP Group not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};