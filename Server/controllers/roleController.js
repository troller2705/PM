import Role from '../models/Role.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).populate('permission_ids');
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single role by ID
// @route   GET /api/roles/:id
// @access  Private
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permission_ids');
    if (role) {
      res.status(200).json(role);
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private
export const createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (role) {
      Object.assign(role, req.body);
      const updatedRole = await role.save();
      res.status(200).json(updatedRole);
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (role) {
      await role.deleteOne();
      res.status(200).json({ message: 'Role removed' });
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};