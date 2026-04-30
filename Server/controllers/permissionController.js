import Permission from '../models/Permission.js';

export const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({});
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPermission = async (req, res) => {
  try {
    const permission = await Permission.create(req.body);
    res.status(201).json(permission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};